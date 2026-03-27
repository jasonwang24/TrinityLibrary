import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { copyId, barcode, isbn } = await req.json();

  let copy;
  let activeCheckout;

  if (isbn) {
    // Find this user's active checkout by ISBN
    const checkout = await prisma.checkout.findFirst({
      where: {
        returnedAt: null,
        userId: session.user.id,
        copy: { resource: { isbn } },
      },
      include: { copy: { include: { resource: true } } },
    });
    if (!checkout) {
      return NextResponse.json({ error: "You don't have this book checked out" }, { status: 400 });
    }
    copy = checkout.copy;
    activeCheckout = checkout;
  } else {
    copy = await prisma.copy.findFirst({
      where: copyId ? { id: copyId } : { barcode },
      include: { resource: true },
    });

    if (!copy) {
      return NextResponse.json({ error: "Copy not found" }, { status: 404 });
    }

    activeCheckout = await prisma.checkout.findFirst({
      where: { copyId: copy.id, returnedAt: null },
    });

    if (!activeCheckout) {
      return NextResponse.json({ error: "No active checkout for this copy" }, { status: 400 });
    }
  }

  const isOwner = activeCheckout.userId === session.user.id;
  const isManager = session.user.role === "MANAGER";
  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [checkout] = await prisma.$transaction([
    prisma.checkout.update({
      where: { id: activeCheckout.id },
      data: { returnedAt: new Date() },
    }),
    prisma.copy.update({
      where: { id: copy.id },
      data: { status: "AVAILABLE" },
    }),
  ]);

  const nextHold = await prisma.hold.findFirst({
    where: { resourceId: copy.resourceId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  if (nextHold) {
    await prisma.$transaction([
      prisma.hold.update({
        where: { id: nextHold.id },
        data: { status: "FULFILLED", notifiedAt: new Date() },
      }),
      prisma.copy.update({
        where: { id: copy.id },
        data: { status: "ON_HOLD" },
      }),
    ]);
  }

  return NextResponse.json({ success: true, holdFulfilled: !!nextHold });
}

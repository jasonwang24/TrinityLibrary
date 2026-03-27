import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const CHECKOUT_DURATION_DAYS = 14;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { copyId, barcode, isbn } = await req.json();

  let copy;
  if (isbn) {
    // Find an available copy by ISBN
    const resource = await prisma.resource.findFirst({
      where: { isbn },
      include: { copies: { where: { status: "AVAILABLE" }, take: 1 } },
    });
    if (!resource) {
      return NextResponse.json({ error: "No book found with that ISBN" }, { status: 404 });
    }
    if (resource.copies.length === 0) {
      return NextResponse.json({ error: `"${resource.title}" has no available copies` }, { status: 400 });
    }
    copy = await prisma.copy.findFirst({
      where: { id: resource.copies[0].id },
      include: { resource: true },
    });
  } else {
    copy = await prisma.copy.findFirst({
      where: copyId ? { id: copyId } : { barcode },
      include: { resource: true },
    });
  }

  if (!copy) {
    return NextResponse.json({ error: "Copy not found" }, { status: 404 });
  }

  if (copy.status === "ON_HOLD") {
    const holdForUser = await prisma.hold.findFirst({
      where: { resourceId: copy.resourceId, userId: session.user.id, status: "FULFILLED" },
    });
    if (!holdForUser) {
      return NextResponse.json({ error: "This copy is on hold for another member" }, { status: 400 });
    }
    await prisma.hold.update({
      where: { id: holdForUser.id },
      data: { status: "CANCELLED" },
    });
  } else if (copy.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Copy is not available" }, { status: 400 });
  }

  await prisma.hold.updateMany({
    where: { resourceId: copy.resourceId, userId: session.user.id, status: { in: ["ACTIVE", "FULFILLED"] } },
    data: { status: "CANCELLED" },
  });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + CHECKOUT_DURATION_DAYS);

  const [checkout] = await prisma.$transaction([
    prisma.checkout.create({
      data: {
        copyId: copy.id,
        userId: session.user.id,
        dueDate,
      },
      include: { copy: { include: { resource: true } }, user: { select: { name: true, email: true } } },
    }),
    prisma.copy.update({
      where: { id: copy.id },
      data: { status: "CHECKED_OUT" },
    }),
  ]);

  return NextResponse.json(checkout, { status: 201 });
}

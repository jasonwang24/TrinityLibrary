import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resourceId } = await req.json();

  const availableCopy = await prisma.copy.findFirst({
    where: { resourceId, status: "AVAILABLE" },
  });

  if (availableCopy) {
    return NextResponse.json(
      { error: "Copies are available — check out directly instead" },
      { status: 400 }
    );
  }

  const activeCheckout = await prisma.checkout.findFirst({
    where: {
      userId: session.user.id,
      returnedAt: null,
      copy: { resourceId },
    },
  });

  if (activeCheckout) {
    return NextResponse.json(
      { error: "You already have this book checked out" },
      { status: 400 }
    );
  }

  const existingHold = await prisma.hold.findFirst({
    where: { resourceId, userId: session.user.id, status: "ACTIVE" },
  });

  if (existingHold) {
    return NextResponse.json({ error: "You already have an active hold" }, { status: 400 });
  }

  const hold = await prisma.hold.create({
    data: { resourceId, userId: session.user.id },
    include: { resource: { select: { title: true } } },
  });

  return NextResponse.json(hold, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { holdId } = await req.json();

  const hold = await prisma.hold.findUnique({ where: { id: holdId } });
  if (!hold || (hold.userId !== session.user.id && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const wasFulfilled = hold.status === "FULFILLED";

  await prisma.hold.update({
    where: { id: holdId },
    data: { status: "CANCELLED" },
  });

  if (wasFulfilled) {
    const heldCopy = await prisma.copy.findFirst({
      where: { resourceId: hold.resourceId, status: "ON_HOLD" },
    });

    if (heldCopy) {
      const nextHold = await prisma.hold.findFirst({
        where: { resourceId: hold.resourceId, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      });

      if (nextHold) {
        await prisma.hold.update({
          where: { id: nextHold.id },
          data: { status: "FULFILLED", notifiedAt: new Date() },
        });
      } else {
        await prisma.copy.update({
          where: { id: heldCopy.id },
          data: { status: "AVAILABLE" },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}

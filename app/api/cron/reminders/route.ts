import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const HOLD_PICKUP_DAYS = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSoon = await prisma.checkout.findMany({
    where: {
      returnedAt: null,
      dueDate: { lte: tomorrow },
    },
    include: {
      user: { select: { name: true, email: true } },
      copy: { include: { resource: { select: { title: true } } } },
    },
  });

  const overdue = dueSoon.filter((c) => new Date(c.dueDate) < today);
  const dueTomorrow = dueSoon.filter(
    (c) => new Date(c.dueDate) >= today && new Date(c.dueDate) <= tomorrow
  );

  const expiryCutoff = new Date();
  expiryCutoff.setDate(expiryCutoff.getDate() - HOLD_PICKUP_DAYS);

  const expiredHolds = await prisma.hold.findMany({
    where: {
      status: "FULFILLED",
      notifiedAt: { lte: expiryCutoff },
    },
    include: {
      resource: {
        include: {
          copies: { where: { status: "ON_HOLD" }, take: 1 },
        },
      },
    },
  });

  let holdsExpired = 0;
  for (const hold of expiredHolds) {
    await prisma.hold.update({
      where: { id: hold.id },
      data: { status: "EXPIRED" },
    });

    const heldCopy = hold.resource.copies[0];
    if (!heldCopy) continue;

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

    holdsExpired++;
  }

  console.log(`Reminders: ${dueTomorrow.length} due tomorrow, ${overdue.length} overdue, ${holdsExpired} holds expired`);

  return NextResponse.json({
    dueTomorrow: dueTomorrow.map((c) => ({
      user: c.user.email,
      book: c.copy.resource.title,
      dueDate: c.dueDate,
    })),
    overdue: overdue.map((c) => ({
      user: c.user.email,
      book: c.copy.resource.title,
      dueDate: c.dueDate,
    })),
    holdsExpired,
  });
}

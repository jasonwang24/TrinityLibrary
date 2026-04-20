import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const HOLD_PICKUP_DAYS = 3;
const MAX_EMAILS_PER_RUN = 10;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find overdue checkouts that haven't been notified yet
  const overdueUnnotified = await prisma.checkout.findMany({
    where: {
      returnedAt: null,
      dueDate: { lt: now },
      overdueNotified: false,
    },
    include: {
      user: { select: { name: true, email: true } },
      copy: { include: { resource: { select: { title: true } } } },
    },
    take: MAX_EMAILS_PER_RUN,
  });

  let emailsSent = 0;
  for (const checkout of overdueUnnotified) {
    try {
      await resend.emails.send({
        from: "Trinity Library <noreply@trinitycambridge.com>",
        to: checkout.user.email,
        subject: `Overdue: "${checkout.copy.resource.title}"`,
        text: `Hi ${checkout.user.name},\n\nYour library book "${checkout.copy.resource.title}" was due on ${new Date(checkout.dueDate).toLocaleDateString()}. Please return it as soon as possible.\n\nThanks,\nTrinity Library`,
      });
      await prisma.checkout.update({
        where: { id: checkout.id },
        data: { overdueNotified: true },
      });
      emailsSent++;
    } catch (e) {
      console.error(`Failed to email ${checkout.user.email}:`, e);
    }
  }

  // Handle expired holds
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

  return NextResponse.json({ emailsSent, holdsExpired });
}

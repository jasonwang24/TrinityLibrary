import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_RENEWALS = 2;
const RENEWAL_DAYS = 30;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { checkoutId } = await req.json();

  const checkout = await prisma.checkout.findUnique({
    where: { id: checkoutId },
    include: { copy: true },
  });

  if (!checkout || checkout.returnedAt) {
    return NextResponse.json({ error: "Checkout not found or already returned" }, { status: 404 });
  }

  if (checkout.userId !== session.user.id && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (checkout.renewals >= MAX_RENEWALS) {
    return NextResponse.json({ error: "Max renewals reached" }, { status: 400 });
  }

  const hasHold = await prisma.hold.findFirst({
    where: { resourceId: checkout.copy.resourceId, status: "ACTIVE" },
  });

  if (hasHold) {
    return NextResponse.json({ error: "Cannot renew — another member has a hold" }, { status: 400 });
  }

  const newDueDate = new Date(checkout.dueDate);
  newDueDate.setDate(newDueDate.getDate() + RENEWAL_DAYS);

  const updated = await prisma.checkout.update({
    where: { id: checkoutId },
    data: { dueDate: newDueDate, renewals: checkout.renewals + 1 },
  });

  return NextResponse.json(updated);
}

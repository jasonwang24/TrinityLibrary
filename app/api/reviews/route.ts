import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  resourceId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { resourceId, rating, text } = parsed.data;

  // Verify user has returned this book at least once
  const completedCheckout = await prisma.checkout.findFirst({
    where: {
      userId: session.user.id,
      returnedAt: { not: null },
      copy: { resourceId },
    },
  });

  if (!completedCheckout) {
    return NextResponse.json(
      { error: "You can only review books you've checked out and returned" },
      { status: 403 }
    );
  }

  const review = await prisma.review.upsert({
    where: {
      resourceId_userId: { resourceId, userId: session.user.id },
    },
    update: { rating, text: text || null },
    create: { resourceId, userId: session.user.id, rating, text: text || null },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(review, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await req.json();

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const isOwner = review.userId === session.user.id;
  const isManager = session.user.role === "MANAGER";
  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ success: true });
}

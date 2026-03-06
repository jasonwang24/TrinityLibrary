import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkouts = await prisma.checkout.findMany({
    where: { userId: session.user.id, returnedAt: null },
    include: {
      copy: {
        include: { resource: { select: { title: true, author: true } } },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(checkouts);
}

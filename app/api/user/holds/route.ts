import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const holds = await prisma.hold.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "FULFILLED"] },
    },
    include: {
      resource: {
        select: {
          id: true,
          title: true,
          author: true,
          copies: {
            where: { status: "ON_HOLD" },
            select: { id: true, barcode: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(holds);
}

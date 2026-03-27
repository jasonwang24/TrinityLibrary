import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await prisma.checkout.findMany({
    where: { userId: session.user.id, returnedAt: { not: null } },
    include: {
      copy: {
        include: { resource: { select: { id: true, title: true, author: true } } },
      },
    },
    orderBy: { returnedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(history);
}

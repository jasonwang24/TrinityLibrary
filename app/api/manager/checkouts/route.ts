import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const checkouts = await prisma.checkout.findMany({
    where: { returnedAt: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
      copy: {
        include: {
          resource: { select: { id: true, title: true, author: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(checkouts);
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isSelf = id === session.user.id;
  if (!isSelf && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const activeCheckouts = await prisma.checkout.count({
    where: { userId: id, returnedAt: null },
  });
  if (activeCheckouts > 0) {
    return NextResponse.json(
      {
        error: isSelf
          ? `You still have ${activeCheckouts} book${activeCheckouts === 1 ? "" : "s"} checked out. Please return ${activeCheckouts === 1 ? "it" : "them"} first.`
          : `User has ${activeCheckouts} book${activeCheckouts === 1 ? "" : "s"} still checked out`,
      },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));

  const featured = await prisma.featuredBook.findMany({
    where: { month, year },
    orderBy: { displayOrder: "asc" },
    include: {
      resource: {
        select: {
          id: true,
          title: true,
          author: true,
          coverImage: true,
          isbn: true,
        },
      },
    },
  });

  return NextResponse.json(featured);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { month, year, books } = await req.json() as {
    month: number;
    year: number;
    books: { resourceId: string; note?: string; recommenderName?: string }[];
  };

  if (!month || !year || !Array.isArray(books)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.featuredBook.deleteMany({ where: { month, year } }),
    ...books.map((b, i) =>
      prisma.featuredBook.create({
        data: {
          resourceId: b.resourceId,
          month,
          year,
          displayOrder: i,
          note: b.note || null,
          recommenderName: b.recommenderName || null,
        },
      })
    ),
  ]);

  return NextResponse.json({ ok: true });
}

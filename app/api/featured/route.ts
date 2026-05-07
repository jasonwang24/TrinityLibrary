import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

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
          description: true,
          copies: { select: { status: true } },
        },
      },
    },
  });

  return NextResponse.json(featured);
}

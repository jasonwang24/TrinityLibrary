import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createResourceSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  type: z.enum(["BOOK", "EBOOK", "JOURNAL", "AUDIOBOOK", "DVD", "OTHER"]),
  publisher: z.string().optional(),
  year: z.number().optional(),
  digitalUrl: z.string().url().optional(),
  tagIds: z.array(z.string()).optional(),
  copies: z.number().min(1).default(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { author: { contains: query } },
      { isbn: { contains: query } },
    ];
  }

  if (tag) where.tags = { some: { tag: { name: tag } } };

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: {
        copies: { select: { id: true, status: true, barcode: true } },
        tags: { include: { tag: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { title: "asc" },
    }),
    prisma.resource.count({ where }),
  ]);

  return NextResponse.json({ resources, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tagIds, copies: copyCount, ...data } = parsed.data;

  const copiesData = Array.from({ length: copyCount }, (_, i) => ({
    barcode: `LIB-${Date.now()}-${i + 1}`,
    status: "AVAILABLE" as const,
  }));

  const resource = await prisma.resource.create({
    data: {
      ...data,
      copies: { create: copiesData },
      tags: tagIds ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: {
      copies: true,
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(resource, { status: 201 });
}

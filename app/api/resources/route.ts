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
  const availability = searchParams.get("availability");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
    ];
  }

  if (tag) where.tags = { some: { tag: { name: tag } } };

  if (availability === "available") {
    where.copies = { some: { status: "AVAILABLE" } };
  } else if (availability === "checked-out") {
    where.copies = { every: { status: { not: "AVAILABLE" } } };
  }

  // Get sorted IDs using raw SQL (pushes non-ASCII titles to end)
  const sortedIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "Resource" ORDER BY (title ~ '^[\\x00-\\x7F]') DESC, title ASC`
  );
  const orderedIds = sortedIds.map((r) => r.id);

  // Apply where filter by fetching matching IDs
  const total = await prisma.resource.count({ where });
  const matchingResources = where && Object.keys(where).length > 0
    ? await prisma.resource.findMany({ where, select: { id: true } })
    : null;
  const matchingIds = matchingResources ? new Set(matchingResources.map((r) => r.id)) : null;
  const filteredIds = matchingIds
    ? orderedIds.filter((id) => matchingIds.has(id))
    : orderedIds;
  const pageIds = filteredIds.slice((page - 1) * limit, page * limit);

  const resourcesUnordered = await prisma.resource.findMany({
    where: { id: { in: pageIds } },
    select: {
      id: true,
      title: true,
      author: true,
      isbn: true,
      coverImage: true,
      type: true,
      copies: { select: { id: true, status: true } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  // Restore the sorted order
  const idOrder = new Map(pageIds.map((id, i) => [id, i]));
  const resources = resourcesUnordered.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

  const resourcesWithRating = resources.map((r) => {
    const avgRating = r.reviews.length > 0
      ? r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length
      : null;
    const { reviews, _count, ...rest } = r;
    return { ...rest, _avgRating: avgRating, _reviewCount: _count.reviews };
  });

  return NextResponse.json({ resources: resourcesWithRating, total, page, totalPages: Math.ceil(total / limit) });
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

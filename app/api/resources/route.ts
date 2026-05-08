import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const httpUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "URL must start with http:// or https://");

const createResourceSchema = z.object({
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(500),
  isbn: z.string().max(20).optional(),
  description: z.string().max(5000).optional(),
  coverImage: httpUrl.optional(),
  type: z.enum(["BOOK", "EBOOK", "JOURNAL", "MAGAZINE", "AUDIOBOOK", "DVD", "OTHER"]),
  publisher: z.string().max(200).optional(),
  year: z.number().int().min(0).max(9999).optional(),
  digitalUrl: httpUrl.optional(),
  tagIds: z.array(z.string()).optional(),
  copies: z.number().min(1).max(100).default(1),
  location: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const tag = searchParams.get("tag");
  const availability = searchParams.get("availability");
  const sort = searchParams.get("sort");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

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

  const select = {
    id: true,
    title: true,
    author: true,
    isbn: true,
    coverImage: true,
    type: true,
    copies: { select: { id: true, status: true } },
    tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    reviews: { select: { rating: true } },
  };

  function attachRatings<T extends { reviews: { rating: number }[] }>(rows: T[]) {
    return rows.map((r) => {
      const avgRating = r.reviews.length > 0
        ? r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length
        : null;
      const { reviews, ...rest } = r;
      return { ...rest, _avgRating: avgRating, _reviewCount: reviews.length };
    });
  }

  if (sort === "rating") {
    const all = await prisma.resource.findMany({ where, select, orderBy: { title: "asc" } });
    const withRatings = attachRatings(all).sort((a, b) => {
      if (a._avgRating === null && b._avgRating === null) return 0;
      if (a._avgRating === null) return 1;
      if (b._avgRating === null) return -1;
      return b._avgRating - a._avgRating;
    });
    const resources = withRatings.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ resources, total: all.length, page, totalPages: Math.ceil(all.length / limit) });
  }

  const [resourcesRaw, total] = await Promise.all([
    prisma.resource.findMany({ where, select, orderBy: { title: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.resource.count({ where }),
  ]);

  return NextResponse.json({ resources: attachRatings(resourcesRaw), total, page, totalPages: Math.ceil(total / limit) });
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

  const { tagIds, copies: copyCount, location, ...data } = parsed.data;

  const copiesData = Array.from({ length: copyCount }, (_, i) => ({
    barcode: `LIB-${Date.now()}-${i + 1}`,
    status: "AVAILABLE" as const,
    location: location || null,
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

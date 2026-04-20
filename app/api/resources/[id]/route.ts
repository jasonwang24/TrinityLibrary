import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const httpUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "URL must start with http:// or https://");

const updateResourceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  author: z.string().min(1).max(500).optional(),
  isbn: z.string().max(20).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  coverImage: httpUrl.nullable().optional(),
  type: z.enum(["BOOK", "EBOOK", "JOURNAL", "MAGAZINE", "AUDIOBOOK", "DVD", "OTHER"]).optional(),
  publisher: z.string().max(200).nullable().optional(),
  year: z.number().int().min(0).max(9999).nullable().optional(),
  digitalUrl: httpUrl.nullable().optional(),
  sortOrder: z.number().int().optional(),
  tagIds: z.array(z.string()).optional(),
  copies: z
    .array(
      z.object({
        id: z.string().optional(),
        location: z.string().max(100).nullable().optional(),
      }),
    )
    .optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      copies: {
        include: {
          checkouts: {
            where: { returnedAt: null },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
      tags: { include: { tag: true } },
      holds: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const avgRating = resource.reviews.length > 0
    ? resource.reviews.reduce((sum, r) => sum + r.rating, 0) / resource.reviews.length
    : null;

  return NextResponse.json({ ...resource, _avgRating: avgRating });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tagIds, copies: copyUpdates, ...data } = parsed.data;

  let copyPlan: {
    toDelete: string[];
    toUpdate: { id: string; location: string | null }[];
    toCreate: { location: string | null }[];
  } | null = null;

  if (copyUpdates) {
    const existing = await prisma.copy.findMany({
      where: { resourceId: id },
      include: { checkouts: true },
    });
    const requestedIds = new Set<string>(
      copyUpdates.filter((c) => c.id).map((c) => c.id as string),
    );
    const toDeleteRecords = existing.filter((e) => !requestedIds.has(e.id));
    const blocked = toDeleteRecords.find(
      (c) => c.status !== "AVAILABLE" || c.checkouts.length > 0,
    );
    if (blocked) {
      return NextResponse.json(
        {
          error: `Cannot remove copy ${blocked.barcode} — it has checkout history or is not available`,
        },
        { status: 400 },
      );
    }
    copyPlan = {
      toDelete: toDeleteRecords.map((c) => c.id),
      toUpdate: copyUpdates
        .filter((c) => c.id)
        .map((c) => ({
          id: c.id as string,
          location: c.location || null,
        })),
      toCreate: copyUpdates
        .filter((c) => !c.id)
        .map((c) => ({ location: c.location || null })),
    };
  }

  if (tagIds) {
    await prisma.resourceTag.deleteMany({ where: { resourceId: id } });
    await prisma.resourceTag.createMany({
      data: tagIds.map((tagId: string) => ({ resourceId: id, tagId })),
    });
  }

  if (copyPlan) {
    if (copyPlan.toDelete.length > 0) {
      await prisma.copy.deleteMany({ where: { id: { in: copyPlan.toDelete } } });
    }
    for (const u of copyPlan.toUpdate) {
      await prisma.copy.update({ where: { id: u.id }, data: { location: u.location } });
    }
    if (copyPlan.toCreate.length > 0) {
      const now = Date.now();
      await prisma.copy.createMany({
        data: copyPlan.toCreate.map((c, i) => ({
          resourceId: id,
          barcode: `LIB-${now}-${i + 1}`,
          status: "AVAILABLE" as const,
          location: c.location,
        })),
      });
    }
  }

  const resource = await prisma.resource.update({
    where: { id },
    data,
    include: {
      copies: {
        include: {
          checkouts: {
            where: { returnedAt: null },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
      tags: { include: { tag: true } },
      holds: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const avgRating = resource.reviews.length > 0
    ? resource.reviews.reduce((sum, r) => sum + r.rating, 0) / resource.reviews.length
    : null;

  return NextResponse.json({ ...resource, _avgRating: avgRating });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.resource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

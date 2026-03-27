import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  const { tagIds, copies: copyUpdates, ...data } = await req.json();

  if (tagIds) {
    await prisma.resourceTag.deleteMany({ where: { resourceId: id } });
    await prisma.resourceTag.createMany({
      data: tagIds.map((tagId: string) => ({ resourceId: id, tagId })),
    });
  }

  if (copyUpdates) {
    for (const copy of copyUpdates) {
      await prisma.copy.update({
        where: { id: copy.id },
        data: { location: copy.location },
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
    },
  });

  return NextResponse.json(resource);
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

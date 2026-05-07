import { prisma } from "../lib/db";

async function main() {
  const resources = await prisma.resource.findMany({
    take: 6,
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, author: true },
  });

  if (resources.length === 0) {
    console.log("No resources found in database.");
    return;
  }

  console.log("Found resources:", resources.map((r) => r.title).join(", "));

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.featuredBook.deleteMany({ where: { month, year } });

  const notes = [
    "A thought-provoking read that our community has loved.",
    "Highly recommended by our pastoral team.",
    "Perfect for anyone exploring this topic for the first time.",
    "A timeless classic worth revisiting.",
    "One of our most frequently borrowed books.",
    "A wonderful addition to any personal library.",
  ];

  const recommenders = ["Pastor Andrew", "Elder Sarah", "Pastor Andrew", "Elder James", "Pastor Andrew", "Elder Sarah"];

  for (let i = 0; i < resources.length; i++) {
    await prisma.featuredBook.create({
      data: {
        resourceId: resources[i].id,
        month,
        year,
        displayOrder: i,
        note: notes[i],
        recommenderName: recommenders[i],
      },
    });
  }

  console.log(`Set ${resources.length} featured books for ${month}/${year}`);
}

main().finally(() => prisma.$disconnect());

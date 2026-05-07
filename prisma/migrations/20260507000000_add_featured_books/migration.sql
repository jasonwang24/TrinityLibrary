-- CreateTable
CREATE TABLE "FeaturedBook" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "FeaturedBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeaturedBook_month_year_idx" ON "FeaturedBook"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBook_resourceId_month_year_key" ON "FeaturedBook"("resourceId", "month", "year");

-- AddForeignKey
ALTER TABLE "FeaturedBook" ADD CONSTRAINT "FeaturedBook_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

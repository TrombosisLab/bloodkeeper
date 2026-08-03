-- CreateEnum
CREATE TYPE "InventoryItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "character_inventory_items" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "category" TEXT,
    "notes" TEXT,
    "status" "InventoryItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "character_inventory_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "character_inventory_items_name_required" CHECK (length(btrim("name")) > 0),
    CONSTRAINT "character_inventory_items_quantity_positive" CHECK ("quantity" >= 1),
    CONSTRAINT "character_inventory_items_description_not_blank" CHECK ("description" IS NULL OR length(btrim("description")) > 0),
    CONSTRAINT "character_inventory_items_category_not_blank" CHECK ("category" IS NULL OR length(btrim("category")) > 0),
    CONSTRAINT "character_inventory_items_notes_not_blank" CHECK ("notes" IS NULL OR length(btrim("notes")) > 0)
);

-- CreateTable
CREATE TABLE "character_notes" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "character_notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "character_notes_content_required" CHECK (length(btrim("content")) > 0)
);

-- CreateTable
CREATE TABLE "character_history_entries" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "character_history_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "character_history_entries_title_required" CHECK (length(btrim("title")) > 0),
    CONSTRAINT "character_history_entries_description_required" CHECK (length(btrim("description")) > 0)
);

-- CreateIndex
CREATE INDEX "character_inventory_items_characterId_status_idx" ON "character_inventory_items"("characterId", "status");

-- CreateIndex
CREATE INDEX "character_notes_characterId_idx" ON "character_notes"("characterId");

-- CreateIndex
CREATE INDEX "character_history_entries_characterId_idx" ON "character_history_entries"("characterId");

-- AddForeignKey
ALTER TABLE "character_inventory_items" ADD CONSTRAINT "character_inventory_items_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_notes" ADD CONSTRAINT "character_notes_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_history_entries" ADD CONSTRAINT "character_history_entries_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

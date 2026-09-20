ALTER TABLE "chronicle_map_markers" ADD COLUMN IF NOT EXISTS "size" TEXT NOT NULL DEFAULT 'large';
ALTER TABLE "chronicle_map_areas" ADD COLUMN IF NOT EXISTS "fillColor" TEXT;
ALTER TABLE "chronicle_map_areas" ADD COLUMN IF NOT EXISTS "labelColor" TEXT;
ALTER TABLE "chronicle_map_areas" ADD COLUMN IF NOT EXISTS "labelSize" TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE "chronicle_map_areas" ADD COLUMN IF NOT EXISTS "labelVertical" TEXT NOT NULL DEFAULT 'top';
ALTER TABLE "chronicle_map_areas" ADD COLUMN IF NOT EXISTS "labelHorizontal" TEXT NOT NULL DEFAULT 'left';

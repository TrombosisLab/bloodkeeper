-- SPEC-022: make Character ownership and optional Chronicle association
-- explicit database relationships.
--
-- The migration deliberately refuses to continue if historical orphan rows
-- exist. Fixture cleanup is performed separately and explicitly before deploy.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "characters" AS c
        LEFT JOIN "users" AS u
          ON u."id" = c."ownerId"
        WHERE u."id" IS NULL
    ) THEN
        RAISE EXCEPTION
          'SPEC-022 cannot add owner FK while orphan character owners exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "characters" AS c
        LEFT JOIN "chronicles" AS ch
          ON ch."id" = c."chronicleId"
        WHERE
          c."chronicleId" IS NOT NULL
          AND ch."id" IS NULL
    ) THEN
        RAISE EXCEPTION
          'SPEC-022 cannot add chronicle FK while orphan chronicle references exist';
    END IF;
END
$$;

ALTER TABLE "characters"
ADD CONSTRAINT "characters_ownerId_fkey"
FOREIGN KEY ("ownerId")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "characters"
ADD CONSTRAINT "characters_chronicleId_fkey"
FOREIGN KEY ("chronicleId")
REFERENCES "chronicles"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- SPEC-031.A: participación contextual explícita en Crónicas.

CREATE TYPE "ChronicleParticipantRole"
AS ENUM ('NARRATOR', 'PLAYER');

CREATE TYPE "ChronicleParticipantStatus"
AS ENUM ('ACTIVE', 'RETIRED');

CREATE TABLE "chronicle_participants" (
  "id" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "ChronicleParticipantRole" NOT NULL,
  "status" "ChronicleParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "chronicle_participants_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "chronicle_participants_chronicleId_userId_key"
ON "chronicle_participants"("chronicleId", "userId");

CREATE INDEX
  "chronicle_participants_chronicleId_role_status_idx"
ON "chronicle_participants"("chronicleId", "role", "status");

CREATE INDEX
  "chronicle_participants_userId_status_idx"
ON "chronicle_participants"("userId", "status");

ALTER TABLE "chronicle_participants"
ADD CONSTRAINT "chronicle_participants_chronicleId_fkey"
FOREIGN KEY ("chronicleId")
REFERENCES "chronicles"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "chronicle_participants"
ADD CONSTRAINT "chronicle_participants_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Las Crónicas existentes conservan al narrador principal de SPEC-030
-- como miembro contextual Narrador cuando la cuenta referenciada existe.
INSERT INTO "chronicle_participants" (
  "id",
  "chronicleId",
  "userId",
  "role",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  c."id",
  c."narratorId",
  'NARRATOR'::"ChronicleParticipantRole",
  'ACTIVE'::"ChronicleParticipantStatus",
  c."createdAt",
  c."updatedAt"
FROM "chronicles" AS c
INNER JOIN "users" AS u
  ON u."id" = c."narratorId"
ON CONFLICT ("chronicleId", "userId")
DO NOTHING;

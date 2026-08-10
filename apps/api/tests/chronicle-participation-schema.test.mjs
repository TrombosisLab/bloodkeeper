import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL(
    '../prisma/schema.prisma',
    import.meta.url,
  ),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/'
      + '20260809211000_add_chronicle_participation/'
      + 'migration.sql',
    import.meta.url,
  ),
  'utf8',
)

test(
  '031-A modela una relación explícita Usuario ↔ Crónica',
  () => {
    assert.match(
      schema,
      /model ChronicleParticipant \{/,
    )
    assert.match(
      schema,
      /chronicleId\s+String\s+@db\.Uuid/,
    )
    assert.match(
      schema,
      /userId\s+String\s+@db\.Uuid/,
    )
    assert.match(
      schema,
      /@@unique\(\[chronicleId, userId\]\)/,
    )
    assert.match(
      schema,
      /participants\s+ChronicleParticipant\[\]\s+@relation\("ChronicleParticipantChronicle"\)/,
    )
    assert.match(
      schema,
      /chronicleParticipations\s+ChronicleParticipant\[\]\s+@relation\("ChronicleParticipantUser"\)/,
    )
  },
)

test(
  '031-A persiste sólo los roles contextuales Narrador y Jugador',
  () => {
    assert.match(
      schema,
      /enum ChronicleParticipantRole \{\s*NARRATOR\s+PLAYER\s*\}/s,
    )
    assert.match(
      schema,
      /role\s+ChronicleParticipantRole/,
    )
    assert.doesNotMatch(
      schema,
      /ChronicleParticipantRole \{[\s\S]*(?:ADMIN|OWNER|GUEST)/,
    )
  },
)

test(
  '031-A persiste estados Activo y Retirado para preservar historia',
  () => {
    assert.match(
      schema,
      /enum ChronicleParticipantStatus \{\s*ACTIVE\s+RETIRED\s*\}/s,
    )
    assert.match(
      schema,
      /status\s+ChronicleParticipantStatus\s+@default\(ACTIVE\)/,
    )
    assert.match(
      schema,
      /createdAt\s+DateTime[\s\S]*updatedAt\s+DateTime/,
    )
  },
)

test(
  '031-A mantiene integridad referencial sin borrado destructivo',
  () => {
    assert.match(
      schema,
      /chronicle\s+Chronicle\s+@relation\("ChronicleParticipantChronicle"[\s\S]*onDelete:\s*Restrict/,
    )
    assert.match(
      schema,
      /user\s+User\s+@relation\("ChronicleParticipantUser"[\s\S]*onDelete:\s*Restrict/,
    )
    assert.match(
      migration,
      /REFERENCES "chronicles"\("id"\)[\s\S]*ON DELETE RESTRICT/,
    )
    assert.match(
      migration,
      /REFERENCES "users"\("id"\)[\s\S]*ON DELETE RESTRICT/,
    )
  },
)

test(
  '031-A permite múltiples narradores sin duplicar la misma membresía',
  () => {
    assert.match(
      migration,
      /"role" "ChronicleParticipantRole" NOT NULL/,
    )

    const uniqueIndexes =
      migration.match(
        /CREATE UNIQUE INDEX[\s\S]*?;/g,
      ) ?? []

    assert.equal(
      uniqueIndexes.length,
      1,
    )
    assert.match(
      uniqueIndexes[0],
      /ON "chronicle_participants"\("chronicleId", "userId"\);/,
    )
    assert.match(
      migration,
      /CREATE INDEX[\s\S]*?ON "chronicle_participants"\("chronicleId", "role", "status"\);/,
    )
  },
)

test(
  '031-A migra el narrador principal existente a membresía contextual',
  () => {
    assert.match(
      migration,
      /INSERT INTO "chronicle_participants"/,
    )
    assert.match(
      migration,
      /c\."narratorId"/,
    )
    assert.match(
      migration,
      /'NARRATOR'::"ChronicleParticipantRole"/,
    )
    assert.match(
      migration,
      /INNER JOIN "users"/,
    )
    assert.match(
      migration,
      /ON CONFLICT \("chronicleId", "userId"\)\s*DO NOTHING/,
    )
  },
)

test(
  '031-A no adelanta invitaciones ni mecanismos diferidos',
  () => {
    const combined =
      schema + '\n' + migration

    assert.doesNotMatch(
      combined,
      /invitation|inviteCode|accessCode|joinRequest/i,
    )
  },
)

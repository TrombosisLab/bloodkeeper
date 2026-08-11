import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const schema = readFileSync(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = readFileSync(
  new URL(
    '../prisma/migrations/20260810214500_add_character_experience_ledger/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function block(source, startPattern) {
  const start = source.search(startPattern)
  assert.notEqual(start, -1)
  const remaining = source.slice(start)
  const end = remaining.indexOf('\n}')
  assert.notEqual(end, -1)
  return remaining.slice(0, end + 2)
}

test(
  '056-A conserva concesiones gastos y correcciones en un ledger mecanico',
  () => {
    const movementType = block(
      schema,
      /enum CharacterExperienceMovementType\s*\{/,
    )
    const component = block(
      schema,
      /enum CharacterExperienceComponent\s*\{/,
    )
    const movement = block(
      schema,
      /model CharacterExperienceMovement\s*\{/,
    )

    for (const value of ['GRANT', 'SPEND', 'CORRECTION']) {
      assert.match(movementType, new RegExp('\\b' + value + '\\b'))
    }
    assert.match(component, /\bEARNED\b/)
    assert.match(component, /\bSPENT\b/)
    assert.match(movement, /amount\s+Int/)
    assert.match(movement, /reason\s+String/)
    assert.match(movement, /createdAt\s+DateTime\s+@default\(now\(\)\)/)
    assert.doesNotMatch(
      schema,
      /experienceTotal|experienceSpent|experienceAvailable|totalExperience|spentExperience|availableExperience/i,
    )
  },
)

test(
  '056-A relaciona cada movimiento con personaje actor sesion opcional y correccion',
  () => {
    const movement = block(
      schema,
      /model CharacterExperienceMovement\s*\{/,
    )

    assert.match(movement, /characterId\s+String\s+@db\.Uuid/)
    assert.match(movement, /actorId\s+String\s+@db\.Uuid/)
    assert.match(movement, /sessionId\s+String\?\s+@db\.Uuid/)
    assert.match(movement, /correctsMovementId\s+String\?\s+@db\.Uuid/)
    assert.match(movement, /CharacterExperienceCharacter/)
    assert.match(movement, /CharacterExperienceActor/)
    assert.match(movement, /CharacterExperienceSession/)
    assert.match(movement, /CharacterExperienceCorrection/)
    assert.match(movement, /@@unique\(\[characterId, deduplicationKey\]\)/)
  },
)

test(
  '056-A migra un ledger inmutable con semantica y claves foraneas explicitas',
  () => {
    assert.match(migration, /CREATE TYPE "CharacterExperienceMovementType"/)
    assert.match(migration, /CREATE TYPE "CharacterExperienceComponent"/)
    assert.match(migration, /CREATE TABLE "character_experience_movements"/)
    assert.match(migration, /character_experience_movements_semantics_check/)
    assert.match(migration, /character_experience_movements_reason_check/)
    assert.match(migration, /character_experience_movements_characterId_deduplicationKey_key/)
    assert.match(migration, /REFERENCES "characters"\("id"\)/)
    assert.match(migration, /REFERENCES "users"\("id"\)/)
    assert.match(migration, /REFERENCES "chronicle_sessions"\("id"\)/)
    assert.match(migration, /reject_character_experience_movement_mutation/)
    assert.match(migration, /BEFORE UPDATE OR DELETE/)
  },
)

test(
  '056-A no crea modelos paralelos de rasgos ni automatiza concesiones',
  () => {
    const movement = block(
      schema,
      /model CharacterExperienceMovement\s*\{/,
    )

    assert.doesNotMatch(
      movement,
      /attributeRating|skillRating|disciplineRating|bloodPotency|advantageRating/i,
    )
    assert.doesNotMatch(
      migration,
      /UPDATE\s+"characters"|INSERT\s+INTO\s+"character_experience_movements"/i,
    )
  },
)

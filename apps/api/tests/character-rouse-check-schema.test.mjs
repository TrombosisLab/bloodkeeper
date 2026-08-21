import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const schema =
  fs.readFileSync(
    'prisma/schema.prisma',
    'utf8',
  )

const migration =
  fs.readFileSync(
    'prisma/migrations/20260821220000_add_character_rouse_check_operations/migration.sql',
    'utf8',
  )

function block(
  source,
  pattern,
) {
  const match =
    source.match(pattern)

  assert.ok(match)
  return match[0]
}

test(
  '059-B schema crea ledger Rouse con operación e historial único',
  () => {
    const model =
      block(
        schema,
        /model CharacterRouseCheckOperation\s*\{[\s\S]*?\n\}/,
      )

    assert.match(
      model,
      /@@id\(\[characterId, operationId\]\)/,
    )
    assert.match(
      model,
      /rollHistoryId\s+String\s+@unique\s+@db\.Uuid/,
    )
    assert.match(
      model,
      /rollHistory\s+DiceRollRecord\s+@relation\("RouseCheckHistory"/,
    )
    assert.match(
      model,
      /characterRevision\s+Int/,
    )
  },
)

test(
  '059-B no añade operationId ni nueva fuente ROUSE a DiceRollRecord',
  () => {
    const dice =
      block(
        schema,
        /model DiceRollRecord\s*\{[\s\S]*?\n\}/,
      )

    assert.doesNotMatch(
      dice,
      /operationId\s+/,
    )

    const source =
      block(
        schema,
        /enum DiceRollSource\s*\{[\s\S]*?\n\}/,
      )

    assert.doesNotMatch(
      source,
      /ROUSE/,
    )
    assert.match(source, /ACTION/)
  },
)

test(
  '059-B migración protege Hambre resultado consecuencia y vínculos',
  () => {
    assert.match(
      migration,
      /CREATE TABLE "character_rouse_check_operations"/,
    )
    assert.match(
      migration,
      /"hungerBefore" BETWEEN 0 AND 5/,
    )
    assert.match(
      migration,
      /"hungerAfter" BETWEEN 0 AND 5/,
    )
    assert.match(
      migration,
      /"consequenceDifficulty" = 4/,
    )
    assert.match(
      migration,
      /REFERENCES "dice_roll_records"\("id"\)/,
    )
    assert.match(
      migration,
      /REFERENCES "users"\("id"\)/,
    )
  },
)

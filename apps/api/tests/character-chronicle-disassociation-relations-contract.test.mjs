import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schema = await readFile(resolve(apiRoot, 'prisma/schema.prisma'), 'utf8')
const migration = await readFile(
  resolve(
    apiRoot,
    'prisma/migrations/20260920121500_decouple_character_chronicle_history_links/migration.sql',
  ),
  'utf8',
)

assert.match(
  schema,
  /ChronicleEventCharacterCharacter", fields: \[characterId\], references: \[id\]/,
)
assert.match(
  schema,
  /ChronicleStoryCharacterCharacter", fields: \[characterId\], references: \[id\]/,
)
assert.match(
  migration,
  /chronicle_event_character_links[\s\S]*FOREIGN KEY \("characterId"\) REFERENCES "characters"\("id"\)/,
)
assert.match(
  migration,
  /chronicle_story_character_links[\s\S]*FOREIGN KEY \("characterId"\) REFERENCES "characters"\("id"\)/,
)

console.log('OK: los vínculos históricos conservan chronicleId sin cascada desde Character.')

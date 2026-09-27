import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
const resource = await readFile(new URL('../src/chronicles/presentation/chronicle-resource.controller.ts', import.meta.url), 'utf8')
const notebook = await readFile(new URL('../src/chronicles/presentation/chronicle-notebook.controller.ts', import.meta.url), 'utf8')
const access = await readFile(new URL('../src/chronicles/presentation/chronicle-note-reference-access.ts', import.meta.url), 'utf8')
const map = await readFile(new URL('../src/chronicles/presentation/chronicle-map.controller.ts', import.meta.url), 'utf8')

test('recursos guardan audiencia por vinculación y respetan la audiencia seleccionada', () => {
  assert.match(schema, /model ChronicleResourceAudience/)
  assert.match(resource, /selected_players/)
  assert.match(resource, /audienceUserIds/)
  assert.match(notebook, /visibility: 'selected_players'/)
  assert.match(access, /selected_players/)
  assert.match(map, /selected_players/)
})

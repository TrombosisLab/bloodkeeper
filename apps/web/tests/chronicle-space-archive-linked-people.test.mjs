import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url),
  'utf8',
)

test('archive merges linked catalogue NPCs and locations into the people and places sections', () => {
  assert.match(component, /archiveResources\.filter\(\(item\) => item\.kind === 'NPC'\)/)
  assert.match(component, /archiveResources\.filter\(\(item\) => item\.kind === 'LOCATION'\)/)
  assert.match(component, /Archive title="Personas" count=\{archivePeople\.length\}/)
  assert.match(component, /Archive title="Lugares" count=\{archivePlaces\.length\}/)
  assert.match(component, /targetType: 'NPC', targetId: item\.id/)
  assert.match(component, /targetType: 'LOCATION', targetId: item\.id/)
})

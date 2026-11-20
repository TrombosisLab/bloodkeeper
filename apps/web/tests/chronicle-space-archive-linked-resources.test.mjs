import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url),
  'utf8',
)

test('archive includes chronicle-linked catalogue NPCs and locations', () => {
  assert.match(component, /archiveResources\.filter\(\(item\) => item\.kind === 'NPC'\)/)
  assert.match(component, /archiveResources\.filter\(\(item\) => item\.kind === 'LOCATION'\)/)
  assert.match(component, /const archivePeople = useMemo/)
  assert.match(component, /const archivePlaces = useMemo/)
})

test('archive deduplicates legacy and catalogue entries by resource id', () => {
  assert.match(component, /items\.findIndex\(\(candidate\) => candidate\.id === item\.id\)/)
})

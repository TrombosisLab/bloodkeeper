import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const component = fs.readFileSync(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')

test('separa crónicas activas y archivadas en el selector global', () => {
  assert.match(component, /const activeChronicles = useMemo\(\(\) => chronicles\.filter\(\(item\) => item\.status !== 'archived'\)/)
  assert.match(component, /const archivedChronicles = useMemo\(\(\) => chronicles\.filter\(\(item\) => item\.status === 'archived'\)/)
  assert.match(component, /<optgroup label="Activas">/)
  assert.match(component, /<optgroup label="Archivadas">/)
  assert.match(component, /\{item\.name\} · Archivada/)
})

import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (relative) => fs.readFileSync(new URL(relative, root), 'utf8')

test('SPEC-066 instala el inventario visual completo', () => {
  const groups = [
    ['public/assets/v5/clans/symbols/', 16],
    ['public/assets/v5/clans/logos/', 16],
    ['public/assets/v5/disciplines/', 12],
  ]
  for (const [relative, expected] of groups) {
    const files = fs.readdirSync(new URL(relative, root)).filter((name) => name.endsWith('.png'))
    assert.equal(files.length, expected, relative)
    files.forEach((name) => assert.deepEqual([...fs.readFileSync(new URL(relative + name, root)).subarray(0, 8)], [137,80,78,71,13,10,26,10]))
  }
})

test('SPEC-066 usa un catálogo y componente únicos', () => {
  const catalog = read('src/features/v5-visuals/v5-visual-catalog.ts')
  assert.match(catalog, /banuHaqim/)
  assert.match(catalog, /thinBloodAlchemy/)
  assert.match(catalog, /resolveClanVisual/)
  assert.match(catalog, /resolveDisciplineVisual/)
  assert.match(read('src/features/v5-visuals/V5VisualMark.tsx'), /mask|v5-visual-mark/)
})

test('SPEC-066 alcanza las superficies operativas', () => {
  const targets = [
    'src/features/character-creation/components/IdentityStep.tsx',
    'src/features/character-creation/components/DisciplineEditorCard.tsx',
    'src/features/character-sheet/components/CharacterIdentity.tsx',
    'src/features/character-sheet/components/DisciplineCard.tsx',
    'src/features/chronicles/components/ChronicleNpcDeepDossier.tsx',
    'src/features/chronicles/components/ChroniclePlayWorkspace.tsx',
  ]
  targets.forEach((target) => assert.match(read(target), /V5VisualMark/, target))
  assert.match(read('src/main.tsx'), /v5-visual-assets\.css/)
})

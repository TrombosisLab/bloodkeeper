import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

const [panel, sheet, api, css, draftApi, skills, disciplines, advantages, readModel, review] = await Promise.all([
  read('../src/features/character-sheet/components/PersistedCharacterExperience.tsx'),
  read('../src/features/character-sheet/components/CharacterSheet.tsx'),
  read('../src/features/character-sheet/infrastructure/character-experience.api.ts'),
  read('../src/styles/character-experience.css'),
  read('../src/features/character-creation/infrastructure/character-draft.api.ts'),
  read('../src/features/character-creation/types/character-skills-draft.types.ts'),
  read('../src/features/character-creation/types/discipline.types.ts'),
  read('../src/features/character-creation/types/character-advantages-draft.types.ts'),
  read('../src/features/character-sheet/domain/character-advantage-read-model.ts'),
  read('../src/features/character-creation/components/ReviewStep.tsx'),
])

test('056-E sustituye los números demo por ledger persistido', () => {
  assert.match(sheet, /PersistedCharacterExperience/)
  assert.match(panel, /data-xp-summary="loaded"/)
  assert.match(panel, /ledger\.available/)
  assert.match(panel, /ledger\.spent/)
  assert.match(panel, /ledger\.total/)
  assert.match(panel, /Historial de Experiencia/)
})

test('056-E exige previsualización backend antes de confirmar', () => {
  assert.match(panel, /resolvedGateway\.preview/)
  assert.match(panel, /preview\.eligible/)
  assert.match(panel, /preview\.revision/)
  assert.match(panel, /function createEvolutionOperationId/)
  assert.match(panel, /cryptoApi\?\.randomUUID/)
  assert.match(panel, /cryptoApi\?\.getRandomValues/)
  assert.match(panel, /Math\.random/)
  assert.match(panel, /createEvolutionOperationId\(\)/)
  assert.doesNotMatch(panel, /globalThis\.crypto\.randomUUID\(\)/)
  assert.match(panel, /resolvedGateway\.purchase/)
  assert.doesNotMatch(panel, /(?:cost|coste)\s*[=:]\s*[^\n]*(?:\*|\bx\b)\s*(?:3|5|6|7|10)\b/i)
  assert.doesNotMatch(api, /(?:cost|coste)\s*[=:]\s*[^\n]*(?:\*|\bx\b)\s*(?:3|5|6|7|10)\b/i)
})

test('056-E permite todas las familias de compra definidas por 056-D', () => {
  for (const kind of ['attribute', 'skill', 'specialty', 'discipline', 'ritual', 'formula', 'ceremony', 'advantage', 'bloodPotency']) {
    assert.equal(panel.includes(`${kind}:`), true, `Falta etiqueta ${kind}`)
  }
  assert.match(panel, /AdvantageInstanceDetailsEditor/)
  assert.match(panel, /parentSelectionId/)
})

test('056-E recarga ficha tras compra y bloquea archivados', () => {
  assert.match(panel, /onPurchased\?\.\(\)/)
  assert.match(panel, /status !== 'archived'/)
  assert.match(sheet, /onPurchased=\{onStateReload\}/)
})

test('056-E acepta origen evolution al recargar modelos canónicos', () => {
  for (const source of [draftApi, skills, disciplines, advantages, readModel, review]) {
    assert.match(source, /evolution/)
  }
  assert.match(readModel, /evolution:\s*'Evolución'/)
})

test('056-E incorpora estados visuales y adaptación móvil', () => {
  assert.match(panel, /data-xp-panel="ready"/)
  assert.match(panel, /data-xp-preview=/)
  assert.match(css, /SPEC-056-E/)
  assert.match(css, /@media \(max-width: 760px\)/)
  assert.match(css, /persisted-experience__preview-card--eligible/)
  assert.match(css, /persisted-experience__preview-card--rejected/)
})

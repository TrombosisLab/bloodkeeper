import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relative) =>
  readFile(
    new URL(relative, import.meta.url),
    'utf8',
  )

const [
  resonance,
  experience,
] = await Promise.all([
  read('../src/features/character-sheet/components/CharacterBloodExperience.tsx'),
  read('../src/features/character-sheet/components/PersistedCharacterExperience.tsx'),
])

test(
  'AUD-XP separa los nombres accesibles de Resonancia y Experiencia',
  () => {
    assert.match(
      resonance,
      /aria-labelledby="blood-resonance-title"/,
    )
    assert.match(
      resonance,
      /id="blood-resonance-title"/,
    )
    assert.match(
      experience,
      /aria-labelledby="blood-experience-title"/,
    )
    assert.match(
      experience,
      /id="blood-experience-title"/,
    )

    const sectionIds = [
      ...resonance.matchAll(/\bid="([^"]+)"/g),
      ...experience.matchAll(/\bid="([^"]+)"/g),
    ].map((match) => match[1])

    assert.equal(
      new Set(sectionIds).size,
      sectionIds.length,
    )
  },
)

test(
  'AUD-XP presenta motivos legibles para ambas compras',
  () => {
    assert.match(
      experience,
      /advancement_purchase:\s*'Compra de evolución'/,
    )
    assert.match(
      experience,
      /advancement_purchase_dyscrasia:\s*'Compra de evolución con Discrasia'/,
    )
  },
)

test(
  'AUD-XP excluye del selector las Disciplinas sin Poderes',
  () => {
    assert.match(
      experience,
      /const purchasableDisciplineDefinitions[\s\S]*disciplinePowerDefinitions\.some/,
    )
    assert.match(
      experience,
      /purchasableDisciplineDefinitions\.map/,
    )
  },
)

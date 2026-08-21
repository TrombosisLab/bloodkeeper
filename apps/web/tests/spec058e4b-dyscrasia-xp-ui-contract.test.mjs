import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const read = (relative) =>
  readFile(
    new URL(
      relative,
      import.meta.url,
    ),
    'utf8',
  )

const [
  experience,
  sheet,
  blood,
  css,
] = await Promise.all([
  read(
    '../src/features/character-sheet/components/PersistedCharacterExperience.tsx',
  ),
  read(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
  ),
  read(
    '../src/features/character-sheet/components/CharacterBloodExperience.tsx',
  ),
  read(
    '../src/styles/character-experience.css',
  ),
])

test('058-E4B ofrece opt-in sólo desde una compra de Disciplina con Discrasia activa', () => {
  assert.match(
    experience,
    /characterBloodDyscrasiaCatalog/,
  )
  assert.match(
    experience,
    /blood\?: CharacterBloodExperience \| null/,
  )
  assert.match(
    experience,
    /kind === 'discipline'[\s\S]*activeDyscrasia !== null/,
  )
  assert.match(
    experience,
    /data-xp-dyscrasia-option="available"/,
  )
  assert.match(
    experience,
    /type="checkbox"/,
  )
  assert.match(
    experience,
    /Usar Discrasia activa/,
  )
  assert.match(
    sheet,
    /<PersistedCharacterExperience[\s\S]*blood=\{model\.blood\}/,
  )
})

test('058-E4B invalida preview al cambiar opt-in y mantiene paridad preview/purchase', () => {
  assert.match(
    experience,
    /setUseDyscrasiaExperience\([\s\S]*event\.target\.checked[\s\S]*\)[\s\S]*resetPreview\(\)/,
  )
  assert.match(
    experience,
    /resolvedGateway\.preview\([\s\S]*characterId,[\s\S]*request,[\s\S]*useDyscrasiaExperienceForRequest/,
  )
  assert.match(
    experience,
    /resolvedGateway\.purchase\([\s\S]*characterId,[\s\S]*preview\.revision,[\s\S]*createEvolutionOperationId\(\),[\s\S]*request,[\s\S]*useDyscrasiaExperienceForRequest/,
  )
  assert.match(
    experience,
    /setUseDyscrasiaExperience\(false\)[\s\S]*setShowEvolution\(false\)/,
  )
})

test('058-E4B deja coste y compatibilidad bajo autoridad backend', () => {
  assert.match(
    experience,
    /El backend comprobará si[\s\S]*puede beneficiar a esta Disciplina/,
  )
  assert.match(
    experience,
    /El coste mostrado ya es el[\s\S]*valor autoritativo calculado por el backend/,
  )
  assert.match(
    experience,
    /preview\.cost/,
  )
  assert.match(
    experience,
    /Discrasia[\s\S]*se consumirá para esta adquisición/,
  )

  for (const forbidden of [
    'sourceBloodOperationId',
    'dyscrasiaKey:',
    'discount:',
  ]) {
    assert.equal(
      experience.includes(forbidden),
      false,
      `la UI no debe controlar ${forbidden}`,
    )
  }
})

test('058-E4B presenta Afinidad especial y mantiene tarjeta de Discrasia sin estado activo', () => {
  assert.match(
    blood,
    /Afinidad especial/,
  )
  assert.match(
    blood,
    /specialAffinityKey/,
  )
  assert.match(
    blood,
    /Sin Discrasia activa/,
  )

  const cardOccurrences =
    blood.match(
      /className="blood-info-card"/g,
    )?.length ?? 0

  assert.equal(
    cardOccurrences >= 3,
    true,
  )
})

test('058-E4B reutiliza estilos existentes sin adoptar el visual standby de main', () => {
  assert.match(
    css,
    /SPEC-058-E4B — DISCRASIA XP OPT-IN/,
  )
  assert.match(
    css,
    /\.persisted-experience__dyscrasia-option/,
  )
  assert.match(
    css,
    /\.persisted-experience__dyscrasia-preview/,
  )
  assert.match(
    css,
    /@media \(max-width: 760px\)/,
  )
  assert.doesNotMatch(
    experience,
    /bloodkeeper-visual-system/,
  )
  assert.doesNotMatch(
    blood,
    /bloodkeeper-visual-system/,
  )
})

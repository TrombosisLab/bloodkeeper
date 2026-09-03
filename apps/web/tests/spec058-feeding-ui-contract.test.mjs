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
  gateway,
  feeding,
  blood,
  sheet,
  css,
  apiTypes,
] = await Promise.all([
  read(
    '../src/features/character-sheet/infrastructure/character-blood-resonance.api.ts',
  ),
  read(
    '../src/features/character-sheet/components/PersistedCharacterFeeding.tsx',
  ),
  read(
    '../src/features/character-sheet/components/CharacterBloodExperience.tsx',
  ),
  read(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
  ),
  read(
    '../src/styles/character-sheet.css',
  ),
  read(
    '../src/features/character-sheet/types/character-blood-resonance-persistence.types.ts',
  ),
])

test('058 UI usa exclusivamente el endpoint mecánico existente', () => {
  assert.match(
    gateway,
    /\/api\/characters\/\$\{encodeURIComponent\(characterId\)\}\/blood\/resonance/,
  )
  assert.match(
    gateway,
    /method: 'POST'/,
  )
  assert.match(
    gateway,
    /credentials: 'include'/,
  )
  assert.match(
    gateway,
    /parseCharacterDraftApiSnapshotResponse/,
  )
  assert.match(
    gateway,
    /cryptoApi\.randomUUID/,
  )
  assert.match(
    gateway,
    /cryptoApi\.getRandomValues/,
  )
  assert.match(
    gateway,
    /new Uint8Array\(16\)/,
  )
  assert.match(
    gateway,
    /\(bytes\[6\] & 0x0f\) \| 0x40/,
  )
  assert.match(
    gateway,
    /\(bytes\[8\] & 0x3f\) \| 0x80/,
  )

  assert.doesNotMatch(
    gateway,
    /\/state/,
  )
})

test('058 UI envía sólo el contrato de alimentación autorizado', () => {
  for (const token of [
    'expectedRevision',
    'operationId',
    'sourceKind',
    'resonanceKey',
    'specialAffinityKey',
    'temperament',
    'dyscrasiaKey',
    'dyscrasiaAcquisitionMode',
    'hungerSlaked',
  ]) {
    assert.match(
      apiTypes,
      new RegExp(token),
    )
  }

  for (const forbidden of [
    'diceBonus',
    'discount',
    'sourceBloodOperationId',
    'hungerAfter',
    'hungerBefore',
  ]) {
    assert.equal(
      apiTypes.includes(forbidden),
      false,
      `la UI no debe enviar ${forbidden}`,
    )
  }
})

test('058 UI modela Humana Animal humoral afinidades y ausencia significativa', () => {
  assert.match(
    feeding,
    /value="human"/,
  )
  assert.match(
    feeding,
    /value="animal"/,
  )
  assert.match(
    feeding,
    /value="humoral"/,
  )
  assert.match(
    feeding,
    /value="animalBlood"/,
  )
  assert.match(
    feeding,
    /value="resonanceFree"/,
  )
  assert.match(
    feeding,
    /value="none"/,
  )

  assert.match(
    feeding,
    /characterBloodResonanceCatalog[\s\S]*\.resonances/,
  )
  assert.match(
    feeding,
    /characterBloodResonanceCatalog[\s\S]*\.temperaments/,
  )
})

test('058 UI limita Hambre y no permite registrar desde Hambre 0', () => {
  assert.match(
    feeding,
    /Array\.from\([\s\S]*length: hunger/,
  )
  assert.match(
    feeding,
    /hungerSlaked <= hunger/,
  )
  assert.match(
    feeding,
    /disabled=\{hunger < 1\}/,
  )
  assert.match(
    feeding,
    /Hambre 0:[\s\S]*sacian al menos[\s\S]*1 punto de Hambre/,
  )
})

test('058 UI sólo ofrece Discrasia en humoral Agudo y filtrada por Resonancia', () => {
  assert.match(
    feeding,
    /profileMode === 'humoral'[\s\S]*temperament === 'acute'/,
  )
  assert.match(
    feeding,
    /definition\.resonanceKey ===[\s\S]*resonanceKey/,
  )
  assert.match(
    feeding,
    /selectedDyscrasia[\s\S]*\.acquisitionModes/,
  )
  assert.match(
    feeding,
    /drainAndKill/,
  )
  assert.match(
    feeding,
    /feedThreeNights/,
  )
})

test('058 UI vive dentro del bloque de Resonancia y recarga tras éxito', () => {
  assert.match(
    blood,
    /actions\?: ReactNode/,
  )
  assert.match(
    blood,
    /renderSafeNode\(actions\)/,
  )

  assert.match(
    sheet,
    /<CharacterBloodExperience[\s\S]*<PersistedCharacterFeeding/,
  )
  assert.match(
    sheet,
    /hunger=\{model\.state\.hunger\}/,
  )
  assert.match(
    sheet,
    /revision=\{model\.revision\}/,
  )
  assert.match(
    sheet,
    /onApplied=\{onStateReload\}/,
  )

  assert.match(
    feeding,
    /await resolvedGateway\.apply/,
  )
  assert.match(
    feeding,
    /onApplied\(\)/,
  )
})

test('058 UI mantiene estilos responsivos sin adoptar visual standby', () => {
  assert.match(
    css,
    /SPEC-058 — REGISTRO PERSISTIDO DE ALIMENTACIÓN/,
  )
  assert.match(
    css,
    /\.blood-feeding__grid/,
  )
  assert.match(
    css,
    /@media \(max-width: 900px\)/,
  )
  assert.match(
    css,
    /@media \(max-width: 600px\)/,
  )

  assert.doesNotMatch(
    feeding,
    /bloodkeeper-visual-system/,
  )
  assert.doesNotMatch(
    blood,
    /bloodkeeper-visual-system/,
  )
})

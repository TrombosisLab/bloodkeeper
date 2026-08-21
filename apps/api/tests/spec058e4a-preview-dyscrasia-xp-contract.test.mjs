import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  InvalidCharacterAdvancementRequestError,
  parseCharacterAdvancementPreviewRequest,
} from '../dist/characters/presentation/character-advancement.dto.js'

const previewSource =
  await readFile(
    new URL(
      '../src/characters/application/preview-character-advancement.use-case.ts',
      import.meta.url,
    ),
    'utf8',
  )

const controllerSource =
  await readFile(
    new URL(
      '../src/characters/presentation/character-advancement.controller.ts',
      import.meta.url,
    ),
    'utf8',
  )

test('058-E4A preview conserva payload bare histórico', () => {
  assert.deepEqual(
    parseCharacterAdvancementPreviewRequest({
      kind: 'attribute',
      key: 'strength',
    }),
    {
      advancement: {
        kind: 'attribute',
        key: 'strength',
      },
      useDyscrasiaExperience: false,
    },
  )
})

test('058-E4A preview acepta únicamente opt-in booleano junto al avance', () => {
  assert.deepEqual(
    parseCharacterAdvancementPreviewRequest({
      advancement: {
        kind: 'discipline',
        disciplineKey: 'celerity',
        powerKey: 'rapidReflexes',
      },
      useDyscrasiaExperience: true,
    }),
    {
      advancement: {
        kind: 'discipline',
        disciplineKey: 'celerity',
        powerKey: 'rapidReflexes',
      },
      useDyscrasiaExperience: true,
    },
  )

  assert.throws(
    () =>
      parseCharacterAdvancementPreviewRequest({
        advancement: {
          kind: 'attribute',
          key: 'strength',
        },
        useDyscrasiaExperience: 'yes',
      }),
    InvalidCharacterAdvancementRequestError,
  )

  for (const forbidden of [
    'dyscrasiaKey',
    'sourceBloodOperationId',
    'cost',
    'discount',
  ]) {
    assert.throws(
      () =>
        parseCharacterAdvancementPreviewRequest({
          advancement: {
            kind: 'attribute',
            key: 'strength',
          },
          [forbidden]: 'client-authority',
        }),
      InvalidCharacterAdvancementRequestError,
    )
  }
})

test('058-E4A preview usa la misma regla E2 antes de la evidencia E1', () => {
  for (const token of [
    'assessCharacterBloodDyscrasiaExperience',
    'applyCharacterBloodDyscrasiaExperiencePreview',
    'rejectCharacterBloodDyscrasiaExperiencePreview',
    'character.blood?.dyscrasia',
    'applyCharacterDisciplineResonanceEvidence',
  ]) {
    assert.equal(
      previewSource.includes(token),
      true,
      `falta ${token}`,
    )
  }

  const executeBody =
    previewSource.slice(
      previewSource.indexOf(
        'const dyscrasiaExperience =',
      ),
    )

  assert.notEqual(
    executeBody,
    previewSource.slice(-1),
  )

  assert.equal(
    executeBody.indexOf(
      'assessCharacterBloodDyscrasiaExperience',
    ) <
      executeBody.indexOf(
        'applyCharacterDisciplineResonanceEvidence',
      ),
    true,
  )

  assert.match(
    controllerSource,
    /parseCharacterAdvancementPreviewRequest[\s\S]*useDyscrasiaExperience/,
  )
})

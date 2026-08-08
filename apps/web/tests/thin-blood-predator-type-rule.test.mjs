import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  predatorTypeDefinitions,
} from '../src/features/character-creation/data/predator-type-definitions.ts'

import {
  clanAllowed,
  normalizePredatorTypeForCharacter,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  validateIdentityStep,
} from '../src/features/character-creation/domain/step-validation.ts'

const identitySource = await readFile(
  new URL(
    '../src/features/character-creation/components/IdentityStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-021 ningún Tipo de Depredador admite Sangre Débil',
  () => {
    for (const definition of predatorTypeDefinitions) {
      assert.equal(
        clanAllowed(
          definition.key,
          'thinBlood',
        ),
        false,
        definition.key,
      )

      assert.equal(
        normalizePredatorTypeForCharacter(
          definition.key,
          'thinBlood',
        ),
        '',
        definition.key,
      )
    }
  },
)

test(
  'SPEC-021 la validación de Identidad rechaza Sangre Débil con depredador',
  () => {
    const draft =
      structuredClone(
        initialCharacterDraft,
      )

    draft.identity = {
      ...draft.identity,
      name: 'Prueba',
      concept: 'Sangre Débil',
      clan: 'thinBlood',
      generation: 14,
      predatorType: 'bagger',
    }

    const result =
      validateIdentityStep(draft)

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.includes(
        'Los Sangre Débil no pueden tener Tipo de Depredador.',
      ),
    )
  },
)

test(
  'SPEC-021 cambiar a Sangre Débil elimina depredador elecciones y efectos',
  () => {
    const withPredator =
      applyCharacterDraftUpdate(
        structuredClone(
          initialCharacterDraft,
        ),
        current => ({
          ...current,
          identity: {
            ...current.identity,
            name: 'Prueba',
            concept: 'Antes del cambio',
            clan: 'brujah',
            generation: 13,
            predatorType: 'bagger',
          },
        }),
      )

    assert.equal(
      withPredator.identity.predatorType,
      'bagger',
    )

    assert.equal(
      withPredator.advantages.selections.some(
        selection =>
          selection.origin ===
          'predatorType',
      ),
      true,
    )

    const thinBlood =
      applyCharacterDraftUpdate(
        withPredator,
        current => ({
          ...current,
          identity: {
            ...current.identity,
            clan: 'thinBlood',
            generation: 14,
          },
          predatorTypeChoices: {
            residual: 0,
          },
        }),
      )

    assert.equal(
      thinBlood.identity.predatorType,
      '',
    )

    assert.deepEqual(
      thinBlood.predatorTypeChoices,
      {},
    )

    assert.equal(
      thinBlood.advantages.selections.some(
        selection =>
          selection.origin ===
          'predatorType',
      ),
      false,
    )

    assert.equal(
      thinBlood.disciplines.some(
        discipline =>
          discipline.origin ===
          'predatorType',
      ),
      false,
    )

    assert.equal(
      thinBlood.skillSpecialties.some(
        specialty =>
          specialty.origin ===
          'predatorType',
      ),
      false,
    )
  },
)

test(
  'SPEC-021 la UI bloquea y explica el Tipo de Depredador en Sangre Débil',
  () => {
    assert.match(
      identitySource,
      /const predatorTypeForbidden =\s*value\.clan === 'thinBlood'/,
    )

    assert.match(
      identitySource,
      /disabled=\{predatorTypeForbidden\}/,
    )

    assert.match(
      identitySource,
      /Los Sangre Débil no tienen Tipo de Depredador\./,
    )
  },
)

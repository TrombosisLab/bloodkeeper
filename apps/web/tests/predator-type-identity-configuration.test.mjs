import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  getPredatorTypePointDistributionAllocations,
  updatePredatorTypePointDistributionSelection,
} from '../src/features/character-creation/domain/predator-type-point-distribution-draft-rules.ts'

import {
  validateIdentityStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function createOsiris() {
  return applyCharacterDraftUpdate(
    structuredClone(
      initialCharacterDraft,
    ),
    current => ({
      ...current,

      identity: {
        ...current.identity,
        name: 'Prueba Osiris',
        concept: 'Líder de culto',
        clan: 'tremere',
        generation: 12,
        predatorType: 'osiris',
      },

      predatorTypeChoices: {
        'osiris-specialty': 0,
        'osiris-discipline': 1,
      },
    }),
  )
}

function setAllocation(
  draft,
  distributionIndex,
  definitionKey,
  rating,
) {
  return applyCharacterDraftUpdate(
    draft,
    current => ({
      ...current,

      advantages:
        updatePredatorTypePointDistributionSelection(
          current.identity.predatorType,
          distributionIndex,
          definitionKey,
          rating,
          current.predatorTypeChoices ?? {},
          current.advantages,
        ),
    }),
  )
}

test(
  'SPEC-021 Identidad bloquea Osiris con repartos pendientes',
  () => {
    const result =
      validateIdentityStep(
        createOsiris(),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        error =>
          error.includes(
            'Reparto 1 del Tipo de Depredador',
          ),
      ),
      true,
    )

    assert.equal(
      result.errors.some(
        error =>
          error.includes(
            'Reparto 2 del Tipo de Depredador',
          ),
      ),
      true,
    )
  },
)

test(
  'SPEC-021 Osiris resuelve 3 puntos y 2 puntos dentro de Identidad',
  () => {
    let draft =
      createOsiris()

    draft =
      setAllocation(
        draft,
        0,
        'fame',
        1,
      )

    draft =
      setAllocation(
        draft,
        0,
        'herd',
        2,
      )

    draft =
      setAllocation(
        draft,
        1,
        'enemy',
        2,
      )

    assert.deepEqual(
      getPredatorTypePointDistributionAllocations(
        'osiris',
        0,
        draft.advantages,
      ),
      [
        {
          definitionKey: 'fame',
          rating: 1,
        },
        {
          definitionKey: 'herd',
          rating: 2,
        },
      ],
    )

    assert.deepEqual(
      getPredatorTypePointDistributionAllocations(
        'osiris',
        1,
        draft.advantages,
      ),
      [
        {
          definitionKey: 'enemy',
          rating: 2,
        },
      ],
    )

    const result =
      validateIdentityStep(
        draft,
      )

    assert.equal(
      result.errors.some(
        error =>
          error.includes(
            'Reparto ',
          ),
      ),
      false,
    )
  },
)

test(
  'SPEC-021 cambiar de Osiris elimina sus repartos depredadores',
  () => {
    let draft =
      createOsiris()

    draft =
      setAllocation(
        draft,
        0,
        'fame',
        3,
      )

    assert.equal(
      draft.advantages.selections.some(
        selection =>
          selection.selectionId.includes(
            ':distribution:',
          ),
      ),
      true,
    )

    const switched =
      applyCharacterDraftUpdate(
        draft,
        current => ({
          ...current,

          identity: {
            ...current.identity,
            predatorType: 'sandman',
          },

          predatorTypeChoices: {
            'sandman-specialty': 0,
            'sandman-discipline': 0,
          },
        }),
      )

    assert.equal(
      switched.advantages.selections.some(
        selection =>
          selection.selectionId.includes(
            ':distribution:',
          ),
      ),
      false,
    )
  },
)

test(
  'SPEC-021 Identidad reutiliza selector resumen detalles y reparto',
  async () => {
    const configurationSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/PredatorTypeConfiguration.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    const identitySource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/IdentityStep.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      configurationSource,
      /Configuración del Tipo de Depredador/,
    )

    assert.match(
      configurationSource,
      /PredatorTypeChoiceSelector/,
    )

    assert.match(
      configurationSource,
      /PredatorTypeAdvantageSummary/,
    )

    assert.match(
      configurationSource,
      /AdvantageInstanceDetailsEditor/,
    )

    assert.match(
      identitySource,
      /PredatorTypeConfiguration/,
    )
  },
)


test(
  'SPEC-021 los repartos del Tipo de Depredador usan dots de Ventajas',
  async () => {
    const source =
      await readFile(
        new URL(
          '../src/features/character-creation/components/PredatorTypeConfiguration.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      source,
      /import \{\s*AdvantageRatingControl,\s*\} from '\.\/advantages\/AdvantageRatingControl'/,
    )

    assert.match(
      source,
      /<AdvantageRatingControl/,
    )

    assert.match(
      source,
      /allowedRatings=\{\[\s*0,\s*\.\.\.allowedRatings,\s*\]\}/,
    )

    assert.match(
      source,
      /max=\{\s*distribution\.points\s*\}/,
    )

    assert.doesNotMatch(
      source,
      /<select[\s\S]*0 puntos[\s\S]*allowedRatings\.map/,
    )
  },
)

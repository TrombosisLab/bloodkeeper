import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  getCharacterAdvantagesBudget,
} from '../src/features/character-creation/domain/advantage-rules.ts'

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function selectBagger() {
  return applyCharacterDraftUpdate(
    structuredClone(
      initialCharacterDraft,
    ),
    (current) => ({
      ...current,
      identity: {
        ...current.identity,
        name: 'Prueba',
        concept: 'Concepto',
        clan: 'brujah',
        generation: 13,
        predatorType: 'bagger',
      },
      predatorTypeChoices: {
        'bagger-specialty': 0,
      },
    }),
  )
}

function completeStandardBudget(
  draft,
) {
  return applyCharacterDraftUpdate(
    draft,
    (current) => ({
      ...current,
      advantages: {
        selections: [
          ...current.advantages
            .selections,
          {
            selectionId:
              'creation-status',
            definitionKey:
              'status',
            category:
              'background',
            rating: 5,
            origin:
              'creation',
            details: {
              kind: 'status',
            },
          },
          {
            selectionId:
              'creation-contacts',
            definitionKey:
              'contacts',
            category:
              'background',
            rating: 2,
            origin:
              'creation',
            details: {
              kind: 'contact',
            },
          },
          {
            selectionId:
              'creation-repulsive',
            definitionKey:
              'repulsive',
            category:
              'flaw',
            rating: 2,
            origin:
              'creation',
          },
        ],
      },
    }),
  )
}

test(
  '003-J bugfix autoaplica Bolsero y lo excluye del presupuesto 7/2',
  () => {
    const draft =
      selectBagger()

    assert.equal(
      draft.advantages.selections.some(
        (selection) =>
          selection.origin ===
            'predatorType' &&
          selection.definitionKey ===
            'iron-stomach' &&
          selection.rating === 3,
      ),
      true,
    )

    assert.equal(
      draft.advantages.selections.some(
        (selection) =>
          selection.origin ===
            'predatorType' &&
          selection.definitionKey ===
            'enemy' &&
          selection.rating === 2,
      ),
      true,
    )

    assert.deepEqual(
      getCharacterAdvantagesBudget(
        draft.advantages,
      ),
      {
        advantagePoints: 0,
        flawPoints: 0,
      },
    )

    const completed =
      completeStandardBudget(
        draft,
      )

    assert.deepEqual(
      getCharacterAdvantagesBudget(
        completed.advantages,
      ),
      {
        advantagePoints: 7,
        flawPoints: 2,
      },
    )

    assert.equal(
      validateStep(
        'advantages',
        completed,
      ).valid,
      true,
    )
  },
)

test(
  '003-J bugfix sustituye sólo concesiones del depredador anterior',
  () => {
    const bagger =
      completeStandardBudget(
        selectBagger(),
      )

    const sandman =
      applyCharacterDraftUpdate(
        bagger,
        (current) => ({
          ...current,
          identity: {
            ...current.identity,
            predatorType:
              'sandman',
          },
          predatorTypeChoices: {
            'sandman-specialty': 0,
            'sandman-discipline': 0,
          },
        }),
      )

    assert.equal(
      sandman.advantages.selections.some(
        (selection) =>
          selection.origin ===
            'predatorType' &&
          selection.definitionKey ===
            'iron-stomach',
      ),
      false,
    )

    assert.equal(
      sandman.advantages.selections.some(
        (selection) =>
          selection.origin ===
            'predatorType' &&
          selection.definitionKey ===
            'enemy',
      ),
      false,
    )

    assert.equal(
      sandman.advantages.selections.some(
        (selection) =>
          selection.origin ===
            'predatorType' &&
          selection.definitionKey ===
            'resources' &&
          selection.rating === 1,
      ),
      true,
    )

    assert.deepEqual(
      getCharacterAdvantagesBudget(
        sandman.advantages,
      ),
      {
        advantagePoints: 7,
        flawPoints: 2,
      },
    )
  },
)

test(
  '003-J bugfix muestra las concesiones y normaliza borradores cargados',
  async () => {
    const advantagesSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/AdvantagesStep.tsx',
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

    const summarySource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/PredatorTypeAdvantageSummary.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    const wizardSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/CharacterCreationWizard.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      advantagesSource,
      /Concesiones automáticas/,
    )
    assert.match(
      advantagesSource,
      /selection\.origin ===\s*'predatorType'/,
    )
    assert.match(
      advantagesSource,
      /no se seleccionan de nuevo/,
    )

    assert.match(
      identitySource,
      /PredatorTypeAdvantageSummary/,
    )
    assert.match(
      summarySource,
      /Elección aplicada/,
    )
    assert.match(
      summarySource,
      /no consumen el\s*presupuesto ordinario 7\/2/,
    )

    assert.match(
      wizardSource,
      /normalizeCharacterDraftPredatorType\(\s*loaded\.draft/,
    )
    assert.match(
      wizardSource,
      /normalizationChanged/,
    )
  },
)

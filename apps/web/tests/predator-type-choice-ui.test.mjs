import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  getAvailablePredatorTypeChoiceOptions,
  getPredatorType,
  resolveSelectedPredatorChoices,
  validatePredatorTypeChoiceSelections,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

import {
  validateIdentityStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function getChoice(
  predatorTypeKey,
  choiceId,
) {
  const definition =
    getPredatorType(
      predatorTypeKey,
    )

  assert.ok(definition)

  const choice =
    definition.choices?.find(
      candidate =>
        candidate.id === choiceId,
    )

  assert.ok(choice)

  return choice
}

test(
  '029-U.13B Sandman ofrece Auspex u Ofuscación con índices canónicos',
  () => {
    const choice =
      getChoice(
        'sandman',
        'sandman-discipline',
      )

    const options =
      getAvailablePredatorTypeChoiceOptions(
        choice,
        {
          clan: 'malkavian',
        },
      )

    assert.deepEqual(
      options.map(
        entry => ({
          index: entry.index,
          disciplineKey:
            entry.option.grant
              .disciplineKey,
        }),
      ),
      [
        {
          index: 0,
          disciplineKey: 'auspex',
        },
        {
          index: 1,
          disciplineKey:
            'obfuscate',
        },
      ],
    )
  },
)

test(
  '029-U.13B Bolsero conserva la restricción Tremere y el índice original',
  () => {
    const choice =
      getChoice(
        'bagger',
        'bagger-discipline',
      )

    const tremere =
      getAvailablePredatorTypeChoiceOptions(
        choice,
        {
          clan: 'tremere',
        },
      )

    const brujah =
      getAvailablePredatorTypeChoiceOptions(
        choice,
        {
          clan: 'brujah',
        },
      )

    assert.deepEqual(
      tremere.map(
        entry =>
          entry.option.grant
            .disciplineKey,
      ),
      [
        'bloodSorcery',
        'obfuscate',
      ],
    )

    assert.deepEqual(
      brujah.map(
        entry => ({
          index: entry.index,
          disciplineKey:
            entry.option.grant
              .disciplineKey,
        }),
      ),
      [
        {
          index: 1,
          disciplineKey:
            'obfuscate',
        },
      ],
    )
  },
)

test(
  '029-U.13B exige elecciones múltiples y autoaplica la opción única',
  () => {
    const tremereMissing =
      validatePredatorTypeChoiceSelections(
        'bagger',
        {
          clan: 'tremere',
        },
        {
          'bagger-specialty': 0,
        },
      )

    assert.equal(
      tremereMissing.valid,
      false,
    )

    const tremereComplete =
      validatePredatorTypeChoiceSelections(
        'bagger',
        {
          clan: 'tremere',
        },
        {
          'bagger-specialty': 0,
          'bagger-discipline': 0,
        },
      )

    assert.equal(
      tremereComplete.valid,
      true,
    )

    const brujah =
      validatePredatorTypeChoiceSelections(
        'bagger',
        {
          clan: 'brujah',
        },
        {
          'bagger-specialty': 0,
        },
      )

    assert.equal(
      brujah.valid,
      true,
    )

    const grants =
      resolveSelectedPredatorChoices(
        'bagger',
        {
          clan: 'brujah',
        },
        {
          'bagger-specialty': 0,
        },
      )

    assert.equal(
      grants.some(
        grant =>
          grant.type ===
            'discipline' &&
          grant.disciplineKey ===
            'obfuscate',
      ),
      true,
    )
  },
)

test(
  '029-U.13B la validación de Identidad bloquea la elección pendiente',
  () => {
    const draft =
      structuredClone(
        initialCharacterDraft,
      )

    draft.identity.name = 'Prueba'
    draft.identity.concept =
      'Concepto de prueba'
    draft.identity.clan =
      'tremere'
    draft.identity.generation = 13
    draft.identity.predatorType =
      'bagger'

    draft.predatorTypeChoices = {
      'bagger-specialty': 0,
    }

    const missing =
      validateIdentityStep(draft)

    assert.equal(
      missing.errors.some(
        error =>
          error.includes(
            'Disciplina del Tipo de Depredador',
          ),
      ),
      true,
    )

    draft.predatorTypeChoices = {
      'bagger-specialty': 0,
      'bagger-discipline': 1,
    }

    const complete =
      validateIdentityStep(draft)

    assert.equal(
      complete.errors.some(
        error =>
          error.includes(
            'Disciplina del Tipo de Depredador',
          ),
      ),
      false,
    )
  },
)

test(
  '029-U.13B conecta el selector con CharacterDraft sin duplicar reglas',
  async () => {
    const selectorSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/PredatorTypeChoiceSelector.tsx',
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

    const wizardSource =
      await readFile(
        new URL(
          '../src/features/character-creation/components/CharacterCreationWizard.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      selectorSource,
      /getAvailablePredatorTypeChoiceOptions/,
    )

    assert.match(
      selectorSource,
      /value=\{index\}/,
    )

    assert.match(
      identitySource,
      /PredatorTypeChoiceSelector/,
    )

    assert.match(
      identitySource,
      /choiceSelections/,
    )

    assert.match(
      wizardSource,
      /draft\.predatorTypeChoices \?\? \{\}/,
    )

    assert.match(
      wizardSource,
      /identityContextChanged/,
    )

    assert.match(
      wizardSource,
      /onChoiceSelectionsChange/,
    )
  },
)

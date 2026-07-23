import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

import {
  validateCharacterAdvantageEligibility,
} from '../src/features/character-creation/domain/advantage-eligibility-rules.ts'

test(
  'Exclusión de Presa está registrada como Defecto Core',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'prey-exclusion',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Exclusión de Presa',
    )

    assert.equal(
      definition.category,
      'flaw',
    )

    assert.deepEqual(
      definition.allowedRatings,
      [1],
    )

    assert.deepEqual(
      definition.originRatingConstraints,
      [
        {
          origin: 'predatorType',
          allowedRatings: [1, 2],
        },
      ],
    )

    assert.equal(
      definition.requiresInstanceDetails,
      true,
    )

    assert.equal(
      definition.instanceDetailsKind,
      'preyExclusion',
    )
  },
)

test(
  'Exclusión de Presa requiere identificar la presa excluida',
  () => {
    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'prey-empty',
              definitionKey: 'prey-exclusion',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'preyExclusion',
                excludedPrey: '   ',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      invalid.valid,
      false,
    )

    assert.ok(
      invalid.errors.some(
        (error) =>
          error.includes(
            'debe especificar una presa excluida',
          ),
      ),
    )
  },
)

test(
  'la adquisición ordinaria de Exclusión de Presa sólo permite 1 punto',
  () => {
    const valid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'prey-normal-1',
              definitionKey: 'prey-exclusion',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'preyExclusion',
                excludedPrey: 'Niños',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      valid.valid,
      true,
    )

    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'prey-normal-2',
              definitionKey: 'prey-exclusion',
              category: 'flaw',
              rating: 2,
              origin: 'creation',
              details: {
                kind: 'preyExclusion',
                excludedPrey: 'Mortales',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      invalid.valid,
      false,
    )
  },
)

test(
  'el origen Tipo de Depredador puede conceder Exclusión de Presa de 2 puntos',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'prey-predator-2',
              definitionKey: 'prey-exclusion',
              category: 'flaw',
              rating: 2,
              origin: 'predatorType',
              details: {
                kind: 'preyExclusion',
                excludedPrey: 'Mortales',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'un Ventrue puede adquirir Exclusión de Presa',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'prey-exclusion',
      )

    assert.ok(definition)

    const result =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: 'ventrue',
          ageCategory: null,
        },
      )

    assert.equal(
      result.eligible,
      true,
    )
  },
)

test(
  'Exclusión de Presa permite varias instancias independientes',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'prey-exclusion',
      )

    assert.ok(definition)

    assert.equal(
      definition.allowMultiple,
      true,
    )
  },
)

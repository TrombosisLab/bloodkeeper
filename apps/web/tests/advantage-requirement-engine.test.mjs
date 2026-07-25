import assert from 'node:assert/strict'
import test from 'node:test'

import {
  areCharacterAdvantageRequirementsSatisfied,
  collectMissingCharacterAdvantageRequirements,
  evaluateCharacterAdvantageRequirement,
  evaluateCharacterAdvantageRequirements,
  isCharacterAdvantageRequirementSatisfied,
} from '../src/features/character-creation/domain/advantage-requirement-engine.ts'

function createContext(overrides = {}) {
  return {
    selections: [],
    isThinBlood: false,
    ...overrides,
  }
}

test(
  'una lista vacía de requisitos se considera satisfecha',
  () => {
    assert.deepEqual(
      evaluateCharacterAdvantageRequirements(
        [],
        createContext(),
      ),
      {
        satisfied: true,
        failures: [],
      },
    )
  },
)

test(
  'detecta la ausencia de una Ventaja requerida',
  () => {
    const failure =
      evaluateCharacterAdvantageRequirement(
        {
          type: 'advantage',
          definitionKey: 'haven',
        },
        createContext(),
      )

    assert.equal(
      failure?.code,
      'missingAdvantage',
    )
  },
)

test(
  'acepta una Ventaja requerida con puntuación suficiente',
  () => {
    assert.equal(
      isCharacterAdvantageRequirementSatisfied(
        {
          type: 'advantage',
          definitionKey: 'haven',
          minRating: 2,
        },
        createContext({
          selections: [
            {
              definitionKey: 'haven',
              rating: 2,
            },
          ],
        }),
      ),
      true,
    )
  },
)

test(
  'rechaza una Ventaja requerida con puntuación insuficiente',
  () => {
    const failure =
      evaluateCharacterAdvantageRequirement(
        {
          type: 'advantage',
          definitionKey: 'haven',
          minRating: 3,
        },
        createContext({
          selections: [
            {
              definitionKey: 'haven',
              rating: 2,
            },
          ],
        }),
      )

    assert.equal(
      failure?.code,
      'insufficientAdvantageRating',
    )
  },
)

test(
  'utiliza la puntuación más alta cuando existen varias instancias',
  () => {
    assert.equal(
      isCharacterAdvantageRequirementSatisfied(
        {
          type: 'advantage',
          definitionKey: 'allies',
          minRating: 3,
        },
        createContext({
          selections: [
            {
              definitionKey: 'allies',
              rating: 1,
            },
            {
              definitionKey: 'allies',
              rating: 3,
            },
          ],
        }),
      ),
      true,
    )
  },
)

test(
  'evalúa requisitos de clan',
  () => {
    const requirement = {
      type: 'clan',
      allowedClanKeys: [
        'tremere',
        'hecata',
      ],
    }

    assert.equal(
      isCharacterAdvantageRequirementSatisfied(
        requirement,
        createContext({
          clanKey: 'tremere',
        }),
      ),
      true,
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext({
          clanKey: 'brujah',
        }),
      )?.code,
      'clanNotAllowed',
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext(),
      )?.code,
      'missingClan',
    )
  },
)

test(
  'evalúa requisitos de tipo de depredador',
  () => {
    const requirement = {
      type: 'predatorType',
      allowedPredatorTypeKeys: [
        'farmer',
        'bagger',
      ],
    }

    assert.equal(
      isCharacterAdvantageRequirementSatisfied(
        requirement,
        createContext({
          predatorTypeKey: 'farmer',
        }),
      ),
      true,
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext({
          predatorTypeKey: 'sandman',
        }),
      )?.code,
      'predatorTypeNotAllowed',
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext(),
      )?.code,
      'missingPredatorType',
    )
  },
)

test(
  'evalúa requisitos de Sangre Débil',
  () => {
    assert.equal(
      isCharacterAdvantageRequirementSatisfied(
        {
          type: 'thinBlood',
          expected: true,
        },
        createContext({
          isThinBlood: true,
        }),
      ),
      true,
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        {
          type: 'thinBlood',
          expected: true,
        },
        createContext({
          isThinBlood: false,
        }),
      )?.code,
      'thinBloodMismatch',
    )
  },
)

test(
  'evalúa Humanidad mínima',
  () => {
    const requirement = {
      type: 'humanity',
      min: 7,
    }

    assert.equal(
      isCharacterAdvantageRequirementSatisfied(
        requirement,
        createContext({
          humanity: 7,
        }),
      ),
      true,
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext({
          humanity: 6,
        }),
      )?.code,
      'insufficientHumanity',
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext(),
      )?.code,
      'missingHumanity',
    )
  },
)

test(
  'evalúa generación máxima',
  () => {
    const requirement = {
      type: 'generation',
      max: 12,
    }

    assert.equal(
      isCharacterAdvantageRequirementSatisfied(
        requirement,
        createContext({
          generation: 11,
        }),
      ),
      true,
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext({
          generation: 13,
        }),
      )?.code,
      'generationTooHigh',
    )

    assert.equal(
      evaluateCharacterAdvantageRequirement(
        requirement,
        createContext(),
      )?.code,
      'missingGeneration',
    )
  },
)

test(
  'combina múltiples requisitos con semántica AND',
  () => {
    const requirements = [
      {
        type: 'advantage',
        definitionKey: 'haven',
        minRating: 2,
      },
      {
        type: 'clan',
        allowedClanKeys: [
          'tremere',
        ],
      },
      {
        type: 'humanity',
        min: 6,
      },
    ]

    assert.equal(
      areCharacterAdvantageRequirementsSatisfied(
        requirements,
        createContext({
          selections: [
            {
              definitionKey: 'haven',
              rating: 2,
            },
          ],
          clanKey: 'tremere',
          humanity: 7,
        }),
      ),
      true,
    )
  },
)

test(
  'recopila todos los requisitos incumplidos sin detenerse en el primero',
  () => {
    const failures =
      collectMissingCharacterAdvantageRequirements(
        [
          {
            type: 'advantage',
            definitionKey: 'haven',
            minRating: 2,
          },
          {
            type: 'clan',
            allowedClanKeys: [
              'tremere',
            ],
          },
          {
            type: 'humanity',
            min: 7,
          },
        ],
        createContext({
          clanKey: 'brujah',
          humanity: 5,
        }),
      )

    assert.deepEqual(
      failures.map(
        (failure) =>
          failure.code,
      ),
      [
        'missingAdvantage',
        'clanNotAllowed',
        'insufficientHumanity',
      ],
    )
  },
)

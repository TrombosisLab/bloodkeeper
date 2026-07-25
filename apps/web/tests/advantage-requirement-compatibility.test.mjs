import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterAdvantageDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'
import {
  validateCharacterAdvantageEligibility,
} from '../src/features/character-creation/domain/advantage-eligibility-rules.ts'

function createDefinition(
  overrides = {},
) {
  return {
    key: 'test-advantage',
    name: 'Ventaja de prueba',
    category: 'merit',
    allowedRatings: [1],
    source: 'core',
    allowMultiple: false,
    requiresInstanceDetails: false,
    ...overrides,
  }
}

function createContext(
  overrides = {},
) {
  return {
    characterKind: 'standard',
    clanKey: 'brujah',
    ageCategory: 'neonate',
    selectedDefinitionKeys: [],
    ...overrides,
  }
}

test(
  'conserva la elegibilidad histórica sin requisitos modernos',
  () => {
    const definition =
      createDefinition({
        requirements: {
          clanKeys: ['brujah'],
        },
      })

    assert.equal(
      validateCharacterAdvantageEligibility(
        definition,
        createContext(),
      ).eligible,
      true,
    )

    assert.equal(
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          clanKey: 'ventrue',
        }),
      ).eligible,
      false,
    )
  },
)

test(
  'evalúa requisitos modernos mediante el motor común',
  () => {
    const definition =
      createDefinition({
        requirementRules: [
          {
            type: 'humanity',
            min: 7,
          },
        ],
      })

    const rejected =
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          humanity: 6,
        }),
      )

    const accepted =
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          humanity: 7,
        }),
      )

    assert.equal(rejected.eligible, false)
    assert.equal(accepted.eligible, true)
  },
)

test(
  'admite migración gradual evaluando requisitos legacy y modernos con AND',
  () => {
    const definition =
      createDefinition({
        requirements: {
          clanKeys: ['brujah'],
        },
        requirementRules: [
          {
            type: 'humanity',
            min: 7,
          },
        ],
      })

    assert.equal(
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          clanKey: 'brujah',
          humanity: 7,
        }),
      ).eligible,
      true,
    )

    assert.equal(
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          clanKey: 'ventrue',
          humanity: 7,
        }),
      ).eligible,
      false,
    )

    assert.equal(
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          clanKey: 'brujah',
          humanity: 6,
        }),
      ).eligible,
      false,
    )
  },
)

test(
  'traduce selectedDefinitionKeys legacy a selecciones modernas de rating 1',
  () => {
    const required =
      createDefinition({
        key: 'required-advantage',
        name: 'Ventaja requerida',
      })

    const dependent =
      createDefinition({
        key: 'dependent-advantage',
        name: 'Ventaja dependiente',
        requirementRules: [
          {
            type: 'advantage',
            definitionKey:
              'required-advantage',
          },
        ],
      })

    const result =
      validateCharacterAdvantageEligibility(
        dependent,
        createContext({
          selectedDefinitionKeys: [
            required.key,
          ],
        }),
      )

    assert.equal(result.eligible, true)
  },
)

test(
  'usa ratings reales cuando se proporciona selectedAdvantages',
  () => {
    const definition =
      createDefinition({
        requirementRules: [
          {
            type: 'advantage',
            definitionKey: 'haven',
            minRating: 3,
          },
        ],
      })

    assert.equal(
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          selectedAdvantages: [
            {
              definitionKey: 'haven',
              rating: 2,
            },
          ],
        }),
      ).eligible,
      false,
    )

    assert.equal(
      validateCharacterAdvantageEligibility(
        definition,
        createContext({
          selectedAdvantages: [
            {
              definitionKey: 'haven',
              rating: 3,
            },
          ],
        }),
      ).eligible,
      true,
    )
  },
)

test(
  'rechaza una referencia moderna a una definición inexistente',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        createDefinition({
          requirementRules: [
            {
              type: 'advantage',
              definitionKey: 'missing',
            },
          ],
        }),
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'definición inexistente',
          ),
      ),
    )
  },
)

test(
  'rechaza una definición moderna que se requiere a sí misma',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        createDefinition({
          requirementRules: [
            {
              type: 'advantage',
              definitionKey:
                'test-advantage',
            },
          ],
        }),
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'no puede requerirse a sí misma',
          ),
      ),
    )
  },
)

test(
  'rechaza requisitos modernos estructuralmente inválidos',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        createDefinition({
          requirementRules: [
            {
              type: 'clan',
              allowedClanKeys: [],
            },
            {
              type: 'humanity',
              min: 11,
            },
            {
              type: 'generation',
              max: 0,
            },
          ],
        }),
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.length >= 3,
    )
  },
)

test(
  'rechaza referencias legacy inexistentes y duplicadas',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        createDefinition({
          requirements: {
            clanKeys: [
              'brujah',
              'brujah',
            ],
            requiredDefinitionKeys: [
              'missing',
              'missing',
            ],
          },
        }),
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes('duplicados'),
      ),
    )
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'definición inexistente',
          ),
      ),
    )
  },
)

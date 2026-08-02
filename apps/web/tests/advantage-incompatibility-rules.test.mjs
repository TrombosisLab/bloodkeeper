import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADVANTAGE_ADVANCEMENT_RULES_REQUIRED,
  validateCharacterAdvantagesForContext,
} from '../src/features/character-creation/domain/advantage-acquisition-context-rules.ts'
import {
  validateCharacterAdvantageDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'
import {
  validateCharacterAdvantageIncompatibilities,
} from '../src/features/character-creation/domain/advantage-incompatibility-rules.ts'

function createDefinition(
  overrides = {},
) {
  return {
    key: 'first-merit',
    name: 'Primer Merito',
    category: 'merit',
    allowedRatings: [1, 2, 3, 4],
    source: 'core',
    allowMultiple: false,
    requiresInstanceDetails: false,
    ...overrides,
  }
}

const definitions = [
  createDefinition({
    incompatibleDefinitionKeys: [
      'second-merit',
    ],
  }),
  createDefinition({
    key: 'second-merit',
    name: 'Segundo Merito',
  }),
  createDefinition({
    key: 'creation-flaw',
    name: 'Defecto de creacion',
    category: 'flaw',
    allowedRatings: [2],
  }),
]

function createSelection(
  definitionKey,
  rating,
  category = 'merit',
) {
  return {
    selectionId: definitionKey,
    definitionKey,
    category,
    rating,
    origin: 'creation',
  }
}

const incompatibleCreationDraft = {
  selections: [
    createSelection(
      'first-merit',
      4,
    ),
    createSelection(
      'second-merit',
      3,
    ),
    createSelection(
      'creation-flaw',
      2,
      'flaw',
    ),
  ],
}

test(
  '026-C rechaza referencias de incompatibilidad inexistentes',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        createDefinition({
          incompatibleDefinitionKeys: [
            'missing-definition',
          ],
        }),
      ])

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /incompatibilidad inexistente/,
    )
  },
)

test(
  '026-C rechaza incompatibilidades propias o duplicadas',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        createDefinition({
          incompatibleDefinitionKeys: [
            'first-merit',
            'first-merit',
          ],
        }),
      ])

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /duplicadas/,
    )
    assert.match(
      result.errors.join(' '),
      /consigo misma/,
    )
  },
)

test(
  '026-C trata como bidireccional una incompatibilidad declarada una sola vez',
  () => {
    const result =
      validateCharacterAdvantageIncompatibilities(
        incompatibleCreationDraft,
        definitions,
      )

    assert.equal(result.valid, false)
    assert.equal(result.errors.length, 1)
    assert.match(
      result.errors[0],
      /Primer Merito.*Segundo Merito/,
    )
  },
)

test(
  '026-C admite selecciones que no forman una pareja incompatible',
  () => {
    const result =
      validateCharacterAdvantageIncompatibilities(
        {
          selections: [
            createSelection(
              'first-merit',
              4,
            ),
          ],
        },
        definitions,
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  '026-C bloquea una incompatibilidad aunque el presupuesto inicial sea correcto',
  () => {
    const result =
      validateCharacterAdvantagesForContext(
        incompatibleCreationDraft,
        'characterCreation',
        definitions,
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /incompatible/,
    )
    assert.doesNotMatch(
      result.errors.join(' '),
      /exactamente/,
    )
  },
)

test(
  '026-C conserva la incompatibilidad al revalidar durante la evolucion',
  () => {
    const result =
      validateCharacterAdvantagesForContext(
        incompatibleCreationDraft,
        'characterAdvancement',
        definitions,
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /incompatible/,
    )
    assert.ok(
      result.errors.includes(
        ADVANTAGE_ADVANCEMENT_RULES_REQUIRED,
      ),
    )
  },
)

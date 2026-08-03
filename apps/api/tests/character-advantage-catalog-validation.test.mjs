import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCharacterAdvantageValidationContributor,
} from '../dist/characters/domain/character-advantage-validation.contributor.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

function selection(overrides = {}) {
  return {
    selectionId: 'selection-029-s',
    definitionKey: 'resources',
    category: 'background',
    rating: 4,
    origin: 'creation',
    parentSelectionId: null,
    details: {
      kind: 'resources',
      source: 'Patrimonio familiar',
    },
    ...overrides,
  }
}

function validBudgetSelections() {
  return [
    selection(),
    selection({
      selectionId: 'haven-029-s',
      definitionKey: 'haven',
      rating: 3,
      details: {
        kind: 'haven',
        identity: 'Refugio del puerto',
      },
    }),
    selection({
      selectionId: 'enemy-029-s',
      definitionKey: 'enemy',
      category: 'flaw',
      rating: 2,
      details: {
        kind: 'enemy',
        identity: 'Sheriff rival',
      },
    }),
  ]
}

function validate(
  selections,
  context = 'activation',
  catalog = characterRulesCatalog,
) {
  return createCharacterAdvantageValidationContributor(
    catalog,
  ).validate(
    {
      advantages: { selections },
    },
    context,
  )[0]
}

function codes(result) {
  return result.issues.map(({ code }) => code)
}

test(
  '029-S completa Ventajas validas contra el catalogo canonico',
  () => {
    const result = validate(validBudgetSelections())

    assert.equal(result.state, 'complete')
    assert.deepEqual(result.issues, [])
  },
)

test(
  '029-S rechaza definicion categoria rating y repeticion invalidos',
  () => {
    const result = validate(
      [
        selection({
          selectionId: 'unknown',
          definitionKey: 'unknown-definition',
        }),
        selection({
          selectionId: 'mask-a',
          definitionKey: 'mask',
          category: 'merit',
          rating: 3,
          details: {
            kind: 'mask',
            benefits: [],
          },
        }),
        selection({
          selectionId: 'mask-b',
          definitionKey: 'mask',
          rating: 1,
          details: {
            kind: 'mask',
            benefits: [],
          },
        }),
      ],
      'editing',
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_DEFINITION_UNKNOWN',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_CATEGORY_MISMATCH',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_RATING_NOT_ALLOWED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_MULTIPLE_NOT_ALLOWED',
      ),
    )
  },
)

test(
  '029-S valida detalles obligatorios y tipo de instancia',
  () => {
    const draft = validate(
      [
        selection({
          selectionId: 'missing-details',
          details: null,
        }),
      ],
      'draftSave',
    )
    const activation = validate(
      [
        selection({
          selectionId: 'wrong-details',
          details: {
            kind: 'haven',
            identity: 'No son Recursos',
          },
        }),
      ],
      'activation',
    )

    assert.equal(draft.state, 'pending')
    assert.ok(
      codes(draft).includes(
        'CHARACTER_ADVANTAGE_DETAILS_REQUIRED',
      ),
    )
    assert.equal(activation.state, 'invalid')
    assert.ok(
      codes(activation).includes(
        'CHARACTER_ADVANTAGE_DETAILS_KIND_MISMATCH',
      ),
    )
  },
)

test(
  '029-S aplica padres requeridos permitidos y restricciones de rating',
  () => {
    const result = validate(
      [
        selection({
          selectionId: 'haven-small',
          definitionKey: 'haven',
          rating: 1,
          details: {
            kind: 'haven',
            identity: 'Habitacion',
          },
        }),
        selection({
          selectionId: 'library-missing-parent',
          definitionKey: 'haven-library',
          category: 'merit',
          rating: 1,
          details: null,
        }),
        selection({
          selectionId: 'library-too-large',
          definitionKey: 'haven-library',
          category: 'merit',
          rating: 2,
          parentSelectionId: 'haven-small',
          details: null,
        }),
        selection({
          selectionId: 'unrelated-parent',
          definitionKey: 'resources',
          rating: 4,
          parentSelectionId: 'haven-small',
        }),
      ],
      'editing',
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_CATALOG_PARENT_REQUIRED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_PARENT_RATING_CONSTRAINT_VIOLATED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_CATALOG_PARENT_NOT_ALLOWED',
      ),
    )
  },
)

test(
  '029-S respeta restricciones de puntuacion por origen',
  () => {
    const predatorType = validate(
      [
        selection({
          selectionId: 'predator-exclusion',
          definitionKey: 'prey-exclusion',
          category: 'flaw',
          rating: 2,
          origin: 'predatorType',
          details: {
            kind: 'preyExclusion',
            excludedPrey: 'Niños',
          },
        }),
      ],
      'editing',
    )
    const ordinary = validate(
      [
        selection({
          selectionId: 'ordinary-exclusion',
          definitionKey: 'prey-exclusion',
          category: 'flaw',
          rating: 2,
          origin: 'creation',
          details: {
            kind: 'preyExclusion',
            excludedPrey: 'Niños',
          },
        }),
      ],
      'editing',
    )

    assert.equal(predatorType.state, 'complete')
    assert.equal(ordinary.state, 'invalid')
    assert.ok(
      codes(ordinary).includes(
        'CHARACTER_ADVANTAGE_RATING_NOT_ALLOWED',
      ),
    )
  },
)

test(
  '029-S conserva pending cuando el manifiesto no autoriza Ventajas',
  () => {
    const pendingCatalog = {
      ...characterRulesCatalog,
      stateOf(domain) {
        if (domain === 'advantages') return 'pending'
        return characterRulesCatalog.stateOf(domain)
      },
    }
    const result = validate(
      validBudgetSelections(),
      'activation',
      pendingCatalog,
    )

    assert.equal(result.state, 'pending')
    assert.deepEqual(codes(result), [
      'CHARACTER_ADVANTAGE_CATALOG_VALIDATION_PENDING',
    ])
  },
)

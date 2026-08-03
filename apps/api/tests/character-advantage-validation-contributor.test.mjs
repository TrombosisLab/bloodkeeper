import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageValidationContributor,
} from '../dist/characters/domain/character-advantage-validation.contributor.js'

function selection(overrides = {}) {
  return {
    selectionId: 'selection-029-n',
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

function character(selections) {
  return {
    advantages: { selections },
  }
}

function validate(selections, context = 'activation') {
  return characterAdvantageValidationContributor
    .validate(character(selections), context)[0]
}

function codes(result) {
  return result.issues.map((issue) => issue.code)
}

function validBudgetSelections() {
  return [
    selection(),
    selection({
      selectionId: 'haven-029-n',
      definitionKey: 'haven',
      rating: 3,
      details: {
        kind: 'haven',
        identity: 'Refugio del puerto',
      },
    }),
    selection({
      selectionId: 'flaw-029-n',
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

test(
  '029-S completa Ventajas con el catalogo canonico',
  () => {
    const result = validate(validBudgetSelections())

    assert.equal(result.section, 'advantages')
    assert.equal(result.state, 'complete')
    assert.deepEqual(codes(result), [])
  },
)

test(
  '029-N rechaza identificadores definiciones y ratings invalidos',
  () => {
    const result = validate(
      [
        selection({
          selectionId: '',
          definitionKey: '',
          rating: 0,
        }),
        selection({
          selectionId: '',
          rating: 8,
        }),
      ],
      'draftSave',
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_SELECTION_ID_DUPLICATE',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_SELECTION_ID_REQUIRED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_DEFINITION_KEY_REQUIRED',
      ),
    )
    assert.equal(
      codes(result).filter(
        (code) =>
          code ===
          'CHARACTER_ADVANTAGE_RATING_OUT_OF_RANGE',
      ).length,
      2,
    )
  },
)

test(
  '029-N valida el presupuesto solo al activar',
  () => {
    const incomplete = [selection()]
    const activation = validate(
      incomplete,
      'activation',
    )
    const draftSave = validate(
      incomplete,
      'draftSave',
    )

    assert.ok(
      codes(activation).includes(
        'CHARACTER_ADVANTAGE_CREATION_BUDGET_INVALID',
      ),
    )
    assert.ok(
      codes(activation).includes(
        'CHARACTER_FLAW_CREATION_BUDGET_INVALID',
      ),
    )
    assert.equal(draftSave.state, 'pending')
  },
)

test(
  '029-N rechaza padres ausentes propios o ciclicos',
  () => {
    const result = validate(
      [
        selection({
          selectionId: 'missing-parent',
          parentSelectionId: 'absent',
        }),
        selection({
          selectionId: 'self-parent',
          parentSelectionId: 'self-parent',
        }),
        selection({
          selectionId: 'cycle-a',
          parentSelectionId: 'cycle-b',
        }),
        selection({
          selectionId: 'cycle-b',
          parentSelectionId: 'cycle-a',
        }),
      ],
      'draftSave',
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_PARENT_NOT_FOUND',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_SELF_PARENT',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_ADVANTAGE_PARENT_CYCLE',
      ),
    )
  },
)

test(
  '029-N valida detalles mecanicos de Aliados y Mascara',
  () => {
    const result = validate(
      [
        selection({
          selectionId: 'allies',
          definitionKey: 'allies',
          rating: 3,
          details: {
            kind: 'allies',
            effectiveness: 4,
            reliability: 3,
          },
        }),
        selection({
          selectionId: 'mask',
          definitionKey: 'mask',
          rating: 2,
          details: {
            kind: 'mask',
            identity: 'Lucia',
            benefits: ['erased', 'erased'],
          },
        }),
      ],
      'draftSave',
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_ALLIES_DETAILS_INVALID',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_MASK_BENEFIT_DUPLICATE',
      ),
    )
  },
)

test(
  '029-N valida referencias e informacion estructurada',
  () => {
    const result = validate(
      [
        selection({
          selectionId: 'languages',
          definitionKey: 'linguistics',
          details: {
            kind: 'linguistics',
            languages: ['Latin', 'latin'],
          },
        }),
        selection({
          selectionId: 'bane',
          definitionKey: 'folkloric-bane',
          details: {
            kind: 'folkloricBane',
            source: ' ',
          },
        }),
        selection({
          selectionId: 'lore',
          definitionKey: 'loresheet',
          details: {
            kind: 'loresheet',
            loresheetKey: '',
            benefitKey: '',
          },
        }),
      ],
      'draftSave',
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_LINGUISTICS_DETAILS_INVALID',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_FOLKLORIC_BANE_SOURCE_REQUIRED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_LORESHEET_REFERENCE_REQUIRED',
      ),
    )
  },
)

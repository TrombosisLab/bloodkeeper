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

test(
  'SPEC-021 valida requisito etario de Arcaico en backend',
  () => {
    const archaic = {
      selectionId: 'archaic-age',
      definitionKey: 'archaic',
      category: 'flaw',
      rating: 2,
      origin: 'creation',
      parentSelectionId: null,
      details: null,
    }

    const validateAge = (
      ageCategory,
    ) =>
      characterAdvantageValidationContributor
        .validate(
          {
            identity: {
              ageCategory,
            },
            advantages: {
              selections: [
                archaic,
              ],
            },
          },
          'editing',
        )[0]

    const unknown =
      validateAge(null)
    const neonate =
      validateAge('neonate')
    const ancilla =
      validateAge('ancilla')
    const elder =
      validateAge('elder')

    assert.ok(
      codes(unknown).includes(
        'CHARACTER_ADVANTAGE_AGE_CATEGORY_REQUIRED',
      ),
    )

    assert.ok(
      codes(neonate).includes(
        'CHARACTER_ADVANTAGE_AGE_CATEGORY_TOO_YOUNG',
      ),
    )

    assert.equal(
      codes(ancilla).includes(
        'CHARACTER_ADVANTAGE_AGE_CATEGORY_TOO_YOUNG',
      ),
      false,
    )

    assert.equal(
      codes(elder).includes(
        'CHARACTER_ADVANTAGE_AGE_CATEGORY_TOO_YOUNG',
      ),
      false,
    )
  },
)

test(
  'SPEC-026 backend aplica la Generación máxima declarada por Custodio de la Historia',
  () => {
    const custodian = selection({
      selectionId: 'custodian-generation',
      definitionKey: 'custodian-of-history',
      category: 'merit',
      rating: 1,
      details: null,
    })

    const validateGeneration = (
      generation,
      context = 'editing',
    ) =>
      characterAdvantageValidationContributor
        .validate(
          {
            identity: {
              generation,
            },
            advantages: {
              selections: [
                custodian,
              ],
            },
          },
          context,
        )[0]

    const unknown =
      validateGeneration(
        null,
        'draftSave',
      )
    const tooHigh =
      validateGeneration(12)
    const allowed =
      validateGeneration(11)

    assert.equal(
      unknown.state,
      'pending',
    )
    assert.ok(
      codes(unknown).includes(
        'CHARACTER_ADVANTAGE_GENERATION_REQUIRED',
      ),
    )

    assert.equal(
      tooHigh.state,
      'invalid',
    )
    assert.ok(
      codes(tooHigh).includes(
        'CHARACTER_ADVANTAGE_GENERATION_TOO_HIGH',
      ),
    )

    assert.equal(
      codes(allowed).includes(
        'CHARACTER_ADVANTAGE_GENERATION_TOO_HIGH',
      ),
      false,
    )
    assert.equal(
      codes(allowed).includes(
        'CHARACTER_ADVANTAGE_GENERATION_REQUIRED',
      ),
      false,
    )
  },
)

test(
  'SPEC-026 backend aplica excludedClanKeys de Vegano',
  () => {
    const vegan = selection({
      selectionId: 'vegan-clan',
      definitionKey: 'vegan',
      category: 'flaw',
      rating: 2,
      details: null,
    })

    const validateClan = (
      clanKey,
      context = 'editing',
    ) =>
      characterAdvantageValidationContributor
        .validate(
          {
            identity: {
              clanKey,
            },
            advantages: {
              selections: [
                vegan,
              ],
            },
          },
          context,
        )[0]

    const ventrue =
      validateClan('ventrue')
    const brujah =
      validateClan('brujah')
    const unknown =
      validateClan(null)

    assert.equal(
      ventrue.state,
      'invalid',
    )
    assert.ok(
      codes(ventrue).includes(
        'CHARACTER_ADVANTAGE_CLAN_EXCLUDED',
      ),
    )

    assert.equal(
      codes(brujah).includes(
        'CHARACTER_ADVANTAGE_CLAN_EXCLUDED',
      ),
      false,
    )

    assert.equal(
      codes(unknown).includes(
        'CHARACTER_ADVANTAGE_CLAN_EXCLUDED',
      ),
      false,
    )
  },
)

function loresheetSelection(
  overrides = {},
) {
  return selection({
    selectionId: 'loresheet-l3',
    definitionKey: 'loresheet-benefit',
    category: 'merit',
    rating: 1,
    origin: 'creation',
    parentSelectionId: null,
    details: {
      kind: 'loresheet',
      loresheetKey:
        'descendant-of-helena',
      benefitKey:
        'helena-skin-deep',
    },
    ...overrides,
  })
}

function validateLoresheets(
  selections,
  clanKey = 'toreador',
  context = 'editing',
) {
  return characterAdvantageValidationContributor
    .validate(
      {
        identity: {
          clanKey,
        },
        advantages: {
          selections,
        },
      },
      context,
    )[0]
}

test(
  'SPEC-026.L3 backend acepta una Ventaja válida de Loresheet',
  () => {
    const result =
      validateLoresheets([
        loresheetSelection(),
      ])

    assert.equal(
      result.state,
      'complete',
    )

    assert.deepEqual(
      codes(result),
      [],
    )
  },
)

test(
  'SPEC-026.L3 backend rechaza una Ficha inexistente',
  () => {
    const result =
      validateLoresheets([
        loresheetSelection({
          details: {
            kind: 'loresheet',
            loresheetKey:
              'unknown-loresheet',
            benefitKey:
              'unknown-benefit',
          },
        }),
      ])

    assert.equal(
      result.state,
      'invalid',
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_LORESHEET_NOT_FOUND',
      ),
    )
  },
)

test(
  'SPEC-026.L3 backend rechaza un beneficio ajeno a la Ficha',
  () => {
    const result =
      validateLoresheets([
        loresheetSelection({
          details: {
            kind: 'loresheet',
            loresheetKey:
              'descendant-of-helena',
            benefitKey:
              'hardestadt-voice',
          },
        }),
      ])

    assert.ok(
      codes(result).includes(
        'CHARACTER_LORESHEET_BENEFIT_NOT_FOUND',
      ),
    )
  },
)

test(
  'SPEC-026.L3 backend exige que rating coincida con el nivel del beneficio',
  () => {
    const result =
      validateLoresheets([
        loresheetSelection({
          rating: 2,
        }),
      ])

    assert.ok(
      codes(result).includes(
        'CHARACTER_LORESHEET_RATING_MISMATCH',
      ),
    )
  },
)

test(
  'SPEC-026.L3 backend rechaza seleccionar dos veces el mismo beneficio',
  () => {
    const result =
      validateLoresheets([
        loresheetSelection(),
        loresheetSelection({
          selectionId:
            'loresheet-l3-duplicate',
        }),
      ])

    assert.ok(
      codes(result).includes(
        'CHARACTER_LORESHEET_BENEFIT_DUPLICATE',
      ),
    )
  },
)

test(
  'SPEC-026.L3 backend permite varios beneficios de una misma Ficha',
  () => {
    const result =
      validateLoresheets([
        loresheetSelection(),
        loresheetSelection({
          selectionId:
            'loresheet-l3-second',
          rating: 2,
          details: {
            kind: 'loresheet',
            loresheetKey:
              'descendant-of-helena',
            benefitKey:
              'helena-true-talent',
          },
        }),
      ])

    assert.equal(
      codes(result).includes(
        'CHARACTER_LORESHEET_MULTIPLE_SHEETS_NOT_ALLOWED',
      ),
      false,
    )

    assert.equal(
      codes(result).includes(
        'CHARACTER_LORESHEET_RATING_MISMATCH',
      ),
      false,
    )
  },
)

test(
  'SPEC-026.L3 backend rechaza beneficios de dos Fichas distintas',
  () => {
    const result =
      validateLoresheets([
        loresheetSelection(),
        loresheetSelection({
          selectionId:
            'loresheet-l3-bahari',
          details: {
            kind: 'loresheet',
            loresheetKey:
              'bahari',
            benefitKey:
              'bahari-dangerous-reputation',
          },
        }),
      ])

    assert.ok(
      codes(result).includes(
        'CHARACTER_LORESHEET_MULTIPLE_SHEETS_NOT_ALLOWED',
      ),
    )
  },
)

test(
  'SPEC-026.L3 backend revalida el requisito de Clan de la Loresheet',
  () => {
    const hardestadt =
      loresheetSelection({
        selectionId:
          'loresheet-l3-hardestadt',
        details: {
          kind: 'loresheet',
          loresheetKey:
            'descendant-of-hardestadt',
          benefitKey:
            'hardestadt-voice',
        },
      })

    const wrongClan =
      validateLoresheets(
        [hardestadt],
        'toreador',
      )

    const allowedClan =
      validateLoresheets(
        [hardestadt],
        'ventrue',
      )

    const missingClan =
      validateLoresheets(
        [hardestadt],
        null,
        'draftSave',
      )

    assert.ok(
      codes(wrongClan).includes(
        'CHARACTER_LORESHEET_CLAN_REQUIRED',
      ),
    )

    assert.equal(
      codes(allowedClan).includes(
        'CHARACTER_LORESHEET_CLAN_REQUIRED',
      ),
      false,
    )

    assert.ok(
      codes(missingClan).includes(
        'CHARACTER_LORESHEET_CLAN_REQUIRED',
      ),
    )

    assert.equal(
      missingClan.issues.find(
        (item) =>
          item.code ===
          'CHARACTER_LORESHEET_CLAN_REQUIRED',
      )?.severity,
      'warning',
    )
  },
)

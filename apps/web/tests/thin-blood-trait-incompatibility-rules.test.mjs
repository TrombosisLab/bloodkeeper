import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getThinBloodTraitDefinition,
} from '../src/features/character-creation/data/thin-blood-trait-definitions.ts'

import {
  getThinBloodTraitIncompatibilities,
  validateThinBloodTraitSelection,
} from '../src/features/character-creation/domain/thin-blood-trait-rules.ts'

function draft(...definitionKeys) {
  return {
    selections:
      definitionKeys.map(
        (definitionKey) => ({
          definitionKey,
        }),
      ),
  }
}

test(
  'Carne Muerta es incompatible con Vívido',
  () => {
    const value = draft(
      'dead-flesh',
      'lively',
    )

    const conflicts =
      getThinBloodTraitIncompatibilities(
        value,
      )

    assert.equal(
      conflicts.length,
      1,
    )

    assert.equal(
      validateThinBloodTraitSelection(
        value,
      ).valid,
      false,
    )
  },
)

test(
  'Fragilidad Mortal es incompatible con Resiliencia Vampírica',
  () => {
    const value = draft(
      'mortal-frailty',
      'vampiric-resilience',
    )

    assert.equal(
      getThinBloodTraitIncompatibilities(
        value,
      ).length,
      1,
    )

    assert.equal(
      validateThinBloodTraitSelection(
        value,
      ).valid,
      false,
    )
  },
)

test(
  'Rechazado por los Anarquistas es incompatible con Camaradas Anarquistas',
  () => {
    const value = draft(
      'anarch-rejected',
      'anarch-comrades',
    )

    assert.equal(
      getThinBloodTraitIncompatibilities(
        value,
      ).length,
      1,
    )

    assert.equal(
      validateThinBloodTraitSelection(
        value,
      ).valid,
      false,
    )
  },
)

test(
  'Marcado por la Camarilla puede coexistir con Contacto de la Camarilla',
  () => {
    const value = draft(
      'camarilla-branded',
      'camarilla-contact',
    )

    assert.deepEqual(
      getThinBloodTraitIncompatibilities(
        value,
      ),
      [],
    )

    assert.equal(
      validateThinBloodTraitSelection(
        value,
      ).valid,
      true,
    )
  },
)

test(
  'el catálogo no inventa incompatibilidades adicionales',
  () => {
    const expected = new Map([
      [
        'dead-flesh',
        ['lively'],
      ],
      [
        'lively',
        ['dead-flesh'],
      ],
      [
        'mortal-frailty',
        ['vampiric-resilience'],
      ],
      [
        'vampiric-resilience',
        ['mortal-frailty'],
      ],
      [
        'anarch-rejected',
        ['anarch-comrades'],
      ],
      [
        'anarch-comrades',
        ['anarch-rejected'],
      ],
    ])

    for (
      const [
        key,
        incompatibleWithKeys,
      ]
      of expected
    ) {
      assert.deepEqual(
        getThinBloodTraitDefinition(
          key,
        )?.incompatibleWithKeys,
        incompatibleWithKeys,
      )
    }

    const keysWithoutConflicts = [
      'vitae-dependency',
      'baby-teeth',
      'clan-curse',
      'camarilla-branded',
      'bestial-temper',
      'thin-blood-alchemist',
      'day-drinker',
      'camarilla-contact',
      'discipline-affinity',
      'bonding-blood',
    ]

    for (
      const key
      of keysWithoutConflicts
    ) {
      assert.equal(
        getThinBloodTraitDefinition(
          key,
        )?.incompatibleWithKeys,
        undefined,
      )
    }
  },
)

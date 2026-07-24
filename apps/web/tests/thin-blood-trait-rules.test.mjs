import assert from 'node:assert/strict'
import test from 'node:test'

import {
  countThinBloodTraitsByCategory,
  hasDuplicateThinBloodTraitSelections,
  hasUnknownThinBloodTraitSelections,
  validateThinBloodTraitSelection,
  validateThinBloodTraitsForCharacterKind,
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
  'acepta 1 Mérito y 1 Defecto de Sangre Débil',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          'day-drinker',
          'baby-teeth',
        ),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  'acepta 2 Méritos y 2 Defectos de Sangre Débil',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          'day-drinker',
          'lively',
          'baby-teeth',
          'dead-flesh',
        ),
      )

    assert.equal(result.valid, true)
  },
)

test(
  'acepta 3 Méritos y 3 Defectos de Sangre Débil',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          'day-drinker',
          'lively',
          'bonding-blood',
          'baby-teeth',
          'vitae-dependency',
          'camarilla-branded',
        ),
      )

    assert.equal(result.valid, true)
  },
)

test(
  'rechaza una selección vacía para Sangre Débil',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(),
      )

    assert.equal(result.valid, false)

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'entre 1 y 3 Méritos',
          ),
      ),
      true,
    )
  },
)

test(
  'rechaza más de 3 Méritos',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          'day-drinker',
          'lively',
          'bonding-blood',
          'camarilla-contact',
          'baby-teeth',
          'vitae-dependency',
          'camarilla-branded',
          'bestial-temper',
        ),
      )

    assert.equal(result.valid, false)
  },
)

test(
  'rechaza cantidades distintas de Méritos y Defectos',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          'day-drinker',
          'lively',
          'baby-teeth',
        ),
      )

    assert.equal(result.valid, false)

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'misma cantidad',
          ),
      ),
      true,
    )
  },
)

test(
  'rechaza claves desconocidas',
  () => {
    const value = draft(
      'day-drinker',
      'unknown-thin-blood-trait',
    )

    assert.equal(
      hasUnknownThinBloodTraitSelections(
        value,
      ),
      true,
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
  'rechaza selecciones duplicadas',
  () => {
    const value = draft(
      'day-drinker',
      'day-drinker',
      'baby-teeth',
      'vitae-dependency',
    )

    assert.equal(
      hasDuplicateThinBloodTraitSelections(
        value,
      ),
      true,
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
  'cuenta Méritos y Defectos por categoría',
  () => {
    const value = draft(
      'day-drinker',
      'lively',
      'baby-teeth',
      'dead-flesh',
    )

    assert.equal(
      countThinBloodTraitsByCategory(
        value,
        'merit',
      ),
      2,
    )

    assert.equal(
      countThinBloodTraitsByCategory(
        value,
        'flaw',
      ),
      2,
    )
  },
)

test(
  'rechaza rasgos de Sangre Débil en un personaje que no sea Sangre Débil',
  () => {
    const result =
      validateThinBloodTraitsForCharacterKind(
        draft(
          'day-drinker',
          'baby-teeth',
        ),
        'clan',
      )

    assert.equal(result.valid, false)
  },
)

test(
  'acepta estado vacío para un personaje que no sea Sangre Débil',
  () => {
    const result =
      validateThinBloodTraitsForCharacterKind(
        draft(),
        'clan',
      )

    assert.equal(result.valid, true)
  },
)

test(
  'exige una selección completa válida para un personaje Sangre Débil',
  () => {
    assert.equal(
      validateThinBloodTraitsForCharacterKind(
        draft(),
        'thinBlood',
      ).valid,
      false,
    )

    assert.equal(
      validateThinBloodTraitsForCharacterKind(
        draft(
          'thin-blood-alchemist',
          'vitae-dependency',
        ),
        'thinBlood',
      ).valid,
      true,
    )
  },
)

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeThinBloodAlchemyFormulaKeys,
  normalizeThinBloodAlchemyForClan,
  validateThinBloodAlchemyDraft,
} from '../src/features/character-creation/domain/thin-blood-alchemy-rules.ts'

test(
  'Alquimia 0 normaliza método y fórmulas a estado vacío',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyForClan(
        {
          rating: 0,
          method: 'fixatio',
          formulaKeys: [
            'farReach',
          ],
        },
        'thinBlood',
      ),
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )
  },
)

test(
  'Alquimia positiva conserva un método válido',
  () => {
    assert.equal(
      normalizeThinBloodAlchemyForClan(
        {
          rating: 1,
          method: 'fixatio',
          formulaKeys: [],
        },
        'thinBlood',
      ).method,
      'fixatio',
    )
  },
)

test(
  'normalizar fórmulas elimina claves inexistentes',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyFormulaKeys(
        [
          'farReach',
          'formula-inexistente',
        ],
        1,
      ),
      [
        'farReach',
      ],
    )
  },
)

test(
  'normalizar fórmulas elimina duplicados',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyFormulaKeys(
        [
          'farReach',
          'farReach',
          'haze',
        ],
        1,
      ),
      [
        'farReach',
        'haze',
      ],
    )
  },
)

test(
  'normalizar fórmulas elimina niveles superiores al rating',
  () => {
    assert.deepEqual(
      normalizeThinBloodAlchemyFormulaKeys(
        [
          'farReach',
          'envelop',
          'defractionate',
        ],
        2,
      ),
      [
        'farReach',
        'envelop',
      ],
    )
  },
)

test(
  'rating 1 acepta una fórmula oficial de nivel 1',
  () => {
    assert.equal(
      validateThinBloodAlchemyDraft({
        rating: 1,
        method: 'athanorCorporis',
        formulaKeys: [
          'farReach',
        ],
      }).valid,
      true,
    )
  },
)

test(
  'rating 1 acepta fórmulas nivel 1 de suplementos disponibles',
  () => {
    assert.equal(
      validateThinBloodAlchemyDraft({
        rating: 1,
        method: 'calcinatio',
        formulaKeys: [
          'plugIn',
          'elevated',
        ],
      }).valid,
      true,
    )
  },
)

test(
  'rating positivo requiere método de destilación',
  () => {
    const result =
      validateThinBloodAlchemyDraft({
        rating: 1,
        method: null,
        formulaKeys: [
          'farReach',
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'método de destilación',
          ),
      ),
      true,
    )
  },
)

test(
  'rechaza una fórmula inexistente',
  () => {
    const result =
      validateThinBloodAlchemyDraft({
        rating: 1,
        method: 'fixatio',
        formulaKeys: [
          'formula-inexistente',
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'no existe',
          ),
      ),
      true,
    )
  },
)

test(
  'rechaza una fórmula de nivel superior al rating',
  () => {
    const result =
      validateThinBloodAlchemyDraft({
        rating: 1,
        method: 'fixatio',
        formulaKeys: [
          'envelop',
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'supera la puntuación',
          ),
      ),
      true,
    )
  },
)

test(
  'rechaza fórmulas duplicadas',
  () => {
    const result =
      validateThinBloodAlchemyDraft({
        rating: 1,
        method: 'fixatio',
        formulaKeys: [
          'farReach',
          'farReach',
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'duplicada',
          ),
      ),
      true,
    )
  },
)

test(
  'Alquimia 0 rechaza método y fórmulas inyectados',
  () => {
    const result =
      validateThinBloodAlchemyDraft({
        rating: 0,
        method: 'fixatio',
        formulaKeys: [
          'farReach',
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.length >= 2,
      true,
    )
  },
)

test(
  'la validación general no limita el número de fórmulas al rating',
  () => {
    assert.equal(
      validateThinBloodAlchemyDraft({
        rating: 1,
        method: 'fixatio',
        formulaKeys: [
          'farReach',
          'profaneHierosGamos',
          'haze',
          'plugIn',
          'mercurianTongue',
          'elevated',
        ],
      }).valid,
      true,
    )
  },
)

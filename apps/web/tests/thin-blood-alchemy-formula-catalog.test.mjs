import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getThinBloodAlchemyFormulaByKey,
  getThinBloodAlchemyFormulasByLevel,
  getThinBloodAlchemyFormulasBySource,
  thinBloodAlchemyFormulaCatalog,
} from '../src/features/character-creation/data/thin-blood-alchemy-formulas.ts'

test(
  'el catálogo contiene exactamente 36 fórmulas oficiales nombradas',
  () => {
    assert.equal(
      thinBloodAlchemyFormulaCatalog.length,
      36,
    )
  },
)

test(
  'todas las fórmulas oficiales tienen claves únicas',
  () => {
    const keys =
      thinBloodAlchemyFormulaCatalog.map(
        (formula) =>
          formula.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'todas las fórmulas oficiales son de tipo named',
  () => {
    assert.equal(
      thinBloodAlchemyFormulaCatalog.every(
        (formula) =>
          formula.kind === 'named',
      ),
      true,
    )
  },
)

test(
  'el catálogo conserva el reparto por fuente 7 + 9 + 20',
  () => {
    assert.equal(
      getThinBloodAlchemyFormulasBySource(
        'core',
      ).length,
      7,
    )

    assert.equal(
      getThinBloodAlchemyFormulasBySource(
        'playersGuide',
      ).length,
      9,
    )

    assert.equal(
      getThinBloodAlchemyFormulasBySource(
        'bloodSigils',
      ).length,
      20,
    )
  },
)

test(
  'el catálogo conserva el reparto total por niveles',
  () => {
    const expected = {
      1: 10,
      2: 5,
      3: 11,
      4: 7,
      5: 3,
    }

    for (
      const [level, count] of
        Object.entries(expected)
    ) {
      assert.equal(
        getThinBloodAlchemyFormulasByLevel(
          Number(level),
        ).length,
        count,
      )
    }
  },
)

test(
  'las siete fórmulas CORE conservan sus niveles',
  () => {
    const expected = {
      farReach: 1,
      profaneHierosGamos: 1,
      haze: 1,
      envelop: 2,
      defractionate: 3,
      airborneMomentum: 4,
      awakenTheSleeper: 5,
    }

    for (
      const [key, level] of
        Object.entries(expected)
    ) {
      assert.equal(
        getThinBloodAlchemyFormulaByKey(
          key,
        )?.level,
        level,
      )
    }
  },
)

test(
  'Piel Adamantina mantiene su relación documental con Tanque',
  () => {
    assert.deepEqual(
      getThinBloodAlchemyFormulaByKey(
        'adamantineSkin',
      )?.relatedFormulaKeys,
      [
        'tank',
      ],
    )

    assert.equal(
      getThinBloodAlchemyFormulaByKey(
        'tank',
      )?.source,
      'playersGuide',
    )
  },
)

test(
  'la consulta por clave devuelve null para fórmulas inexistentes',
  () => {
    assert.equal(
      getThinBloodAlchemyFormulaByKey(
        'not-a-real-formula',
      ),
      null,
    )
  },
)

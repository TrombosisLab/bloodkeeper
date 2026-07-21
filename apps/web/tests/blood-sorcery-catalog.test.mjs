import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

const powers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'bloodSorcery',
  )

test(
  'Hechicería de Sangre contiene exactamente 8 poderes core',
  () => {
    assert.equal(
      powers.length,
      8,
    )
  },
)

test(
  'la distribución de poderes por nivel es correcta',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          (level) => [
            level,
            powers.filter(
              (power) =>
                power.level === level,
            ).length,
          ],
        ),
      )

    assert.deepEqual(
      distribution,
      {
        1: 2,
        2: 1,
        3: 2,
        4: 1,
        5: 2,
      },
    )
  },
)

test(
  'Hechicería de Sangre usa exclusivamente contenido core',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
            'core-v5-es' &&
          !power.key.includes(
            '-dev-',
          ),
      ),
      true,
    )
  },
)

test(
  'los poderes de nivel 1 son Sabor de la Sangre y Vitae Corrosiva',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 1,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Sabor de la Sangre',
        'Vitae Corrosiva',
      ],
    )
  },
)

test(
  'Extinguir Vitae es el único poder de nivel 2',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 2,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Extinguir Vitae',
      ],
    )
  },
)

test(
  'Sangre de Potencia y Toque de Escorpión son nivel 3',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 3,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Sangre de Potencia',
        'Toque de Escorpión',
      ],
    )
  },
)

test(
  'Robo de Vitae es el único poder de nivel 4',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 4,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Robo de Vitae',
      ],
    )
  },
)

test(
  'Caldero de Sangre y Caricia de Baal son nivel 5',
  () => {
    assert.deepEqual(
      powers
        .filter(
          (power) =>
            power.level === 5,
        )
        .map(
          (power) =>
            power.name,
        ),
      [
        'Caldero de Sangre',
        'Caricia de Baal',
      ],
    )
  },
)

test(
  'todos los poderes tienen trazabilidad bibliográfica',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          Number.isInteger(
            power.sourcePage,
          ) &&
          power.sourcePage >= 272 &&
          power.sourcePage <= 275,
      ),
      true,
    )
  },
)

test(
  'las claves de Hechicería de Sangre son únicas',
  () => {
    const keys =
      powers.map(
        (power) =>
          power.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

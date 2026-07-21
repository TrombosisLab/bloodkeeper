import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

const powers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'fortitude',
  )

test(
  'Fortaleza del manual básico contiene exactamente 9 poderes',
  () => {
    assert.equal(
      powers.length,
      9,
    )
  },
)

test(
  'la distribución por niveles de Fortaleza es correcta',
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
        5: 3,
      },
    )
  },
)

test(
  'todos los poderes de Fortaleza usan la fuente core',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

test(
  'Fortaleza no conserva poderes DEV',
  () => {
    assert.equal(
      powers.some(
        (power) =>
          power.key.includes('-dev-'),
      ),
      false,
    )
  },
)

test(
  'los poderes de nivel 1 son Resiliencia y Mente Inquebrantable',
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
        'Resiliencia',
        'Mente Inquebrantable',
      ],
    )
  },
)

test(
  'Dureza es el poder de nivel 2',
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
        'Dureza',
      ],
    )
  },
)

test(
  'Fortaleza cubre todos los niveles 1 a 5',
  () => {
    const levels =
      [
        ...new Set(
          powers.map(
            (power) =>
              power.level,
          ),
        ),
      ].sort()

    assert.deepEqual(
      levels,
      [1, 2, 3, 4, 5],
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
          power.sourcePage > 0,
      ),
      true,
    )
  },
)

test(
  'las claves de Fortaleza son únicas',
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

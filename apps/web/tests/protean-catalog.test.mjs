import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

const powers =
  disciplinePowerDefinitions.filter(
    (power) =>
      power.disciplineKey ===
      'protean',
  )

test(
  'Protean del manual básico contiene exactamente 8 poderes',
  () => {
    assert.equal(
      powers.length,
      8,
    )
  },
)

test(
  'la distribución por niveles de Protean es correcta',
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
  'todos los poderes de Protean usan la fuente core',
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
  'Protean no conserva poderes DEV',
  () => {
    assert.equal(
      powers.some(
        (power) =>
          power.key.includes(
            '-dev-',
          ),
      ),
      false,
    )
  },
)

test(
  'los poderes de nivel 1 son Ojos de la Bestia y Peso de la Pluma',
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
        'Ojos de la Bestia',
        'Peso de la Pluma',
      ],
    )
  },
)

test(
  'Armas Salvajes es el poder de nivel 2',
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
        'Armas Salvajes',
      ],
    )
  },
)

test(
  'Protean cubre todos los niveles 1 a 5',
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
  'todos los poderes de Protean tienen trazabilidad bibliográfica',
  () => {
    assert.equal(
      powers.every(
        (power) =>
          Number.isInteger(
            power.sourcePage,
          ) &&
          power.sourcePage >= 270 &&
          power.sourcePage <= 272,
      ),
      true,
    )
  },
)

test(
  'las claves de Protean son únicas',
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

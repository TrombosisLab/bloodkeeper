import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

const proteanPowers =
  disciplinePowerDefinitions.filter(
    power =>
      power.disciplineKey ===
      'protean',
  )

const byKey =
  new Map(
    proteanPowers.map(
      power => [
        power.key,
        power,
      ],
    ),
  )

test(
  '025-A9-R3 Protean CORE contiene exactamente 8 Poderes',
  () => {
    assert.equal(
      proteanPowers.length,
      8,
    )
  },
)

test(
  '025-A9-R3 la distribución CORE de Protean es 2 1 2 1 2',
  () => {
    const counts =
      new Map()

    for (const power of proteanPowers) {
      counts.set(
        power.level,
        (counts.get(power.level) ?? 0) + 1,
      )
    }

    assert.deepEqual(
      [...counts.entries()].sort(
        ([left]) => left,
      ),
      [
        [1, 2],
        [2, 1],
        [3, 2],
        [4, 1],
        [5, 2],
      ],
    )
  },
)

test(
  '025-A9-R3 Protean usa el inventario CORE canónico reconciliado',
  () => {
    assert.deepEqual(
      proteanPowers.map(
        power => ({
          key: power.key,
          name: power.name,
          level: power.level,
          sourcePage:
            power.sourcePage,
        }),
      ),
      [
        {
          key:
            'protean-eyes-of-the-beast',
          name:
            'Ojos de la Bestia',
          level: 1,
          sourcePage: 269,
        },
        {
          key:
            'protean-weight-of-the-feather',
          name:
            'Peso de la Pluma',
          level: 1,
          sourcePage: 269,
        },
        {
          key:
            'protean-feral-weapons',
          name:
            'Armas Salvajes',
          level: 2,
          sourcePage: 270,
        },
        {
          key:
            'protean-shapechange',
          name:
            'Cambiar de Forma',
          level: 3,
          sourcePage: 270,
        },
        {
          key:
            'protean-earth-meld',
          name:
            'Fusión con la Tierra',
          level: 3,
          sourcePage: 271,
        },
        {
          key:
            'protean-metamorphosis',
          name:
            'Metamorfosis',
          level: 4,
          sourcePage: 271,
        },
        {
          key:
            'protean-unfettered-heart',
          name:
            'Corazón Liberado',
          level: 5,
          sourcePage: 271,
        },
        {
          key:
            'protean-mist-form',
          name:
            'Forma de Niebla',
          level: 5,
          sourcePage: 271,
        },
      ],
    )
  },
)

test(
  '025-A9-R3 Metamorfosis requiere Cambiar de Forma',
  () => {
    const metamorphosis =
      byKey.get(
        'protean-metamorphosis',
      )

    assert.ok(metamorphosis)

    assert.deepEqual(
      metamorphosis.requirements,
      {
        prerequisitePowerKeys: [
          'protean-shapechange',
        ],
      },
    )
  },
)

test(
  '025-A9-R3 retira Forma Horrenda y Corazón de la Oscuridad del CORE',
  () => {
    assert.equal(
      byKey.has(
        'protean-horrid-form',
      ),
      false,
    )

    assert.equal(
      byKey.has(
        'protean-heart-of-darkness',
      ),
      false,
    )
  },
)

test(
  '025-A9-R3 Protean usa exclusivamente fuente core y páginas 269 a 271',
  () => {
    for (
      const power of proteanPowers
    ) {
      assert.equal(
        power.sourceKey,
        'core-v5-es',
      )

      assert.ok(
        power.sourcePage >= 269 &&
          power.sourcePage <= 271,
      )
    }
  },
)

test(
  '025-A9-R3 las keys de Protean son únicas y no contienen DEV',
  () => {
    const keys =
      proteanPowers.map(
        power => power.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )

    assert.equal(
      keys.some(
        key =>
          key.toLowerCase()
            .includes('dev'),
      ),
      false,
    )
  },
)

test(
  '025-A9-R3 Protean no usa diceCheck legacy',
  () => {
    for (
      const power of proteanPowers
    ) {
      assert.equal(
        power.diceCheck,
        undefined,
      )
    }
  },
)

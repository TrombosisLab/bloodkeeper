import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  canLearnDisciplinePower,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const powers =
  disciplinePowerDefinitions.filter(
    power =>
      power.disciplineKey ===
      'dominate',
  )

function getPower(key) {
  const power =
    disciplinePowerDefinitions.find(
      candidate =>
        candidate.key === key,
    )

  assert.ok(
    power,
    `No existe el poder ${key}`,
  )

  return power
}

test(
  '025-A7-R3 Dominación CORE contiene exactamente 9 Poderes',
  () => {
    assert.equal(
      powers.length,
      9,
    )
  },
)

test(
  '025-A7-R3 la distribución CORE de Dominación es 2 2 2 1 2',
  () => {
    const distribution =
      Object.fromEntries(
        [1, 2, 3, 4, 5].map(
          level => [
            level,
            powers.filter(
              power =>
                power.level ===
                level,
            ).length,
          ],
        ),
      )

    assert.deepEqual(
      distribution,
      {
        1: 2,
        2: 2,
        3: 2,
        4: 1,
        5: 2,
      },
    )
  },
)

test(
  '025-A7-R3 Dominación CORE usa el inventario canónico reconciliado',
  () => {
    assert.deepEqual(
      powers.map(
        power => ({
          key: power.key,
          level: power.level,
          name: power.name,
          page: power.sourcePage,
        }),
      ),
      [
        {
          key:
            'dominate-cloud-memory',
          level: 1,
          name:
            'Nublar la Memoria',
          page: 255,
        },
        {
          key:
            'dominate-compel',
          level: 1,
          name: 'Compelir',
          page: 255,
        },
        {
          key:
            'dominate-dementation',
          level: 2,
          name: 'Dementación',
          page: 256,
        },
        {
          key:
            'dominate-mesmerize',
          level: 2,
          name: 'Mesmerismo',
          page: 256,
        },
        {
          key:
            'dominate-submerged-directive',
          level: 3,
          name:
            'Directriz Sumergida',
          page: 257,
        },
        {
          key:
            'dominate-the-forgetful-mind',
          level: 3,
          name:
            'Mente Olvidadiza',
          page: 257,
        },
        {
          key:
            'dominate-rationalize',
          level: 4,
          name: 'Racionalizar',
          page: 257,
        },
        {
          key:
            'dominate-terminal-decree',
          level: 5,
          name:
            'Decreto Terminal',
          page: 257,
        },
        {
          key:
            'dominate-mass-manipulation',
          level: 5,
          name:
            'Manipulación en Masa',
          page: 257,
        },
      ],
    )
  },
)

test(
  '025-A7-R3 Dementación requiere Ofuscación 2',
  () => {
    const dementation =
      getPower(
        'dominate-dementation',
      )

    assert.deepEqual(
      dementation.requirements,
      {
        amalgam: {
          disciplineKey:
            'obfuscate',
          minimumLevel: 2,
        },
      },
    )
  },
)

test(
  '025-A7-R3 Dementación no es aprendible sin Ofuscación 2',
  () => {
    const dementation =
      getPower(
        'dominate-dementation',
      )

    const result =
      canLearnDisciplinePower(
        dementation,
        [
          {
            key: 'dominate',
            value: 2,
            powerKeys: [
              'dominate-compel',
            ],
          },
          {
            key: 'obfuscate',
            value: 1,
            powerKeys: [
              'obfuscate-cloak-of-shadows',
            ],
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  '025-A7-R3 Dementación es aprendible con Dominación 2 y Ofuscación 2',
  () => {
    const dementation =
      getPower(
        'dominate-dementation',
      )

    const result =
      canLearnDisciplinePower(
        dementation,
        [
          {
            key: 'dominate',
            value: 2,
            powerKeys: [
              'dominate-compel',
            ],
          },
          {
            key: 'obfuscate',
            value: 2,
            powerKeys: [
              'obfuscate-cloak-of-shadows',
              'obfuscate-unseen-passage',
            ],
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  '025-A7-R3 Sumisión Total deja de formar parte del CORE',
  () => {
    assert.equal(
      disciplinePowerDefinitions.some(
        power =>
          power.key ===
          'dominate-total-subjugation',
      ),
      false,
    )

    assert.equal(
      powers.some(
        power =>
          power.name ===
          'Sumisión Total',
      ),
      false,
    )
  },
)

test(
  '025-A7-R3 Dominación usa exclusivamente fuente core y trazabilidad 255 a 257',
  () => {
    assert.equal(
      powers.every(
        power =>
          power.sourceKey ===
            'core-v5-es' &&
          Number.isInteger(
            power.sourcePage,
          ) &&
          power.sourcePage >= 255 &&
          power.sourcePage <= 257 &&
          power.active !== false,
      ),
      true,
    )
  },
)

test(
  '025-A7-R3 las claves de Dominación son únicas',
  () => {
    const keys =
      powers.map(
        power =>
          power.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  '025-A7-R3 Posesión de Auspex sigue reconociendo Dominación 3',
  () => {
    const possession =
      getPower(
        'auspex-possession',
      )

    const result =
      canLearnDisciplinePower(
        possession,
        [
          {
            key: 'auspex',
            value: 5,
            powerKeys: [],
          },
          {
            key: 'dominate',
            value: 3,
            powerKeys: [
              'dominate-compel',
              'dominate-mesmerize',
              'dominate-submerged-directive',
            ],
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  '025-A7-R3 Voz Irresistible sigue reconociendo Dominación 1',
  () => {
    const irresistibleVoice =
      getPower(
        'presence-irresistible-voice',
      )

    const result =
      canLearnDisciplinePower(
        irresistibleVoice,
        [
          {
            key: 'presence',
            value: 4,
            powerKeys: [],
          },
          {
            key: 'dominate',
            value: 1,
            powerKeys: [
              'dominate-compel',
            ],
          },
        ],
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  '025-A7-R3 Dominación no usa diceCheck legacy',
  () => {
    assert.equal(
      powers.every(
        power =>
          power.diceCheck ===
            undefined,
      ),
      true,
    )
  },
)

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'

const powers =
  disciplinePowerDefinitions.filter(
    power =>
      power.disciplineKey ===
      'fortitude',
  )

const byKey =
  Object.fromEntries(
    powers.map(
      power => [
        power.key,
        power,
      ],
    ),
  )

const mechanics = key => {
  const power = byKey[key]

  assert.ok(
    power,
    `Poder no encontrado: ${key}`,
  )

  assert.ok(
    power.mechanics,
    `mechanics ausente: ${key}`,
  )

  return power.mechanics
}

test(
  '025-A8-M2 Fortaleza tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
  () => {
    assert.equal(
      powers.length,
      9,
    )

    assert.equal(
      powers.every(
        power =>
          power.mechanics !==
          undefined,
      ),
      true,
    )

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

test(
  '025-A8-M2 el catálogo completo satisface el validator con Fortaleza',
  () => {
    assert.deepEqual(
      validateDisciplinePowerCatalog(
        disciplinePowerDefinitions,
      ),
      {
        valid: true,
        violations: [],
      },
    )
  },
)

test(
  '025-A8-M2 Resiliencia no cuesta Control y es pasiva',
  () => {
    const value =
      mechanics(
        'fortitude-resilience',
      )

    assert.deepEqual(
      value.activation,
      {
        kind: 'standalone',
      },
    )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'none',
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'passive',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /Fortaleza.*Salud/s,
    )
  },
)

test(
  '025-A8-M2 Mente Imperturbable no cuesta Control y es pasiva',
  () => {
    const value =
      mechanics(
        'fortitude-unswayable-mind',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'none',
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'passive',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /resistir.*coacción.*influencias.*mente/s,
    )
  },
)

test(
  '025-A8-M2 Bestias Resistentes conserva Animalismo 1 exime al famulus y usa dificultad 3',
  () => {
    const power =
      byKey[
        'fortitude-enduring-beasts'
      ]

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey:
            'animalism',
          minimumLevel: 1,
        },
      },
    )

    const value =
      power.mechanics

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
        exemptions: [
          'targetIsFamulus',
        ],
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'scene',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'fortify-other-animals',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'stamina',
            },
            {
              kind: 'discipline',
              key: 'animalism',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 3,
          },
        },
      ],
    )
  },
)

test(
  '025-A8-M2 Dureza cuesta un Control dura una escena y no tiene prueba propia',
  () => {
    const value =
      mechanics(
        'fortitude-toughness',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'scene',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /daño superficial.*Fortaleza/s,
    )
  },
)

test(
  '025-A8-M2 Desafiar Prohibición usa Astucia más Supervivencia a dificultad 3',
  () => {
    const value =
      mechanics(
        'fortitude-defy-bane',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'scene',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'defy-aggravated-damage',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'skill',
              key: 'survival',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 3,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /reacción.*daño agravado.*superficial/s,
    )
  },
)

test(
  '025-A8-M2 Fortificar la Fachada Interior no cuesta Control y dura una escena',
  () => {
    const value =
      mechanics(
        'fortitude-fortify-inner-facade',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'none',
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'scene',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /intrusiones sobrenaturales.*Fortaleza/s,
    )
  },
)

test(
  '025-A8-M2 Sorbo de Aguante cuesta un Control y termina por alimentación o Ansia 5',
  () => {
    const value =
      mechanics(
        'fortitude-draught-of-endurance',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind:
          'nightWithEndConditions',
        endConditions: [
          'nextFeeding',
          'hungerFive',
        ],
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )
  },
)

test(
  '025-A8-M2 Arrojo por el Dolor cuesta un Control y dura una escena',
  () => {
    const value =
      mechanics(
        'fortitude-prowess-from-pain',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'scene',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /penalizaciones.*daño.*Atributos Físicos/s,
    )
  },
)

test(
  '025-A8-M2 Carne de Mármol cuesta dos Controles y dura una escena',
  () => {
    const value =
      mechanics(
        'fortitude-flesh-of-marble',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 2,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'scene',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /primera fuente.*daño físico.*cada turno/s,
    )
  },
)

test(
  '025-A8-M2 conserva completas las siete Disciplinas mecanizadas previas',
  () => {
    for (
      const disciplineKey
      of [
        'obfuscate',
        'potence',
        'presence',
        'celerity',
        'animalism',
        'auspex',
        'dominate',
      ]
    ) {
      const previous =
        disciplinePowerDefinitions.filter(
          power =>
            power.disciplineKey ===
            disciplineKey,
        )

      assert.ok(
        previous.length > 0,
      )

      assert.equal(
        previous.every(
          power =>
            power.mechanics !==
            undefined,
        ),
        true,
      )
    }
  },
)

test(
  '025-A8-M2 la Web recibe Fortaleza desde el catálogo compartido sin duplicación',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )

    const shared =
      characterDisciplineCatalog.powers.filter(
        power =>
          power.disciplineKey ===
          'fortitude',
      )

    assert.equal(
      shared.length,
      9,
    )

    assert.equal(
      shared.every(
        power =>
          power.mechanics !==
          undefined,
      ),
      true,
    )
  },
)

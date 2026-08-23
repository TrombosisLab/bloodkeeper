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
      'protean',
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
  '025-A9-M2 Protean tiene mechanics en sus 8 Poderes y ningún diceCheck legacy',
  () => {
    assert.equal(
      powers.length,
      8,
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
  '025-A9-M2 el catálogo completo satisface el validator con Protean',
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
  '025-A9-M2 Ojos de la Bestia no cuesta Control y dura mientras se desee',
  () => {
    const value =
      mechanics(
        'protean-eyes-of-the-beast',
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
        kind: 'indefinite',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /oscuridad total.*\+2 dados.*Intimidación.*mortales/s,
    )
  },
)

test(
  '025-A9-M2 Peso de la Pluma no cuesta Control y modela reacción a dificultad 3',
  () => {
    const value =
      mechanics(
        'protean-weight-of-the-feather',
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
        kind: 'indefinite',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'react-to-fall',
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
      /Con preparación no requiere tirada.*Astucia.*Supervivencia.*dificultad 3/s,
    )
  },
)

test(
  '025-A9-M2 Armas Salvajes cuesta un Control y dura una escena',
  () => {
    const value =
      mechanics(
        'protean-feral-weapons',
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
      /\+2.*Pelea.*agravado.*mortales.*superficial.*vampiros.*no se reduce/s,
    )
  },
)

test(
  '025-A9-M2 Cambiar de Forma cuesta un Control y puede finalizar voluntariamente',
  () => {
    const value =
      mechanics(
        'protean-shapechange',
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
        endConditions: [
          'voluntaryEnd',
        ],
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /En un turno.*forma animal.*Atributos Físicos.*Narrador.*Disciplinas/s,
    )
  },
)

test(
  '025-A9-M2 Fusión con la Tierra cuesta un Control y conserva su duración abierta',
  () => {
    const value =
      mechanics(
        'protean-earth-meld',
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
        kind: 'indefinite',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    for (
      const expectedText
      of [
        'En un turno',
        'tierra natural',
        'sueño diurno',
        'un día o más',
        'perturbado',
      ]
    ) {
      assert.equal(
        value.systemSummary.includes(
          expectedText,
        ),
        true,
      )
    }
  },
)

test(
  '025-A9-M2 Metamorfosis conserva prerrequisito y usa el sistema de Cambiar de Forma',
  () => {
    const power =
      byKey[
        'protean-metamorphosis'
      ]

    assert.deepEqual(
      power.requirements,
      {
        prerequisitePowerKeys: [
          'protean-shapechange',
        ],
      },
    )

    const value =
      power.mechanics

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
        endConditions: [
          'voluntaryEnd',
        ],
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /mismo sistema que Cambiar de Forma.*formas animales/s,
    )
  },
)

test(
  '025-A9-M2 Corazón Liberado es pasivo y permite Fuerza más Resolución a dificultad 5',
  () => {
    const value =
      mechanics(
        'protean-unfettered-heart',
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

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'expel-stake',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'strength',
            },
            {
              kind: 'attribute',
              key: 'resolve',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 5,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /dificultad en \+3.*victoria crítica.*1 Control.*Fuerza.*Resolución.*dificultad 5.*una vez por hora.*Ansia 5/s,
    )
  },
)

test(
  '025-A9-M2 Forma de Niebla usa 1–3 Controles y puede finalizar voluntariamente',
  () => {
    const value =
      mechanics(
        'protean-mist-form',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'range',
        minChecks: 1,
        maxChecks: 3,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'scene',
        endConditions: [
          'voluntaryEnd',
        ],
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /3 turnos.*Control de Enardecimiento adicional.*reduce.*1 turno.*entre 1 y 3 Controles/s,
    )
  },
)

test(
  '025-A9-M2 conserva completas las ocho Disciplinas mecanizadas previas',
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
        'fortitude',
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
  '025-A9-M2 la Web recibe Protean desde el catálogo compartido sin duplicación',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )

    const shared =
      characterDisciplineCatalog.powers.filter(
        power =>
          power.disciplineKey ===
          'protean',
      )

    assert.equal(
      shared.length,
      8,
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

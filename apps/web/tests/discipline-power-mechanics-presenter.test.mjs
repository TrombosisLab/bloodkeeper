import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'
import {
  presentDisciplinePowerMechanics,
} from '../src/features/character-sheet/domain/discipline-power-mechanics-presenter.ts'

const byKey =
  Object.fromEntries(
    disciplinePowerDefinitions.map(
      power => [
        power.key,
        power,
      ],
    ),
  )

function view(key) {
  const mechanics =
    byKey[key]?.mechanics

  assert.ok(
    mechanics,
    `${key} no tiene mechanics`,
  )

  return presentDisciplinePowerMechanics(
    mechanics,
  )
}

test(
  '025-A1-M3 presenta coste y duración sin keys internas',
  () => {
    const result =
      view(
        'obfuscate-unseen-passage',
      )

    assert.equal(
      result.cost,
      '1 Control de Enardecimiento',
    )

    assert.equal(
      result.duration,
      'Una escena; termina al ser detectado',
    )
  },
)

test(
  '025-A1-M3 usa labels canónicos en reservas y oposición',
  () => {
    const result =
      view(
        'obfuscate-vanish',
      )

    assert.deepEqual(
      result.checks,
      [
        {
          label: 'Condicional',
          detail:
            'Astucia + Ofuscación contra Astucia + Consciencia',
        },
      ],
    )

    assert.doesNotMatch(
      result.checks[0].detail,
      /wits|awareness|obfuscate/,
    )
  },
)

test(
  '025-A1-M3 presenta dificultad fija y prueba oculta',
  () => {
    const result =
      view(
        'obfuscate-impostors-guise',
      )

    assert.equal(
      result.checks[0].label,
      'Activación · prueba oculta',
    )

    assert.equal(
      result.checks[0].detail,
      'Astucia + Ofuscación · Dificultad 4',
    )

    assert.equal(
      result.checks[1].detail,
      'Manipulación + Interpretación · Dificultad contextual',
    )
  },
)

test(
  '025-A1-M3 presenta rango de dificultad y detección de Ocultar',
  () => {
    const result =
      view(
        'obfuscate-conceal',
      )

    assert.equal(
      result.checks[0].detail,
      'Inteligencia + Ofuscación · Dificultad 2–6',
    )

    assert.equal(
      result.checks[1].label,
      'Detección',
    )

    assert.equal(
      result.checks[1].detail,
      'Astucia + Auspex contra Inteligencia + Ofuscación',
    )
  },
)

test(
  '025-A1-M3 presenta coste heredado y modificadores de Fantasma',
  () => {
    const result =
      view(
        'obfuscate-ghost-in-the-machine',
      )

    assert.equal(
      result.cost,
      'Hereda el coste del Poder base',
    )

    assert.equal(
      result.duration,
      'Hereda la duración del Poder base',
    )

    assert.deepEqual(
      result.modifiers,
      [
        '+3 a la dificultad · identificación en grabaciones',
        '+3 dados · evitar vigilancia automatizada',
      ],
    )

    assert.equal(
      result.modifiers.some(
        line =>
          line.includes(
            'recordedIdentification',
          ),
      ),
      false,
    )
  },
)

test(
  '025-A1-M3 presenta escalado de Encubrimiento sin exponer attributeKey',
  () => {
    const result =
      view(
        'obfuscate-cloak-the-gathering',
      )

    assert.equal(
      result.cost,
      '1 Control de Enardecimiento adicional al Poder base; 1 Control adicional por cada objetivo adicional por encima de Astucia',
    )

    assert.doesNotMatch(
      result.cost,
      /wits|attributeKey/,
    )
  },
)

test(
  '025-A1-M3 presenta el límite por escena de Desvanecerse',
  () => {
    const result =
      view(
        'obfuscate-vanish',
      )

    assert.deepEqual(
      result.limits,
      [
        '1 vez por escena',
      ],
    )
  },
)

const presentSyntheticDuration =
  (duration) =>
    presentDisciplinePowerMechanics(
      {
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'none',
        },
        duration,
      },
    ).duration

test(
  '025-A2-M1 presenta duraciones pasiva alimentación y uso único',
  () => {
    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'passive',
        },
      ),
      'Pasiva',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'feeding',
        },
      ),
      'Una alimentación',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'singleUse',
        },
      ),
      'Un uso',
    )
  },
)

test(
  '025-A2-M1 presenta una noche con condiciones de fin legibles',
  () => {
    const duration =
      presentSyntheticDuration(
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
      duration,
      'Una noche; termina con la siguiente alimentación o Ansia 5',
    )

    assert.doesNotMatch(
      duration,
      /nextFeeding|hungerFive/,
    )
  },
)

test(
  '025-A3-M1 presenta las duraciones propias de Presencia',
  () => {
    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'scene',
          endConditions: [
            'voluntaryEnd',
          ],
        },
      ),
      'Una escena; termina al terminarlo voluntariamente',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'night',
        },
      ),
      'Una noche',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'untilResisted',
        },
      ),
      'Hasta resistir con éxito',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'turns',
          count: 1,
        },
      ),
      '1 turno',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'turns',
          count: 2,
        },
      ),
      '2 turnos',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'hoursByMargin',
          baseHours: 1,
        },
      ),
      '1 hora base; aumenta según el margen',
    )
  },
)

test(
  '025-A3-M1 no expone keys internas de duración de Presencia',
  () => {
    const durations = [
      {
        kind: 'scene',
        endConditions: [
          'voluntaryEnd',
        ],
      },
      {
        kind: 'night',
      },
      {
        kind: 'untilResisted',
      },
      {
        kind: 'turns',
        count: 1,
      },
      {
        kind: 'hoursByMargin',
        baseHours: 1,
      },
    ]

    for (const duration of durations) {
      assert.doesNotMatch(
        presentSyntheticDuration(
          duration,
        ),
        /voluntaryEnd|untilResisted|hoursByMargin|baseHours/,
      )
    }
  },
)

test(
  '025-A9-M1E presenta un rango de Controles sin exponer keys internas',
  () => {
    const view =
      presentDisciplinePowerMechanics(
        {
          systemSummary:
            'Adopta una forma de niebla con coste variable.',
          activation: {
            kind: 'standalone',
          },
          rouseCost: {
            kind: 'range',
            minChecks: 1,
            maxChecks: 3,
          },
          duration: {
            kind: 'scene',
            endConditions: [
              'voluntaryEnd',
            ],
          },
          checks: [],
        },
      )

    assert.equal(
      view.cost,
      '1–3 Controles de Enardecimiento',
    )

    assert.equal(
      view.duration,
      'Una escena; termina al terminarlo voluntariamente',
    )

    const serialized =
      JSON.stringify(view)

    for (const forbidden of [
      '"range"',
      'minChecks',
      'maxChecks',
      'voluntaryEnd',
    ]) {
      assert.equal(
        serialized.includes(
          forbidden,
        ),
        false,
      )
    }
  },
)

test(
  '025-A9-M1H presenta coste y límite horario asociados a un check',
  () => {
    const view =
      presentDisciplinePowerMechanics(
        {
          activation: {
            kind: 'standalone',
          },
          rouseCost: {
            kind: 'none',
          },
          duration: {
            kind: 'passive',
          },
          checks: [
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
              rouseCost: {
                kind: 'fixed',
                checks: 1,
              },
              limits: [
                {
                  kind: 'perHour',
                  count: 1,
                },
              ],
            },
          ],
        },
      )

    assert.equal(
      view.cost,
      'Sin Control de Enardecimiento',
    )

    assert.equal(
      view.checks[0].detail,
      'Fuerza + Resolución · Dificultad 5 · 1 Control de Enardecimiento · 1 vez por hora',
    )

    assert.equal(
      view.checks[0].detail.includes(
        'expel-stake',
      ),
      false,
    )

    assert.equal(
      view.checks[0].detail.includes(
        'perHour',
      ),
      false,
    )
  },
)

test(
  '025-A10-M1 presenta coste mínimo abierto de Enardecimiento',
  () => {
    for (
      const [
        minChecks,
        expected,
      ] of [
        [
          1,
          '1 o más Controles de Enardecimiento',
        ],
        [
          2,
          '2 o más Controles de Enardecimiento',
        ],
      ]
    ) {
      const presented =
        presentDisciplinePowerMechanics(
          {
            systemSummary:
              'Coste mínimo abierto.',
            activation: {
              kind: 'standalone',
            },
            rouseCost: {
              kind: 'atLeast',
              minChecks,
            },
            duration: {
              kind: 'singleUse',
            },
            checks: [],
          },
        )

      assert.ok(presented)

      assert.equal(
        presented.cost,
        expected,
      )

      assert.equal(
        presented.cost.includes(
          'atLeast',
        ),
        false,
      )

      assert.equal(
        presented.cost.includes(
          'minChecks',
        ),
        false,
      )
    }
  },
)

test(
  '025-A11-M1 presenta horas fijas en castellano sin exponer la key interna',
  () => {
    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'hours',
          count: 1,
        },
      ),
      '1 hora',
    )

    assert.equal(
      presentSyntheticDuration(
        {
          kind: 'hours',
          count: 24,
        },
      ),
      '24 horas',
    )

    assert.doesNotMatch(
      presentSyntheticDuration(
        {
          kind: 'hours',
          count: 24,
        },
      ),
      /hours|count/,
    )
  },
)

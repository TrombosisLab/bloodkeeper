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

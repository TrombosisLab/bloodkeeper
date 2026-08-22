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
    ({ disciplineKey }) =>
      disciplineKey === 'obfuscate',
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
    `No existe ${key}`,
  )

  assert.ok(
    power.mechanics,
    `${key} no tiene mechanics`,
  )

  return power.mechanics
}

test(
  '025-A1-M2 Ofuscación tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
  () => {
    assert.equal(powers.length, 9)

    assert.equal(
      powers.every(
        power =>
          power.mechanics !== undefined,
      ),
      true,
    )

    assert.equal(
      powers.some(
        power =>
          power.diceCheck !== undefined,
      ),
      false,
    )
  },
)

test(
  '025-A1-M2 el catálogo real de Ofuscación satisface el validator M1',
  () => {
    assert.deepEqual(
      validateDisciplinePowerCatalog(
        powers,
      ),
      {
        valid: true,
        violations: [],
      },
    )
  },
)

test(
  '025-A1-M2 Capa de Sombras no cuesta Rouse y termina por movimiento o detección',
  () => {
    assert.deepEqual(
      mechanics(
        'obfuscate-cloak-of-shadows',
      ),
      {
        systemSummary:
          'Oculta al usuario mientras permanezca inmóvil; el efecto termina si se mueve o es detectado.',
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'none',
        },
        duration: {
          kind: 'scene',
          endConditions: [
            'movement',
            'detected',
          ],
        },
      },
    )
  },
)

test(
  '025-A1-M2 Silencio de la Muerte no cuesta Rouse y dura una escena',
  () => {
    const value =
      mechanics(
        'obfuscate-silence-of-death',
      )

    assert.deepEqual(
      {
        activation:
          value.activation,
        rouseCost:
          value.rouseCost,
        duration:
          value.duration,
        checks:
          value.checks,
      },
      {
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'none',
        },
        duration: {
          kind: 'scene',
        },
        checks: undefined,
      },
    )
  },
)

test(
  '025-A1-M2 Paso Invisible cuesta un Control y termina por detección o fin de escena',
  () => {
    const value =
      mechanics(
        'obfuscate-unseen-passage',
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
          'detected',
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
  '025-A1-M2 Fantasma en la Máquina no añade coste propio y hereda el coste del Poder base',
  () => {
    const value =
      mechanics(
        'obfuscate-ghost-in-the-machine',
      )

    assert.deepEqual(
      value.activation,
      {
        kind: 'enhancement',
      },
    )

    assert.deepEqual(
      value.rouseCost,
      {
        kind:
          'inheritedFromBasePower',
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind:
          'inheritedFromBasePower',
      },
    )

    assert.deepEqual(
      value.modifiers,
      [
        {
          kind: 'difficulty',
          value: 3,
          contextKey:
            'recordedIdentification',
        },
        {
          kind: 'dicePool',
          value: 3,
          contextKey:
            'automatedSurveillanceEvasion',
        },
      ],
    )
  },
)

test(
  '025-A1-M2 Máscara de las Mil Caras cuesta un Control sin prueba propia',
  () => {
    const value =
      mechanics(
        'obfuscate-mask-of-a-thousand-faces',
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
  },
)

test(
  '025-A1-M2 Desvanecerse hereda coste y duración y modela la contienda',
  () => {
    const value =
      mechanics(
        'obfuscate-vanish',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind:
          'inheritedFromBasePower',
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind:
          'inheritedFromBasePower',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'vanish-before-mortal-observer',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'discipline',
              key: 'obfuscate',
            },
          ],
          resolution: {
            kind: 'opposed',
            opposingPool: [
              {
                kind: 'attribute',
                key: 'wits',
              },
              {
                kind: 'skill',
                key: 'awareness',
              },
            ],
          },
        },
      ],
    )

    assert.deepEqual(
      value.limits,
      [
        {
          kind: 'perScene',
          count: 1,
        },
      ],
    )
  },
)

test(
  '025-A1-M2 Ocultar modela dificultad 2-6 duración por margen y detección con Auspex',
  () => {
    const value =
      mechanics(
        'obfuscate-conceal',
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
        kind: 'nightsByMargin',
        baseNights: 1,
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'conceal-object',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'discipline',
              key: 'obfuscate',
            },
          ],
          resolution: {
            kind:
              'contextualDifficulty',
            min: 2,
            max: 6,
          },
        },
        {
          key:
            'see-concealed-object',
          role: 'detection',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'opposed',
            opposingPool: [
              {
                kind: 'attribute',
                key: 'intelligence',
              },
              {
                kind: 'discipline',
                key: 'obfuscate',
              },
            ],
          },
        },
      ],
    )
  },
)

test(
  '025-A1-M2 Disfraz del Impostor modela prueba oculta dificultad 4 y prueba condicional de Interpretación',
  () => {
    const value =
      mechanics(
        'obfuscate-impostors-guise',
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
          key: 'copy-appearance',
          role: 'activation',
          visibility: 'hidden',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'discipline',
              key: 'obfuscate',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 4,
          },
        },
        {
          key:
            'imitate-voice-and-mannerisms',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'manipulation',
            },
            {
              kind: 'skill',
              key: 'performance',
            },
          ],
          resolution: {
            kind:
              'contextualDifficulty',
          },
        },
      ],
    )
  },
)

test(
  '025-A1-M2 Encubrimiento añade un Control al Poder extendido y escala por Astucia',
  () => {
    const value =
      mechanics(
        'obfuscate-cloak-the-gathering',
      )

    assert.deepEqual(
      value.activation,
      {
        kind: 'extension',
      },
    )

    assert.deepEqual(
      value.rouseCost,
      {
        kind:
          'additionalToBasePower',
        checks: 1,
        scaling: {
          kind:
            'perAdditionalTargetBeyondAttribute',
          attributeKey: 'wits',
          checksPerTarget: 1,
        },
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind:
          'inheritedFromBasePower',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )
  },
)

test(
  '025-A1-M2 la Web recibe las mecánicas desde el catálogo compartido sin duplicarlas',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )

    const shared =
      characterDisciplineCatalog.powers
        .filter(
          ({ disciplineKey }) =>
            disciplineKey ===
              'obfuscate',
        )

    assert.equal(
      shared.every(
        power =>
          power.mechanics !== undefined,
      ),
      true,
    )
  },
)

test(
  '025-A1-M2 ningún Poder ajeno a Ofuscación recibe mechanics en este bloque',
  () => {
    const foreign =
      characterDisciplineCatalog.powers
        .filter(
          ({ disciplineKey }) =>
            disciplineKey !==
              'obfuscate',
        )

    assert.equal(
      foreign.some(
        power =>
          power.mechanics !== undefined,
      ),
      false,
    )
  },
)

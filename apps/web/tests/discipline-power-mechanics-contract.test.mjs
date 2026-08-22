import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'

const basePower = {
  key: 'obfuscate-contract-test',
  disciplineKey: 'obfuscate',
  name: 'Contrato de prueba',
  level: 4,
  active: true,
}

const attribute = (key) => ({
  kind: 'attribute',
  key,
})

const skill = (key) => ({
  kind: 'skill',
  key,
})

const discipline = (key) => ({
  kind: 'discipline',
  key,
})

test(
  '025-A1-M1 admite coste fijo, dificultad contextual y duración por margen',
  () => {
    const power = {
      ...basePower,
      mechanics: {
        systemSummary:
          'Resumen mecánico breve.',
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'nightsByMargin',
          baseNights: 1,
        },
        checks: [
          {
            key: 'activation',
            role: 'activation',
            pool: [
              attribute('intelligence'),
              discipline('obfuscate'),
            ],
            resolution: {
              kind: 'contextualDifficulty',
              min: 2,
              max: 6,
            },
          },
        ],
      },
    }

    assert.deepEqual(
      validateDisciplinePowerCatalog(
        [power],
      ),
      {
        valid: true,
        violations: [],
      },
    )
  },
)

test(
  '025-A1-M1 representa una contienda sin convertirla en texto libre',
  () => {
    const power = {
      ...basePower,
      mechanics: {
        activation: {
          kind: 'enhancement',
        },
        rouseCost: {
          kind: 'inheritedFromBasePower',
        },
        duration: {
          kind: 'inheritedFromBasePower',
        },
        checks: [
          {
            key: 'vanish-before-observer',
            role: 'conditional',
            pool: [
              attribute('wits'),
              discipline('obfuscate'),
            ],
            resolution: {
              kind: 'opposed',
              opposingPool: [
                attribute('wits'),
                skill('awareness'),
              ],
            },
          },
        ],
      },
    }

    assert.equal(
      validateDisciplinePowerCatalog(
        [power],
      ).valid,
      true,
    )
  },
)

test(
  '025-A1-M1 admite prueba oculta y varias pruebas estructuradas',
  () => {
    const power = {
      ...basePower,
      level: 5,
      mechanics: {
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'scene',
        },
        checks: [
          {
            key: 'initial-copy',
            role: 'activation',
            visibility: 'hidden',
            pool: [
              attribute('wits'),
              discipline('obfuscate'),
            ],
            resolution: {
              kind: 'fixedDifficulty',
              value: 4,
            },
          },
          {
            key: 'conditional-performance',
            role: 'conditional',
            pool: [
              attribute('manipulation'),
              skill('performance'),
            ],
            resolution: {
              kind: 'contextualDifficulty',
            },
          },
        ],
      },
    }

    assert.equal(
      validateDisciplinePowerCatalog(
        [power],
      ).valid,
      true,
    )
  },
)

test(
  '025-A1-M1 representa coste adicional escalable sobre otro Poder',
  () => {
    const power = {
      ...basePower,
      level: 5,
      mechanics: {
        activation: {
          kind: 'extension',
        },
        rouseCost: {
          kind: 'additionalToBasePower',
          checks: 1,
          scaling: {
            kind:
              'perAdditionalTargetBeyondAttribute',
            attributeKey: 'wits',
            checksPerTarget: 1,
          },
        },
        duration: {
          kind: 'inheritedFromBasePower',
        },
      },
    }

    assert.equal(
      validateDisciplinePowerCatalog(
        [power],
      ).valid,
      true,
    )
  },
)

test(
  '025-A1-M1 mantiene compatibilidad con diceCheck simple',
  () => {
    const legacyPower = {
      ...basePower,
      diceCheck: {
        pool: [
          attribute('resolve'),
          discipline('obfuscate'),
        ],
      },
    }

    assert.equal(
      validateDisciplinePowerCatalog(
        [legacyPower],
      ).valid,
      true,
    )
  },
)

test(
  '025-A1-M1 impide duplicar contrato simple y mecánico en el mismo Poder',
  () => {
    const power = {
      ...basePower,
      diceCheck: {
        pool: [
          attribute('resolve'),
        ],
      },
      mechanics: {
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'none',
        },
        duration: {
          kind: 'scene',
        },
        checks: [
          {
            key: 'activation',
            role: 'activation',
            pool: [
              attribute('resolve'),
            ],
            resolution: {
              kind: 'fixedDifficulty',
              value: 2,
            },
          },
        ],
      },
    }

    assert.deepEqual(
      validateDisciplinePowerCatalog(
        [power],
      ).violations,
      [
        'POWER_DICE_CONTRACT_CONFLICT',
      ],
    )
  },
)

test(
  '025-A1-M1 rechaza costes, dificultades y duraciones inválidas',
  () => {
    const power = {
      ...basePower,
      mechanics: {
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'fixed',
          checks: 0,
        },
        duration: {
          kind: 'nightsByMargin',
          baseNights: 0,
        },
        checks: [
          {
            key: 'bad',
            role: 'activation',
            pool: [
              attribute('wits'),
            ],
            resolution: {
              kind: 'contextualDifficulty',
              min: 6,
              max: 2,
            },
          },
        ],
      },
    }

    assert.deepEqual(
      validateDisciplinePowerCatalog(
        [power],
      ).violations,
      [
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
        'POWER_MECHANICS_DURATION_INVALID',
        'POWER_MECHANICS_DIFFICULTY_INVALID',
      ],
    )
  },
)

test(
  '025-A1-M1 representa modificadores y límite por escena de forma estructurada',
  () => {
    const power = {
      ...basePower,
      mechanics: {
        activation: {
          kind: 'enhancement',
        },
        rouseCost: {
          kind: 'inheritedFromBasePower',
        },
        duration: {
          kind: 'inheritedFromBasePower',
        },
        modifiers: [
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
        limits: [
          {
            kind: 'perScene',
            count: 1,
          },
        ],
      },
    }

    assert.equal(
      validateDisciplinePowerCatalog(
        [power],
      ).valid,
      true,
    )
  },
)

test(
  '025-A2-M1 admite las cuatro nuevas duraciones generales',
  () => {
    const durations = [
      {
        kind: 'passive',
      },
      {
        kind: 'feeding',
      },
      {
        kind: 'singleUse',
      },
      {
        kind: 'nightWithEndConditions',
        endConditions: [
          'nextFeeding',
          'hungerFive',
        ],
      },
    ]

    for (
      const [index, duration] of
      durations.entries()
    ) {
      const power = {
        ...basePower,
        key:
          `potence-duration-contract-${index}`,
        disciplineKey: 'potence',
        mechanics: {
          activation: {
            kind: 'standalone',
          },
          rouseCost: {
            kind: 'none',
          },
          duration,
        },
      }

      assert.deepEqual(
        validateDisciplinePowerCatalog(
          [power],
        ),
        {
          valid: true,
          violations: [],
        },
      )
    }
  },
)

test(
  '025-A2-M1 rechaza condiciones nocturnas vacías duplicadas o desconocidas',
  () => {
    const invalidConditions = [
      [],
      [
        'nextFeeding',
        'nextFeeding',
      ],
      [
        'nextFeeding',
        'sunrise',
      ],
    ]

    for (
      const [
        index,
        endConditions,
      ] of invalidConditions.entries()
    ) {
      const power = {
        ...basePower,
        key:
          `potence-invalid-night-${index}`,
        disciplineKey: 'potence',
        mechanics: {
          activation: {
            kind: 'standalone',
          },
          rouseCost: {
            kind: 'none',
          },
          duration: {
            kind:
              'nightWithEndConditions',
            endConditions,
          },
        },
      }

      assert.deepEqual(
        validateDisciplinePowerCatalog(
          [power],
        ).violations,
        [
          'POWER_MECHANICS_DURATION_INVALID',
        ],
      )
    }
  },
)

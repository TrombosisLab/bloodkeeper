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

test(
  '025-A3-M1 admite las duraciones necesarias para Presencia',
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

    for (
      const [index, duration] of
      durations.entries()
    ) {
      const power = {
        ...basePower,
        key:
          `presence-duration-contract-${index}`,
        disciplineKey: 'presence',
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
  '025-A3-M1 rechaza duraciones de Presencia estructuralmente inválidas',
  () => {
    const invalidDurations = [
      {
        kind: 'scene',
        endConditions: [
          'voluntaryEnd',
          'voluntaryEnd',
        ],
      },
      {
        kind: 'scene',
        endConditions: [
          'sunrise',
        ],
      },
      {
        kind: 'turns',
        count: 0,
      },
      {
        kind: 'turns',
        count: 1.5,
      },
      {
        kind: 'hoursByMargin',
        baseHours: 0,
      },
      {
        kind: 'hoursByMargin',
        baseHours: 1.5,
      },
    ]

    for (
      const [
        index,
        duration,
      ] of invalidDurations.entries()
    ) {
      const power = {
        ...basePower,
        key:
          `presence-invalid-duration-${index}`,
        disciplineKey: 'presence',
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
        ).violations,
        [
          'POWER_MECHANICS_DURATION_INVALID',
        ],
      )
    }
  },
)

test(
  '025-A9-M1E admite coste de Enardecimiento por rango',
  () => {
    const power = {
      key: 'protean-range-valid',
      disciplineKey: 'protean',
      name: 'Range valid',
      level: 5,
      active: true,
      sourceKey: 'core-v5-es',
      sourcePage: 271,
      description: 'test',
      mechanics: {
        systemSummary:
          'Coste variable entre uno y tres Controles.',
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
        },
        checks: [],
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
  '025-A9-M1E rechaza rangos de Enardecimiento inválidos',
  () => {
    const invalidRanges = [
      {
        minChecks: 0,
        maxChecks: 3,
      },
      {
        minChecks: 1,
        maxChecks: 0,
      },
      {
        minChecks: 3,
        maxChecks: 1,
      },
      {
        minChecks: -1,
        maxChecks: 3,
      },
    ]

    for (
      const [
        index,
        range,
      ] of invalidRanges.entries()
    ) {
      const power = {
        key:
          `protean-range-invalid-${index}`,
        disciplineKey:
          'protean',
        name: 'Range invalid',
        level: 5,
        active: true,
        sourceKey:
          'core-v5-es',
        sourcePage: 271,
        description: 'test',
        mechanics: {
          systemSummary:
            'Coste variable inválido.',
          activation: {
            kind: 'standalone',
          },
          rouseCost: {
            kind: 'range',
            ...range,
          },
          duration: {
            kind: 'scene',
          },
          checks: [],
        },
      }

      const result =
        validateDisciplinePowerCatalog(
          [power],
        )

      assert.equal(
        result.valid,
        false,
      )

      assert.ok(
        result.violations.includes(
          'POWER_MECHANICS_ROUSE_COUNT_INVALID',
        ),
      )
    }
  },
)

test(
  '025-A9-M1H admite coste de Enardecimiento y límite por hora en un check',
  () => {
    const result =
      validateDisciplinePowerCatalog(
        [
          {
            ...basePower,
            key:
              'test-check-cost-and-hour-limit',
            mechanics: {
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
                  key: 'conditional-action',
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
          },
        ],
      )

    assert.deepEqual(
      result,
      {
        valid: true,
        violations: [],
      },
    )
  },
)

test(
  '025-A9-M1H rechaza coste de Enardecimiento inválido dentro de un check',
  () => {
    const result =
      validateDisciplinePowerCatalog(
        [
          {
            ...basePower,
            key:
              'test-invalid-check-cost',
            mechanics: {
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
                  key: 'conditional-action',
                  role: 'conditional',
                  pool: [
                    {
                      kind: 'attribute',
                      key: 'strength',
                    },
                  ],
                  resolution: {
                    kind: 'fixedDifficulty',
                    value: 5,
                  },
                  rouseCost: {
                    kind: 'fixed',
                    checks: 0,
                  },
                },
              ],
            },
          },
        ],
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.violations.includes(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      ),
      true,
    )
  },
)

test(
  '025-A9-M1H rechaza límite horario inválido dentro de un check',
  () => {
    const result =
      validateDisciplinePowerCatalog(
        [
          {
            ...basePower,
            key:
              'test-invalid-check-hour-limit',
            mechanics: {
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
                  key: 'conditional-action',
                  role: 'conditional',
                  pool: [
                    {
                      kind: 'attribute',
                      key: 'strength',
                    },
                  ],
                  resolution: {
                    kind: 'fixedDifficulty',
                    value: 5,
                  },
                  limits: [
                    {
                      kind: 'perHour',
                      count: 0,
                    },
                  ],
                },
              ],
            },
          },
        ],
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.violations.includes(
        'POWER_MECHANICS_LIMIT_INVALID',
      ),
      true,
    )
  },
)

test(
  '025-A10-M1 admite coste mínimo abierto de Enardecimiento',
  () => {
    const catalog = [
      {
        key: 'blood-sorcery-at-least-valid',
        disciplineKey: 'bloodSorcery',
        name: 'At least valid',
        level: 1,
        sourceKey: 'core-v5-es',
        sourcePage: 273,
        description: 'test',
        active: true,
        mechanics: {
          systemSummary:
            'Coste de uno o más Controles.',
          activation: {
            kind: 'standalone',
          },
          rouseCost: {
            kind: 'atLeast',
            minChecks: 1,
          },
          duration: {
            kind: 'singleUse',
          },
          checks: [],
        },
      },
    ]

    const result =
      validateDisciplinePowerCatalog(
        catalog,
      )

    assert.deepEqual(
      result,
      {
        valid: true,
        violations: [],
      },
    )
  },
)

test(
  '025-A10-M1 rechaza mínimos abiertos de Enardecimiento inválidos',
  () => {
    const invalidMinimums = [
      0,
      -1,
      1.5,
    ]

    for (
      const [
        index,
        minChecks,
      ] of invalidMinimums.entries()
    ) {
      const catalog = [
        {
          key:
            `blood-sorcery-at-least-invalid-${index}`,
          disciplineKey:
            'bloodSorcery',
          name: 'At least invalid',
          level: 1,
          sourceKey:
            'core-v5-es',
          sourcePage: 273,
          description: 'test',
          active: true,
          mechanics: {
            systemSummary:
              'Coste mínimo abierto inválido.',
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
        },
      ]

      const result =
        validateDisciplinePowerCatalog(
          catalog,
        )

      assert.equal(
        result.valid,
        false,
      )

      assert.ok(
        result.violations.includes(
          'POWER_MECHANICS_ROUSE_COUNT_INVALID',
        ),
      )
    }
  },
)

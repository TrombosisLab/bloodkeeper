import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'

const replaceMechanics = mechanics =>
  disciplinePowerDefinitions.map(
    power =>
      power.key ===
      'auspex-premonition'
        ? {
            ...power,
            mechanics,
          }
        : power,
  )

const violationsOf = result =>
  Array.isArray(result)
    ? result
    : result.violations

const validateMechanics = mechanics =>
  violationsOf(
    validateDisciplinePowerCatalog(
      replaceMechanics(mechanics),
    ),
  )

const baseMechanics = {
  systemSummary:
    'Contrato sintético para validar A6-M1.',
  activation: {
    kind: 'standalone',
  },
  rouseCost: {
    kind: 'none',
  },
  duration: {
    kind: 'passive',
  },
}

test(
  '025-A6-M1 admite coste condicional entre uso pasivo y activo',
  () => {
    const violations =
      validateMechanics({
        ...baseMechanics,
        rouseCost: {
          kind: 'conditional',
          cases: [
            {
              when: 'passiveUse',
              cost: {
                kind: 'none',
              },
            },
            {
              when: 'activeUse',
              cost: {
                kind: 'fixed',
                checks: 1,
              },
            },
          ],
        },
      })

    assert.deepEqual(
      violations,
      [],
    )
  },
)

test(
  '025-A6-M1 rechaza coste condicional vacío duplicado desconocido o con cantidad inválida',
  () => {
    for (
      const rouseCost
      of [
        {
          kind: 'conditional',
          cases: [],
        },
        {
          kind: 'conditional',
          cases: [
            {
              when: 'activeUse',
              cost: {
                kind: 'fixed',
                checks: 1,
              },
            },
            {
              when: 'activeUse',
              cost: {
                kind: 'none',
              },
            },
          ],
        },
        {
          kind: 'conditional',
          cases: [
            {
              when: 'unknownUse',
              cost: {
                kind: 'none',
              },
            },
          ],
        },
        {
          kind: 'conditional',
          cases: [
            {
              when: 'activeUse',
              cost: {
                kind: 'fixed',
                checks: 0,
              },
            },
          ],
        },
      ]
    ) {
      assert.ok(
        validateMechanics({
          ...baseMechanics,
          rouseCost,
        }).includes(
          'POWER_MECHANICS_ROUSE_COUNT_INVALID',
        ),
      )
    }
  },
)

test(
  '025-A6-M1 admite duraciones hasta desactivar hasta terminar y minutos',
  () => {
    for (
      const duration
      of [
        {
          kind: 'untilDeactivated',
        },
        {
          kind: 'untilEnded',
        },
        {
          kind: 'minutes',
        },
        {
          kind: 'minutes',
          count: 1,
        },
        {
          kind: 'minutes',
          count: 3,
        },
      ]
    ) {
      assert.deepEqual(
        validateMechanics({
          ...baseMechanics,
          duration,
        }),
        [],
      )
    }
  },
)

test(
  '025-A6-M1 rechaza una duración en minutos no positiva',
  () => {
    for (
      const count
      of [0, -1, 1.5]
    ) {
      assert.ok(
        validateMechanics({
          ...baseMechanics,
          duration: {
            kind: 'minutes',
            count,
          },
        }).includes(
          'POWER_MECHANICS_DURATION_INVALID',
        ),
      )
    }
  },
)

test(
  '025-A6-M1 admite duración condicional por modo de Clarividencia',
  () => {
    assert.deepEqual(
      validateMechanics({
        ...baseMechanics,
        duration: {
          kind: 'conditional',
          cases: [
            {
              when:
                'informationGathering',
              duration: {
                kind: 'minutes',
              },
            },
            {
              when: 'surveillance',
              duration: {
                kind: 'night',
              },
            },
          ],
        },
      }),
      [],
    )
  },
)

test(
  '025-A6-M1 admite duración condicional por consentimiento de Telepatía',
  () => {
    assert.deepEqual(
      validateMechanics({
        ...baseMechanics,
        duration: {
          kind: 'conditional',
          cases: [
            {
              when: 'targetIsWilling',
              duration: {
                kind: 'scene',
              },
            },
            {
              when:
                'targetIsUnwilling',
              duration: {
                kind: 'minutes',
                count: 1,
              },
            },
          ],
        },
      }),
      [],
    )
  },
)

test(
  '025-A6-M1 conserva condiciones previas de Animalismo',
  () => {
    assert.deepEqual(
      validateMechanics({
        ...baseMechanics,
        duration: {
          kind: 'conditional',
          cases: [
            {
              when: 'targetIsMortal',
              duration: {
                kind: 'scene',
              },
            },
            {
              when:
                'targetIsVampire',
              duration: {
                kind:
                  'turnsByMargin',
                baseTurns: 1,
              },
            },
          ],
        },
      }),
      [],
    )
  },
)

test(
  '025-A6-M1 rechaza nuevas condiciones duplicadas desconocidas o hijos inválidos',
  () => {
    const invalidDurations = [
      {
        kind: 'conditional',
        cases: [
          {
            when:
              'targetIsWilling',
            duration: {
              kind: 'scene',
            },
          },
          {
            when:
              'targetIsWilling',
            duration: {
              kind: 'night',
            },
          },
        ],
      },
      {
        kind: 'conditional',
        cases: [
          {
            when: 'unknownMode',
            duration: {
              kind: 'scene',
            },
          },
        ],
      },
      {
        kind: 'conditional',
        cases: [
          {
            when:
              'informationGathering',
            duration: {
              kind: 'minutes',
              count: 0,
            },
          },
        ],
      },
    ]

    for (
      const duration
      of invalidDurations
    ) {
      assert.ok(
        validateMechanics({
          ...baseMechanics,
          duration,
        }).includes(
          'POWER_MECHANICS_DURATION_INVALID',
        ),
      )
    }
  },
)

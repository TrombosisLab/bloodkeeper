import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import * as catalogRules from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'

function resolveCatalogValidator() {
  const direct =
    catalogRules.validateDisciplinePowerCatalog

  if (
    typeof direct ===
    'function'
  ) {
    return direct
  }

  for (
    const [name, candidate]
    of Object.entries(catalogRules)
  ) {
    if (
      typeof candidate !==
        'function' ||
      !name
        .toLowerCase()
        .includes('validate')
    ) {
      continue
    }

    try {
      const result =
        candidate(
          disciplinePowerDefinitions,
        )

      if (
        Array.isArray(result) &&
        result.length === 0
      ) {
        return candidate
      }
    } catch {
      // Otro validador con firma distinta.
    }
  }

  throw new Error(
    'No se encontró el validator canónico del catálogo de Poderes',
  )
}

const validateCatalog =
  resolveCatalogValidator()

function withMechanics(
  mechanics,
) {
  return disciplinePowerDefinitions.map(
    power =>
      power.key ===
      'animalism-sense-the-beast'
        ? {
            ...power,
            mechanics,
          }
        : power,
  )
}

function violationsFor(
  mechanics,
) {
  const result =
    validateCatalog(
      withMechanics(
        mechanics,
      ),
    )

  if (Array.isArray(result)) {
    return result
  }

  if (
    result &&
    Array.isArray(
      result.violations,
    )
  ) {
    return result.violations
  }

  throw new Error(
    'El validator devolvió una forma inesperada',
  )
}

const baseMechanics = {
  systemSummary:
    'Contrato focal de Animalismo.',
  activation: {
    kind: 'standalone',
  },
}

test(
  '025-A5-M1 admite coste por noche distinta y duración hasta evento',
  () => {
    assert.deepEqual(
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'perUnit',
          checks: 1,
          unit: 'distinctNight',
          requiredUnits: 3,
        },
        duration: {
          kind: 'untilEvent',
          event: 'targetDeath',
        },
      }),
      [],
    )
  },
)

test(
  '025-A5-M1 admite coste por tipo animal con exención de famulus',
  () => {
    assert.deepEqual(
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'perUnit',
          checks: 1,
          unit: 'animalType',
          exemptions: [
            'targetIsFamulus',
          ],
        },
        duration: {
          kind: 'scene',
        },
      }),
      [],
    )
  },
)

test(
  '025-A5-M1 admite coste fijo con exención de famulus',
  () => {
    assert.deepEqual(
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
          exemptions: [
            'targetIsFamulus',
          ],
        },
        duration: {
          kind: 'scene',
        },
      }),
      [],
    )
  },
)

test(
  '025-A5-M1 admite duración condicional por objetivo y margen',
  () => {
    assert.deepEqual(
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'conditional',
          cases: [
            {
              when:
                'targetIsMortal',
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
  '025-A5-M1 admite duración distinta para éxito y crítico',
  () => {
    assert.deepEqual(
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'outcomeBased',
          cases: [
            {
              outcome:
                'normalSuccess',
              duration: {
                kind: 'scene',
              },
            },
            {
              outcome:
                'criticalSuccess',
              duration: {
                kind: 'indefinite',
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
  '025-A5-M1 admite escena que termina al cumplirse la orden',
  () => {
    assert.deepEqual(
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 2,
        },
        duration: {
          kind: 'scene',
          endConditions: [
            'orderCompleted',
          ],
        },
      }),
      [],
    )
  },
)

test(
  '025-A5-M1 rechaza costes perUnit inválidos',
  () => {
    const zeroChecks =
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'perUnit',
          checks: 0,
          unit: 'distinctNight',
          requiredUnits: 3,
        },
        duration: {
          kind: 'scene',
        },
      })

    assert.ok(
      zeroChecks.includes(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      ),
    )

    const badRequiredUnits =
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'perUnit',
          checks: 1,
          unit: 'animalType',
          requiredUnits: 3,
        },
        duration: {
          kind: 'scene',
        },
      })

    assert.ok(
      badRequiredUnits.includes(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      ),
    )

    const duplicatedExemption =
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'perUnit',
          checks: 1,
          unit: 'animalType',
          exemptions: [
            'targetIsFamulus',
            'targetIsFamulus',
          ],
        },
        duration: {
          kind: 'scene',
        },
      })

    assert.ok(
      duplicatedExemption.includes(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      ),
    )
  },
)

test(
  '025-A5-M1 rechaza nuevas duraciones inválidas',
  () => {
    const badTurns =
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'turnsByMargin',
          baseTurns: 0,
        },
      })

    assert.ok(
      badTurns.includes(
        'POWER_MECHANICS_DURATION_INVALID',
      ),
    )

    const emptyConditional =
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'conditional',
          cases: [],
        },
      })

    assert.ok(
      emptyConditional.includes(
        'POWER_MECHANICS_DURATION_INVALID',
      ),
    )

    const duplicateOutcome =
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'outcomeBased',
          cases: [
            {
              outcome:
                'normalSuccess',
              duration: {
                kind: 'scene',
              },
            },
            {
              outcome:
                'normalSuccess',
              duration: {
                kind: 'indefinite',
              },
            },
          ],
        },
      })

    assert.ok(
      duplicateOutcome.includes(
        'POWER_MECHANICS_DURATION_INVALID',
      ),
    )

    const unknownEvent =
      violationsFor({
        ...baseMechanics,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'untilEvent',
          event:
            'unknown-event',
        },
      })

    assert.ok(
      unknownEvent.includes(
        'POWER_MECHANICS_DURATION_INVALID',
      ),
    )
  },
)

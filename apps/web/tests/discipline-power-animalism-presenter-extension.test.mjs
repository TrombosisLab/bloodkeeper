import assert from 'node:assert/strict'
import test from 'node:test'

import {
  presentDisciplinePowerMechanics,
} from '../src/features/character-sheet/domain/discipline-power-mechanics-presenter.ts'

const activation = {
  kind: 'standalone',
}

test(
  '025-A5-M1 presenta coste por noches distintas y por tipo animal',
  () => {
    const nights =
      presentDisciplinePowerMechanics({
        activation,
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
      })

    assert.equal(
      nights.cost,
      '1 Control de Enardecimiento en cada una de 3 noches distintas',
    )

    assert.equal(
      nights.duration,
      'Hasta la muerte del objetivo',
    )

    const animalType =
      presentDisciplinePowerMechanics({
        activation,
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
      })

    assert.equal(
      animalType.cost,
      '1 Control de Enardecimiento por tipo de animal; sin coste sobre el famulus',
    )
  },
)

test(
  '025-A5-M1 presenta coste fijo con exención de famulus',
  () => {
    const view =
      presentDisciplinePowerMechanics({
        activation,
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
      })

    assert.equal(
      view.cost,
      '1 Control de Enardecimiento; sin coste sobre el famulus',
    )
  },
)

test(
  '025-A5-M1 presenta duración condicional por objetivo',
  () => {
    const view =
      presentDisciplinePowerMechanics({
        activation,
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
      })

    assert.equal(
      view.duration,
      'Mortal: Una escena; Vampiro: 1 turno base; aumenta según el margen',
    )
  },
)

test(
  '025-A5-M1 presenta duración por resultado',
  () => {
    const view =
      presentDisciplinePowerMechanics({
        activation,
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
      })

    assert.equal(
      view.duration,
      'Éxito: Una escena; Crítico: Indefinida',
    )
  },
)

test(
  '025-A5-M1 presenta fin por orden y fin de Frenesí sin keys internas',
  () => {
    const order =
      presentDisciplinePowerMechanics({
        activation,
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
      })

    assert.equal(
      order.duration,
      'Una escena; termina al cumplirse la orden',
    )

    const frenzy =
      presentDisciplinePowerMechanics({
        activation,
        rouseCost: {
          kind: 'fixed',
          checks: 1,
        },
        duration: {
          kind: 'untilEvent',
          event: 'frenzyEnds',
        },
      })

    assert.equal(
      frenzy.duration,
      'Mientras dure el Frenesí',
    )

    const serialized =
      JSON.stringify({
        order,
        frenzy,
      })

    for (const forbidden of [
      'orderCompleted',
      'frenzyEnds',
      'untilEvent',
      'outcomeBased',
      'targetIsFamulus',
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

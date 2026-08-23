import assert from 'node:assert/strict'
import test from 'node:test'

import {
  presentDisciplinePowerMechanics,
} from '../src/features/character-sheet/domain/discipline-power-mechanics-presenter.ts'

const present = ({
  rouseCost = {
    kind: 'none',
  },
  duration = {
    kind: 'passive',
  },
} = {}) =>
  presentDisciplinePowerMechanics({
    systemSummary:
      'Contrato sintético A6-M1.',
    activation: {
      kind: 'standalone',
    },
    rouseCost,
    duration,
  })

test(
  '025-A6-M1 presenta el coste pasivo y activo de Premonición',
  () => {
    const result =
      present({
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

    assert.equal(
      result.cost,
      'Uso pasivo: Sin Control de Enardecimiento; Uso activo: 1 Control de Enardecimiento',
    )
  },
)

test(
  '025-A6-M1 presenta las duraciones hasta desactivar y hasta terminar',
  () => {
    assert.equal(
      present({
        duration: {
          kind: 'untilDeactivated',
        },
      }).duration,
      'Hasta desactivarlo',
    )

    assert.equal(
      present({
        duration: {
          kind: 'untilEnded',
        },
      }).duration,
      'Hasta que termine',
    )
  },
)

test(
  '025-A6-M1 presenta minutos aproximados con y sin cantidad',
  () => {
    assert.equal(
      present({
        duration: {
          kind: 'minutes',
        },
      }).duration,
      'Unos minutos',
    )

    assert.equal(
      present({
        duration: {
          kind: 'minutes',
          count: 1,
        },
      }).duration,
      'Aproximadamente 1 minuto',
    )

    assert.equal(
      present({
        duration: {
          kind: 'minutes',
          count: 3,
        },
      }).duration,
      'Aproximadamente 3 minutos',
    )
  },
)

test(
  '025-A6-M1 presenta los dos modos de Clarividencia',
  () => {
    const result =
      present({
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
      })

    assert.equal(
      result.duration,
      'Recopilar información: Unos minutos; Vigilancia: Una noche',
    )
  },
)

test(
  '025-A6-M1 presenta Telepatía según consentimiento',
  () => {
    const result =
      present({
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
      })

    assert.equal(
      result.duration,
      'Objetivo voluntario: Una escena; Objetivo no voluntario: Aproximadamente 1 minuto',
    )
  },
)

test(
  '025-A6-M1 conserva la presentación condicional previa de Animalismo',
  () => {
    const result =
      present({
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
      })

    assert.equal(
      result.duration,
      'Mortal: Una escena; Vampiro: 1 turno base; aumenta según el margen',
    )
  },
)

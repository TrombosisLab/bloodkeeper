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
      disciplineKey === 'potence',
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
  '025-A2-M2 Potencia tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
  () => {
    assert.equal(
      powers.length,
      9,
    )

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
  '025-A2-M2 el catálogo completo satisface el validator con Ofuscación y Potencia',
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
  '025-A2-M2 Cuerpo Letal no cuesta Control y es pasivo',
  () => {
    assert.deepEqual(
      mechanics(
        'potence-lethal-body',
      ),
      {
        systemSummary:
          'Permite que los ataques sin armas causen daño agravado a mortales y reduce la protección de armadura según el nivel de Potencia.',
        activation: {
          kind: 'standalone',
        },
        rouseCost: {
          kind: 'none',
        },
        duration: {
          kind: 'passive',
        },
      },
    )
  },
)

test(
  '025-A2-M2 Salto Vertiginoso no cuesta Control y es pasivo',
  () => {
    const value =
      mechanics(
        'potence-soaring-leap',
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

    assert.equal(
      value.checks,
      undefined,
    )
  },
)

test(
  '025-A2-M2 Bravura cuesta un Control y dura una escena',
  () => {
    const value =
      mechanics(
        'potence-prowess',
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
  '025-A2-M2 Agarre Asombroso estructura la detección de rastros a dificultad 2',
  () => {
    const value =
      mechanics(
        'potence-uncanny-grip',
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
          key:
            'detect-uncanny-grip-traces',
          role: 'detection',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'skill',
              key: 'investigation',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 2,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /vidrio.*obvias/i,
    )
  },
)

test(
  '025-A2-M2 Alimentación Brutal no cuesta Control y dura una alimentación',
  () => {
    const value =
      mechanics(
        'potence-brutal-feed',
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
        kind: 'feeding',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /mordisco de Pelea con éxito/,
    )
  },
)

test(
  '025-A2-M2 Chispa de Ira conserva Amalgama y modela la contienda vampírica',
  () => {
    const power =
      byKey[
        'potence-spark-of-rage'
      ]

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey: 'presence',
          minimumLevel: 3,
        },
      },
    )

    const value =
      mechanics(
        'potence-spark-of-rage',
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
          key:
            'incite-vampire-rage',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'manipulation',
            },
            {
              kind: 'discipline',
              key: 'potence',
            },
          ],
          resolution: {
            kind: 'opposed',
            opposingPool: [
              {
                kind: 'attribute',
                key: 'composure',
              },
              {
                kind: 'attribute',
                key: 'intelligence',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /Frenesí de furia.*dificultad 3/,
    )
  },
)

test(
  '025-A2-M2 Sorbo de Poderío cuesta un Control y termina por alimentación o Ansia 5',
  () => {
    const value =
      mechanics(
        'potence-draught-of-might',
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
        kind:
          'nightWithEndConditions',
        endConditions: [
          'nextFeeding',
          'hungerFive',
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
  '025-A2-M2 Puño de Caín cuesta un Control y dura una escena sin prueba propia',
  () => {
    const value =
      mechanics(
        'potence-fist-of-caine',
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
  '025-A2-M2 Temblor de Tierra cuesta dos Controles modela resistencia y limita un uso por escena',
  () => {
    const value =
      mechanics(
        'potence-earthshock',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 2,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'singleUse',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'resist-earthshock',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'dexterity',
            },
            {
              kind: 'skill',
              key: 'athletics',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 3,
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
  '025-A2-M2 Potencia conserva sus mechanics al ampliar otras Disciplinas',
  async () => {
    const {
      disciplinePowerDefinitions,
    } = await import(
      '../src/features/character-creation/data/discipline-power-definitions.ts'
    )

    const potence =
      disciplinePowerDefinitions.filter(
        power =>
          power.disciplineKey ===
          'potence',
      )

    assert.equal(
      potence.length,
      9,
    )

    assert.ok(
      potence.every(
        power =>
          power.mechanics &&
          !power.diceCheck,
      ),
    )
  },
)

test(
  '025-A2-M2 la Web recibe Potencia desde el catálogo compartido sin duplicación',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )

    const sharedPotence =
      characterDisciplineCatalog.powers
        .filter(
          ({ disciplineKey }) =>
            disciplineKey ===
              'potence',
        )

    assert.equal(
      sharedPotence.length,
      9,
    )

    assert.equal(
      sharedPotence.every(
        power =>
          power.mechanics !== undefined,
      ),
      true,
    )
  },
)

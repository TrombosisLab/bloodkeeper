import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'

const presence =
  disciplinePowerDefinitions.filter(
    power =>
      power.disciplineKey ===
      'presence',
  )

const byKey =
  Object.fromEntries(
    presence.map(
      power => [
        power.key,
        power,
      ],
    ),
  )

test(
  '025-A3-M2 Presencia tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
  () => {
    assert.equal(
      presence.length,
      9,
    )

    assert.ok(
      presence.every(
        power =>
          power.mechanics &&
          !power.diceCheck,
      ),
    )
  },
)

test(
  '025-A3-M2 el catálogo completo satisface el validator con Presencia',
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
  '025-A3-M2 Atemorizar no cuesta Control y permite finalizar voluntariamente',
  () => {
    const mechanics =
      byKey[
        'presence-daunt'
      ].mechanics

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind: 'none',
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind: 'scene',
        endConditions: [
          'voluntaryEnd',
        ],
      },
    )

    assert.deepEqual(
      mechanics.checks,
      [
        {
          key:
            'act-against-daunt',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'attribute',
              key: 'composure',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 2,
          },
        },
      ],
    )
  },
)

test(
  '025-A3-M2 Fascinación modela la resistencia consciente y el fin voluntario',
  () => {
    const mechanics =
      byKey[
        'presence-awe'
      ].mechanics

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind: 'none',
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind: 'scene',
        endConditions: [
          'voluntaryEnd',
        ],
      },
    )

    assert.deepEqual(
      mechanics.checks,
      [
        {
          key: 'resist-awe',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'manipulation',
            },
            {
              kind: 'discipline',
              key: 'presence',
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
  },
)

test(
  '025-A3-M2 Beso Persistente no cuesta Control y dura hasta ser resistido',
  () => {
    const mechanics =
      byKey[
        'presence-lingering-kiss'
      ].mechanics

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind: 'none',
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind: 'untilResisted',
      },
    )

    assert.equal(
      mechanics.checks,
      undefined,
    )
  },
)

test(
  '025-A3-M2 Encantamiento cuesta un Control y dura horas según margen',
  () => {
    const mechanics =
      byKey[
        'presence-entrancement'
      ].mechanics

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind: 'hoursByMargin',
        baseHours: 1,
      },
    )

    assert.deepEqual(
      mechanics.checks,
      [
        {
          key:
            'entrance-target',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'discipline',
              key: 'presence',
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
                key: 'wits',
              },
            ],
          },
        },
      ],
    )
  },
)

test(
  '025-A3-M2 Mirada Aterradora cuesta un Control y dura un turno',
  () => {
    const mechanics =
      byKey[
        'presence-dread-gaze'
      ].mechanics

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind: 'turns',
        count: 1,
      },
    )

    assert.deepEqual(
      mechanics.checks[0]
        .resolution,
      {
        kind: 'opposed',
        opposingPool: [
          {
            kind: 'attribute',
            key: 'composure',
          },
          {
            kind: 'attribute',
            key: 'resolve',
          },
        ],
      },
    )
  },
)

test(
  '025-A3-M2 Invocación cuesta un Control y dura una noche',
  () => {
    const mechanics =
      byKey[
        'presence-summon'
      ].mechanics

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind: 'night',
      },
    )

    assert.deepEqual(
      mechanics.checks[0].pool,
      [
        {
          kind: 'attribute',
          key: 'manipulation',
        },
        {
          kind: 'discipline',
          key: 'presence',
        },
      ],
    )
  },
)

test(
  '025-A3-M2 Voz Irresistible conserva Amalgama y hereda el coste del Poder base',
  () => {
    const power =
      byKey[
        'presence-irresistible-voice'
      ]

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey:
            'dominate',
          minimumLevel: 1,
        },
      },
    )

    assert.deepEqual(
      power.mechanics.activation,
      {
        kind: 'enhancement',
      },
    )

    assert.deepEqual(
      power.mechanics.rouseCost,
      {
        kind:
          'inheritedFromBasePower',
      },
    )

    assert.deepEqual(
      power.mechanics.duration,
      {
        kind: 'passive',
      },
    )
  },
)

test(
  '025-A3-M2 Magnetismo de Estrella añade un Control y hereda duración',
  () => {
    const mechanics =
      byKey[
        'presence-star-magnetism'
      ].mechanics

    assert.deepEqual(
      mechanics.activation,
      {
        kind: 'extension',
      },
    )

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind:
          'additionalToBasePower',
        checks: 1,
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind:
          'inheritedFromBasePower',
      },
    )
  },
)

test(
  '025-A3-M2 Majestad cuesta dos Controles y modela la oposición para actuar',
  () => {
    const mechanics =
      byKey[
        'presence-majesty'
      ].mechanics

    assert.deepEqual(
      mechanics.rouseCost,
      {
        kind: 'fixed',
        checks: 2,
      },
    )

    assert.deepEqual(
      mechanics.duration,
      {
        kind: 'scene',
      },
    )

    assert.deepEqual(
      mechanics.checks,
      [
        {
          key:
            'act-against-majesty',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'composure',
            },
            {
              kind: 'attribute',
              key: 'resolve',
            },
          ],
          resolution: {
            kind: 'opposed',
            opposingPool: [
              {
                kind: 'attribute',
                key: 'charisma',
              },
              {
                kind: 'discipline',
                key: 'presence',
              },
            ],
          },
        },
      ],
    )
  },
)

test(
  '025-A3-M2 los tests históricos de Ofuscación y Potencia no bloquean futuras Disciplinas',
  async () => {
    const fs =
      await import(
        'node:fs/promises'
      )

    const obfuscateTest =
      await fs.readFile(
        new URL(
          './obfuscate-mechanics.test.mjs',
          import.meta.url,
        ),
        'utf-8',
      )

    const potenceTest =
      await fs.readFile(
        new URL(
          './potence-mechanics.test.mjs',
          import.meta.url,
        ),
        'utf-8',
      )

    assert.match(
      obfuscateTest,
      /Ofuscación conserva sus mechanics al ampliar otras Disciplinas/,
    )

    assert.doesNotMatch(
      obfuscateTest,
      /permanece aislada de Disciplinas aún no mecanizadas/,
    )

    assert.match(
      potenceTest,
      /Potencia conserva sus mechanics al ampliar otras Disciplinas/,
    )

    assert.doesNotMatch(
      potenceTest,
      /exactamente Ofuscación y Potencia tienen mechanics/,
    )
  },
)

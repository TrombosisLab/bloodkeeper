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
    power =>
      power.disciplineKey ===
      'dominate',
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
    `Poder no encontrado: ${key}`,
  )

  assert.ok(
    power.mechanics,
    `mechanics ausente: ${key}`,
  )

  return power.mechanics
}

test(
  '025-A7-M2 Dominación tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
  () => {
    assert.equal(
      powers.length,
      9,
    )

    assert.ok(
      powers.every(
        power =>
          power.mechanics !==
          undefined,
      ),
    )

    assert.ok(
      powers.every(
        power =>
          power.diceCheck ===
          undefined,
      ),
    )
  },
)

test(
  '025-A7-M2 el catálogo completo satisface el validator con Dominación',
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
  '025-A7-M2 Nublar la Memoria no cuesta Control y modela la resistencia',
  () => {
    const value =
      mechanics(
        'dominate-cloud-memory',
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
        kind: 'indefinite',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'resist-cloud-memory',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'discipline',
              key: 'dominate',
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
                kind: 'attribute',
                key: 'resolve',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /mortal no preparado.*Carisma.*Astucia.*Resolución/s,
    )
  },
)

test(
  '025-A7-M2 Compelir no cuesta Control y estructura la contienda condicional',
  () => {
    const value =
      mechanics(
        'dominate-compel',
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
        kind: 'scene',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'resist-compel',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'discipline',
              key: 'dominate',
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
                kind: 'attribute',
                key: 'resolve',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /un turno.*mortal no preparado/s,
    )
  },
)

test(
  '025-A7-M2 Dementación conserva Ofuscación 2 cuesta un Control y usa Manipulación más Dominación',
  () => {
    const power =
      byKey[
        'dominate-dementation'
      ]

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey:
            'obfuscate',
          minimumLevel: 2,
        },
      },
    )

    const value =
      power.mechanics

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
          key: 'dementation-attack',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'manipulation',
            },
            {
              kind: 'discipline',
              key: 'dominate',
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
      /un individuo por turno.*varias víctimas.*Control/s,
    )
  },
)

test(
  '025-A7-M2 Mesmerismo cuesta un Control y termina por orden cumplida o fin de escena',
  () => {
    const value =
      mechanics(
        'dominate-mesmerize',
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
          'orderCompleted',
        ],
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'resist-mesmerize',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'discipline',
              key: 'dominate',
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
                kind: 'attribute',
                key: 'resolve',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /Sistema usa Carisma/,
    )

    assert.match(
      value.systemSummary,
      /Reserva impresa/,
    )

    assert.match(
      value.systemSummary,
      /Manipulación/,
    )
  },
)

test(
  '025-A7-M2 Directriz Sumergida extiende Mesmerismo sin coste propio',
  () => {
    const value =
      mechanics(
        'dominate-submerged-directive',
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
          'inheritedFromBasePower',
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

    assert.match(
      value.systemSummary,
      /Mesmerismo.*una sugestión por víctima.*detonante/s,
    )
  },
)

test(
  '025-A7-M2 Mente Olvidadiza cuesta un Control y modela la contienda de recuerdos',
  () => {
    const value =
      mechanics(
        'dominate-the-forgetful-mind',
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
        kind: 'indefinite',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'rewrite-memory',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'manipulation',
            },
            {
              kind: 'discipline',
              key: 'dominate',
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
                kind: 'attribute',
                key: 'resolve',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /margen.*añadir.*eliminar.*recuerdo/s,
    )
  },
)

test(
  '025-A7-M2 Racionalizar hereda coste y permite Astucia más Consciencia a dificultad cinco',
  () => {
    const value =
      mechanics(
        'dominate-rationalize',
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
        kind: 'indefinite',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'question-rationalized-belief',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'skill',
              key: 'awareness',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 5,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /propia víctima.*Astucia.*Consciencia.*dificultad 5/s,
    )
  },
)

test(
  '025-A7-M2 Decreto Terminal hereda coste y deja la resistencia al Poder base',
  () => {
    const value =
      mechanics(
        'dominate-terminal-decree',
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
        kind: 'passive',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )

    assert.match(
      value.systemSummary,
      /Humanidad.*resistirse.*Poder de Dominación/s,
    )
  },
)

test(
  '025-A7-M2 Manipulación en Masa añade un Control y hereda duración',
  () => {
    const value =
      mechanics(
        'dominate-mass-manipulation',
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

    assert.match(
      value.systemSummary,
      /oponente más fuerte.*duración.*Poder amplificado/s,
    )
  },
)

test(
  '025-A7-M2 conserva completas las seis Disciplinas mecanizadas previas',
  () => {
    for (
      const disciplineKey
      of [
        'obfuscate',
        'potence',
        'presence',
        'celerity',
        'animalism',
        'auspex',
      ]
    ) {
      const previous =
        disciplinePowerDefinitions.filter(
          power =>
            power.disciplineKey ===
            disciplineKey,
        )

      assert.equal(
        previous.length,
        9,
      )

      assert.ok(
        previous.every(
          power =>
            power.mechanics !==
            undefined,
        ),
      )
    }
  },
)

test(
  '025-A7-M2 la Web recibe Dominación desde el catálogo compartido sin duplicación',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )

    const sharedDominate =
      characterDisciplineCatalog.powers
        .filter(
          power =>
            power.disciplineKey ===
            'dominate',
        )

    assert.equal(
      sharedDominate.length,
      9,
    )

    assert.ok(
      sharedDominate.every(
        power =>
          power.mechanics !==
          undefined,
      ),
    )
  },
)

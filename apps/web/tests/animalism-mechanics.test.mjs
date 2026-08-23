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
      'animalism',
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
  '025-A5-M2 Animalismo tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
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
  '025-A5-M2 el catálogo completo satisface el validator con Animalismo',
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
  '025-A5-M2 Sentir a la Bestia usa Resolución más Animalismo contra Compostura más Subterfugio',
  () => {
    const value =
      mechanics(
        'animalism-sense-the-beast',
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

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'sense-the-beast',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'animalism',
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
                kind: 'skill',
                key: 'subterfuge',
              },
            ],
          },
        },
      ],
    )
  },
)

test(
  '025-A5-M2 Vínculo con Famulus exige un Control en tres noches distintas y dura hasta su muerte',
  () => {
    const value =
      mechanics(
        'animalism-bond-famulus',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'perUnit',
        checks: 1,
        unit: 'distinctNight',
        requiredUnits: 3,
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'untilEvent',
        event: 'targetDeath',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'command-famulus',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'skill',
              key: 'animalKen',
            },
          ],
          resolution: {
            kind:
              'contextualDifficulty',
            min: 2,
          },
        },
      ],
    )
  },
)

test(
  '025-A5-M2 Susurros Salvajes cobra por tipo animal salvo famulus y separa persuadir de invocar',
  () => {
    const value =
      mechanics(
        'animalism-feral-whispers',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'perUnit',
        checks: 1,
        unit: 'animalType',
        exemptions: [
          'targetIsFamulus',
        ],
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
            'persuade-animal-service',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'manipulation',
            },
            {
              kind: 'discipline',
              key: 'animalism',
            },
          ],
          resolution: {
            kind:
              'contextualDifficulty',
          },
        },
        {
          key:
            'summon-animal-type',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'discipline',
              key: 'animalism',
            },
          ],
          resolution: {
            kind:
              'contextualDifficulty',
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /comunicación simple no exige prueba/i,
    )
  },
)

test(
  '025-A5-M2 Colmena No-Muerta conserva Ofuscación 2 y hereda el coste del Poder extendido',
  () => {
    const power =
      byKey[
        'animalism-unliving-hive'
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

    assert.deepEqual(
      power.mechanics.activation,
      {
        kind: 'extension',
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

    assert.match(
      power.mechanics.systemSummary,
      /Salud 5.*8 dados/s,
    )
  },
)

test(
  '025-A5-M2 Reprimir a la Bestia modela contienda y duración distinta para mortal y vampiro',
  () => {
    const value =
      mechanics(
        'animalism-quell-the-beast',
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
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'quell-the-beast',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'discipline',
              key: 'animalism',
            },
          ],
          resolution: {
            kind: 'opposed',
            opposingPool: [
              {
                kind: 'attribute',
                key: 'stamina',
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
  },
)

test(
  '025-A5-M2 Suculencia Animal es pasiva y conserva los subefectos del famulus en resumen',
  () => {
    const value =
      mechanics(
        'animalism-animal-succulence',
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
        kind: 'none',
      },
    )

    assert.deepEqual(
      value.duration,
      {
        kind: 'passive',
      },
    )

    assert.match(
      value.systemSummary,
      /sacia 4 Ansias.*\+2.*siguiente alimentación.*Ansia 5/s,
    )
  },
)

test(
  '025-A5-M2 Comunión de Espíritus no cuesta sobre famulus y dura escena o indefinidamente según resultado',
  () => {
    const value =
      mechanics(
        'animalism-subsume-the-spirit',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
        exemptions: [
          'targetIsFamulus',
        ],
      },
    )

    assert.deepEqual(
      value.duration,
      {
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
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'subsume-the-spirit',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'manipulation',
            },
            {
              kind: 'discipline',
              key: 'animalism',
            },
          ],
          resolution: {
            kind:
              'fixedDifficulty',
            value: 4,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /muerte del animal.*1 daño agravado.*Fuerza de Voluntad/s,
    )
  },
)

test(
  '025-A5-M2 Control Animal cuesta dos Controles y termina al cumplirse la orden',
  () => {
    const value =
      mechanics(
        'animalism-animal-dominion',
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
          key:
            'command-animal-group',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'charisma',
            },
            {
              kind: 'discipline',
              key: 'animalism',
            },
          ],
          resolution: {
            kind:
              'contextualDifficulty',
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /No invoca animales/i,
    )
  },
)

test(
  '025-A5-M2 Expulsar a la Bestia conserva key estable y modela la transferencia del Frenesí',
  () => {
    const power =
      byKey[
        'animalism-drawing-out-the-beast'
      ]

    assert.equal(
      power.name,
      'Expulsar a la Bestia',
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
        kind: 'untilEvent',
        event: 'frenzyEnds',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key:
            'draw-out-the-beast',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'discipline',
              key: 'animalism',
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
                key: 'resolve',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /No puede transferir un Frenesí de hambre/i,
    )
  },
)

test(
  '025-A5-M2 conserva completas las cuatro Disciplinas mecanizadas previas',
  () => {
    for (
      const disciplineKey
      of [
        'obfuscate',
        'potence',
        'presence',
        'celerity',
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
  '025-A5-M2 la Web recibe Animalismo desde el catálogo compartido sin duplicación',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )

    const sharedAnimalism =
      characterDisciplineCatalog.powers
        .filter(
          power =>
            power.disciplineKey ===
            'animalism',
        )

    assert.equal(
      sharedAnimalism.length,
      9,
    )

    assert.ok(
      sharedAnimalism.every(
        power =>
          power.mechanics !==
          undefined,
      ),
    )
  },
)

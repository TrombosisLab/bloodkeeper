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
      'auspex',
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
  '025-A6-M2 Auspex tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
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
  '025-A6-M2 el catálogo completo satisface el validator con Auspex',
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
  '025-A6-M2 Sentidos Agudizados no cuesta Control y dura hasta desactivarlo',
  () => {
    const value =
      mechanics(
        'auspex-heightened-senses',
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
        kind: 'untilDeactivated',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'sensory-overload',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'attribute',
              key: 'resolve',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
            min: 3,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /Auspex.*percepción.*-3 dados/s,
    )
  },
)

test(
  '025-A6-M2 Sentir lo Invisible separa detección pasiva oculta de búsqueda activa',
  () => {
    const value =
      mechanics(
        'auspex-sense-the-unseen',
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
            'passive-supernatural-detection',
          role: 'detection',
          visibility: 'hidden',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
          },
        },
        {
          key:
            'active-supernatural-search',
          role: 'detection',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /contienda.*reserva sobrenatural relevante/s,
    )
  },
)

test(
  '025-A6-M2 Premonición diferencia coste pasivo de provocación activa',
  () => {
    const value =
      mechanics(
        'auspex-premonition',
      )

    assert.deepEqual(
      value.rouseCost,
      {
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
          key: 'provoke-premonition',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
          },
        },
      ],
    )
  },
)

test(
  '025-A6-M2 Compartir los Sentidos cuesta un Control y usa dificultad base tres contextual',
  () => {
    const value =
      mechanics(
        'auspex-share-the-senses',
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
          key: 'share-the-senses',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
            min: 3,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /noche siguiente/i,
    )
  },
)

test(
  '025-A6-M2 Escudriñar el Alma separa individuo opuesto de búsqueda en multitud',
  () => {
    const value =
      mechanics(
        'auspex-scry-the-soul',
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
        kind: 'turns',
        count: 1,
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'scry-individual',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'discipline',
              key: 'auspex',
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
        {
          key: 'scan-crowd',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /margen.*crítico/s,
    )
  },
)

test(
  '025-A6-M2 Toque del Espíritu usa Inteligencia más Auspex y dura un turno',
  () => {
    const value =
      mechanics(
        'auspex-spirits-touch',
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
        kind: 'turns',
        count: 1,
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'spirits-touch',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /margen.*poseedor adicional/s,
    )
  },
)

test(
  '025-A6-M2 Clarividencia diferencia recopilación de información y vigilancia',
  () => {
    const value =
      mechanics(
        'auspex-clairvoyance',
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
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'clairvoyance',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /Refugio.*dados.*margen/s,
    )
  },
)

test(
  '025-A6-M2 Posesión conserva Dominación tres cuesta dos Controles y dura hasta terminar',
  () => {
    const power =
      byKey[
        'auspex-possession'
      ]

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey:
            'dominate',
          minimumLevel: 3,
        },
      },
    )

    const value =
      power.mechanics

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
        kind: 'untilEnded',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'possess-mortal',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'opposed',
            opposingPool: [
              {
                kind: 'attribute',
                key: 'resolve',
              },
              {
                kind: 'attribute',
                key: 'intelligence',
              },
            ],
          },
        },
        {
          key:
            'maintain-possession-after-aggravated-damage',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'auspex',
            },
          ],
          resolution: {
            kind: 'contextualDifficulty',
            min: 2,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /Sólo puede poseer mortales.*3 niveles.*Fuerza de Voluntad/s,
    )
  },
)

test(
  '025-A6-M2 Telepatía distingue duración voluntaria y no voluntaria',
  () => {
    const value =
      mechanics(
        'auspex-telepathy',
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
              'targetIsWilling',
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
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'read-mind',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'auspex',
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
                kind: 'skill',
                key: 'subterfuge',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /sin tirada.*vampiro no voluntario.*Fuerza de Voluntad/s,
    )
  },
)

test(
  '025-A6-M2 conserva completas las cinco Disciplinas mecanizadas previas',
  () => {
    for (
      const disciplineKey
      of [
        'obfuscate',
        'potence',
        'presence',
        'celerity',
        'animalism',
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
  '025-A6-M2 la Web recibe Auspex desde el catálogo compartido sin duplicación',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )

    const sharedAuspex =
      characterDisciplineCatalog.powers
        .filter(
          power =>
            power.disciplineKey ===
            'auspex',
        )

    assert.equal(
      sharedAuspex.length,
      9,
    )

    assert.ok(
      sharedAuspex.every(
        power =>
          power.mechanics !==
          undefined,
      ),
    )
  },
)

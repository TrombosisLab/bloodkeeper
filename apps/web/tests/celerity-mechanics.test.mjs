import assert from 'node:assert/strict'
import test from 'node:test'

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
      'celerity',
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
  '025-A4-M2 Celeridad tiene mechanics en sus 9 Poderes y ningún diceCheck legacy',
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
  '025-A4-M2 el catálogo completo satisface el validator con Celeridad',
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
  '025-A4-M2 Gracia Felina no cuesta Control y es pasiva',
  () => {
    const value =
      mechanics(
        'celerity-cats-grace',
      )

    assert.deepEqual(
      value.activation,
      {
        kind: 'standalone',
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

    assert.equal(
      value.checks,
      undefined,
    )
  },
)

test(
  '025-A4-M2 Reflejos Rápidos no cuesta Control y es pasivo',
  () => {
    const value =
      mechanics(
        'celerity-rapid-reflexes',
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
  '025-A4-M2 Presteza cuesta un Control y dura una escena sin inventar bonus fijo',
  () => {
    const value =
      mechanics(
        'celerity-fleetness',
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
      value.modifiers,
      undefined,
    )

    assert.equal(
      value.checks,
      undefined,
    )
  },
)

test(
  '025-A4-M2 Pestañeo modela terreno peligroso como prueba contextual de Destreza y Atletismo',
  () => {
    const value =
      mechanics(
        'celerity-blink',
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
          key:
            'cross-hazardous-terrain',
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
            kind:
              'contextualDifficulty',
          },
        },
      ],
    )
  },
)

test(
  '025-A4-M2 Recorrido usa Destreza y Atletismo con dificultad contextual 3 a 6',
  () => {
    const value =
      mechanics(
        'celerity-traversal',
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
          key:
            'traverse-surface',
          role: 'activation',
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
            kind:
              'contextualDifficulty',
            min: 3,
            max: 6,
          },
        },
      ],
    )
  },
)

test(
  '025-A4-M2 Puntería Certera conserva Auspex 2 y no inventa la reserva del ataque base',
  () => {
    const power =
      byKey[
        'celerity-unerring-aim'
      ]

    assert.deepEqual(
      power.requirements,
      {
        amalgam: {
          disciplineKey:
            'auspex',
          minimumLevel: 2,
        },
      },
    )

    assert.deepEqual(
      power.mechanics.rouseCost,
      {
        kind: 'fixed',
        checks: 1,
      },
    )

    assert.deepEqual(
      power.mechanics.duration,
      {
        kind: 'singleUse',
      },
    )

    assert.equal(
      power.mechanics.checks,
      undefined,
    )
  },
)

test(
  '025-A4-M2 Sorbo de Elegancia cuesta un Control y termina por alimentación o Ansia 5',
  () => {
    const value =
      mechanics(
        'celerity-draught-of-elegance',
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
  '025-A4-M2 Golpe Relámpago cuesta un Control y no inventa una única reserva cuerpo a cuerpo',
  () => {
    const value =
      mechanics(
        'celerity-lightning-strike',
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
        kind: 'singleUse',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )
  },
)

test(
  '025-A4-M2 Segundo Quebrado cuesta un Control y deja la prueba a discreción del Narrador',
  () => {
    const value =
      mechanics(
        'celerity-split-second',
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
        kind: 'singleUse',
      },
    )

    assert.equal(
      value.checks,
      undefined,
    )
  },
)

test(
  '025-A4-M2 conserva sus mecánicas al ampliar futuras Disciplinas',
  () => {
    const expected =
      [
        'obfuscate',
        'potence',
        'presence',
        'celerity',
      ]

    for (
      const disciplineKey
      of expected
    ) {
      const disciplinePowers =
        disciplinePowerDefinitions.filter(
          power =>
            power.disciplineKey ===
            disciplineKey,
        )

      assert.equal(
        disciplinePowers.length,
        9,
      )

      assert.ok(
        disciplinePowers.every(
          power =>
            power.mechanics !==
            undefined,
        ),
      )
    }

    assert.ok(
      powers.every(
        power =>
          power.mechanics !==
          undefined,
      ),
    )
  },
)

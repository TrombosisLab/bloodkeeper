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
      'bloodSorcery',
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
  '025-A10-M2 Hechicería de Sangre tiene mechanics en sus 8 Poderes y ningún diceCheck legacy',
  () => {
    assert.equal(
      powers.length,
      8,
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
  '025-A10-M2 el catálogo completo satisface el validator con Hechicería de Sangre',
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
  '025-A10-M2 Sabor de la Sangre no cuesta Control y usa Resolución más Hechicería a dificultad 3',
  () => {
    const value =
      mechanics(
        'blood-sorcery-taste-for-blood',
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
        kind: 'singleUse',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'analyze-blood',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 3,
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /victoria.*Generación.*Diablerie/s,
    )
  },
)

test(
  '025-A10-M2 Vitae Corrosiva usa uno o más Controles sin inventar máximo',
  () => {
    const value =
      mechanics(
        'blood-sorcery-corrosive-vitae',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'atLeast',
        minChecks: 1,
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

    assert.match(
      value.systemSummary,
      /cada Control.*aproximadamente cinco minutos/s,
    )
  },
)

test(
  '025-A10-M2 Extinguir Vitae separa contienda principal y detección',
  () => {
    const value =
      mechanics(
        'blood-sorcery-extinguish-vitae',
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

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'extinguish-vitae',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
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
                key: 'composure',
              },
            ],
          },
        },
        {
          key: 'identify-afflicter',
          role: 'detection',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'skill',
              key: 'occult',
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
      /Ansia en 1.*crítica.*2/s,
    )
  },
)

test(
  '025-A10-M2 Sangre de Potencia conserva dificultad derivada y duración reglamentaria en resumen',
  () => {
    const value =
      mechanics(
        'blood-sorcery-blood-of-potency',
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
          key: 'concentrate-blood-potency',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
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
      /2 \+ la Potencia de Sangre actual/s,
    )

    assert.match(
      value.systemSummary,
      /una escena o una noche/s,
    )
  },
)

test(
  '025-A10-M2 Toque de Escorpión estructura coste abierto ataque y contienda del veneno',
  () => {
    const value =
      mechanics(
        'blood-sorcery-scorpions-touch',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'atLeast',
        minChecks: 1,
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
          key: 'spit-poison',
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
            kind: 'contextualDifficulty',
          },
        },
        {
          key: 'resolve-poison',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'strength',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
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
                kind: 'skill',
                key: 'occult',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /Fortaleza.*lugar de Ocultismo/s,
    )
  },
)

test(
  '025-A10-M2 Robo de Vitae usa Astucia más Hechicería contra Astucia más Ocultismo y dura la alimentación',
  () => {
    const value =
      mechanics(
        'blood-sorcery-theft-of-vitae',
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
        kind: 'feeding',
      },
    )

    assert.deepEqual(
      value.checks,
      [
        {
          key: 'steal-vitae',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'wits',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
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
                key: 'occult',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /doble de velocidad.*triple.*victoria crítica/s,
    )
  },
)

test(
  '025-A10-M2 Caldero de Sangre mantiene Máculas y Fortaleza informativas y dura un turno',
  () => {
    const value =
      mechanics(
        'blood-sorcery-cauldron-of-blood',
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
          key: 'establish-contact',
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
            kind: 'contextualDifficulty',
          },
        },
        {
          key: 'boil-blood',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'resolve',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
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
                key: 'occult',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /una o más Máculas.*Compostura \+ Fortaleza.*Ansia.*5/s,
    )
  },
)

test(
  '025-A10-M2 Caricia de Baal usa coste abierto y conserva la segunda contienda de Letargo',
  () => {
    const value =
      mechanics(
        'blood-sorcery-baals-caress',
      )

    assert.deepEqual(
      value.rouseCost,
      {
        kind: 'atLeast',
        minChecks: 1,
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
          key: 'spit-poison',
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
            kind: 'contextualDifficulty',
          },
        },
        {
          key: 'resolve-poison',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'strength',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
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
                kind: 'skill',
                key: 'occult',
              },
            ],
          },
        },
        {
          key: 'torpor-follow-up',
          role: 'conditional',
          pool: [
            {
              kind: 'attribute',
              key: 'strength',
            },
            {
              kind: 'discipline',
              key: 'bloodSorcery',
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
                kind: 'skill',
                key: 'occult',
              },
            ],
          },
        },
      ],
    )

    assert.match(
      value.systemSummary,
      /Fortaleza.*daño es agravado.*segunda contienda.*Letargo/s,
    )
  },
)


test(
  '025-A10-M2 la Web recibe el catálogo compartido sin duplicación',
  () => {
    assert.deepEqual(
      disciplinePowerDefinitions,
      characterDisciplineCatalog.powers,
    )
  },
)

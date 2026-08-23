import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'

import {
  presentDisciplinePowerMechanics,
} from '../src/features/character-sheet/domain/discipline-power-mechanics-presenter.ts'

const catalog = JSON.parse(
  readFileSync(
    new URL(
      '../../../packages/character-rules/catalogs/discipline-powers.json',
      import.meta.url,
    ),
    'utf8',
  ),
)

const ceremonies = JSON.parse(
  readFileSync(
    new URL(
      '../../../packages/character-rules/catalogs/oblivion-ceremonies.json',
      import.meta.url,
    ),
    'utf8',
  ),
)

const oblivion = catalog.filter(
  power =>
    power.disciplineKey === 'oblivion',
)

const byKey = new Map(
  oblivion.map(
    power => [power.key, power],
  ),
)

const mechanic = key =>
  byKey.get(key)?.mechanics

const rouseStainNote =
  'un resultado de 1 o 10 causa además una Mácula'

test(
  '025-A11-M2 completa 18/18 mechanics de Olvido y 106/106 globales',
  () => {
    assert.equal(
      oblivion.length,
      18,
    )

    assert.equal(
      oblivion.filter(
        power => power.mechanics,
      ).length,
      18,
    )

    assert.equal(
      catalog.filter(
        power => power.mechanics,
      ).length,
      106,
    )

    assert.deepEqual(
      validateDisciplinePowerCatalog(
        catalog,
      ),
      {
        valid: true,
        violations: [],
      },
    )
  },
)

test(
  '025-A11-M2 mantiene las 9 Ceremonias separadas de los 18 Poderes',
  () => {
    assert.equal(
      ceremonies.length,
      9,
    )

    assert.equal(
      oblivion.some(
        power =>
          power.key.includes(
            'ceremony',
          ),
      ),
      false,
    )
  },
)

test(
  '025-A11-M2 conserva los cuatro Poderes sin Control de Enardecimiento',
  () => {
    const noRouseKeys = [
      'oblivion-binding-fetter',
      'oblivion-shadow-cloak',
      'oblivion-oblivions-sight',
      'oblivion-passion-feast',
    ]

    assert.deepEqual(
      oblivion
        .filter(
          power =>
            power.mechanics
              .rouseCost.kind ===
                'none',
        )
        .map(power => power.key)
        .sort(),
      noRouseKeys.sort(),
    )

    for (const key of noRouseKeys) {
      assert.equal(
        mechanic(key)
          .systemSummary
          .includes(
            rouseStainNote,
          ),
        false,
      )
    }
  },
)

test(
  '025-A11-M2 presenta homogéneamente la regla general de Mácula en los 14 Poderes con Enardecimiento',
  () => {
    const withRouse =
      oblivion.filter(
        power =>
          power.mechanics
            .rouseCost.kind !== 'none',
      )

    assert.equal(
      withRouse.length,
      14,
    )

    for (const power of withRouse) {
      assert.equal(
        power.mechanics
          .systemSummary
          .includes(
            rouseStainNote,
          ),
        true,
        power.key,
      )
    }
  },
)

test(
  '025-A11-M2 representa Predicción Fatal con 24 horas exactas',
  () => {
    const fatal =
      mechanic(
        'oblivion-fatal-prediction',
      )

    assert.deepEqual(
      fatal.duration,
      {
        kind: 'hours',
        count: 24,
      },
    )

    assert.deepEqual(
      fatal.checks[0],
      {
        key: 'fatal-prediction',
        role: 'activation',
        pool: [
          {
            kind: 'attribute',
            key: 'resolve',
          },
          {
            kind: 'discipline',
            key: 'oblivion',
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
    )

    assert.equal(
      presentDisciplinePowerMechanics(
        fatal,
      ).duration,
      '24 horas',
    )
  },
)

test(
  '025-A11-M2 fija Donde el Velo se Adelgaza en Inteligencia + Olvido dificultad 3',
  () => {
    const veil =
      mechanic(
        'oblivion-where-the-shroud-thins',
      )

    assert.deepEqual(
      veil.duration,
      {
        kind: 'turns',
        count: 1,
      },
    )

    assert.deepEqual(
      veil.checks,
      [
        {
          key: 'assess-shroud',
          role: 'activation',
          pool: [
            {
              kind: 'attribute',
              key: 'intelligence',
            },
            {
              kind: 'discipline',
              key: 'oblivion',
            },
          ],
          resolution: {
            kind: 'fixedDifficulty',
            value: 3,
          },
        },
      ],
    )
  },
)

test(
  '025-A11-M2 conserva las oposiciones congeladas de Cenizas Plaga y Skuld',
  () => {
    const ashes =
      mechanic(
        'oblivion-ashes-to-ashes',
      )
    const plague =
      mechanic(
        'oblivion-necrotic-plague',
      )
    const skuld =
      mechanic(
        'oblivion-skuld-fulfilled',
      )

    assert.deepEqual(
      ashes.checks[0]
        .resolution
        .opposingPool,
      [
        {
          kind: 'attribute',
          key: 'stamina',
        },
        {
          kind: 'skill',
          key: 'medicine',
        },
      ],
    )

    for (const value of [
      plague,
      skuld,
    ]) {
      assert.deepEqual(
        value.checks[0]
          .resolution
          .opposingPool,
        [
          {
            kind: 'attribute',
            key: 'stamina',
          },
          {
            kind: 'attribute',
            key: 'stamina',
          },
        ],
      )
    }
  },
)

test(
  '025-A11-M2 no inventa una prueba de activación para El Grillete Vinculante',
  () => {
    const binding =
      mechanic(
        'oblivion-binding-fetter',
      )

    assert.equal(
      binding.checks,
      undefined,
    )

    assert.equal(
      binding.rouseCost.kind,
      'none',
    )
  },
)

test(
  '025-A11-M2 mantiene los costes dobles de Avatar Tenebroso y Skuld Cumplido',
  () => {
    for (const key of [
      'oblivion-tenebrous-avatar',
      'oblivion-skuld-fulfilled',
    ]) {
      assert.deepEqual(
        mechanic(key).rouseCost,
        {
          kind: 'fixed',
          checks: 2,
        },
      )
    }
  },
)

test(
  '025-A11-M2 conserva como resumen las duraciones que el contrato no puede expresar fielmente',
  () => {
    const ashes =
      mechanic(
        'oblivion-ashes-to-ashes',
      )
    const skuld =
      mechanic(
        'oblivion-skuld-fulfilled',
      )

    assert.equal(
      ashes.duration.kind,
      'singleUse',
    )
    assert.match(
      ashes.systemSummary,
      /5 turnos menos el margen/,
    )

    assert.equal(
      skuld.duration.kind,
      'singleUse',
    )
    assert.match(
      skuld.systemSummary,
      /duración del efecto depende/,
    )
  },
)

test(
  '025-A11-M2 no introduce stainCost ni ejecución en mechanics de Olvido',
  () => {
    const serialized =
      JSON.stringify(
        oblivion.map(
          power =>
            power.mechanics,
        ),
      )

    for (const forbidden of [
      'stainCost',
      'executePower',
      'activatePower',
      'performRouse',
      'setHunger',
      'updateHunger',
      'applyDamage',
    ]) {
      assert.equal(
        serialized.includes(
          forbidden,
        ),
        false,
        forbidden,
      )
    }
  },
)

test(
  '025-A11-M2 puede presentar los 18 Poderes sin exponer keys de duración',
  () => {
    for (const power of oblivion) {
      const view =
        presentDisciplinePowerMechanics(
          power.mechanics,
        )

      assert.equal(
        typeof view.duration,
        'string',
        power.key,
      )

      assert.equal(
        view.duration.length > 0,
        true,
        power.key,
      )

      assert.doesNotMatch(
        view.duration,
        /hoursByMargin|turnsByMargin|singleUse|baseHours|baseTurns/,
        power.key,
      )
    }
  },
)

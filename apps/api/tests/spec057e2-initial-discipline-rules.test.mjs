import assert from 'node:assert/strict'
import test from 'node:test'

import {
  deriveInitialDisciplineProgress,
  validateInitialDisciplineManifestation,
  validateInitialPowerManifestation,
} from '../dist/characters/domain/character-initial-discipline.rules.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

function character(overrides = {}) {
  return {
    identity: {
      clanKey: 'brujah',
    },
    disciplines: [],
    ...overrides,
  }
}

test(
  '057-E2 permite reparto progresivo 2+1',
  () => {
    assert.deepEqual(
      validateInitialDisciplineManifestation(
        character(),
        'celerity',
        2,
        characterRulesCatalog,
      ),
      [],
    )

    assert.deepEqual(
      validateInitialDisciplineManifestation(
        character({
          disciplines: [
            {
              disciplineKey: 'celerity',
              rating: 2,
              powerKeys: [],
              origin: 'creation',
            },
          ],
        }),
        'potence',
        1,
        characterRulesCatalog,
      ),
      [],
    )
  },
)

test(
  '057-E2 rechaza fuera de Clan y exceso de presupuesto',
  () => {
    assert.ok(
      validateInitialDisciplineManifestation(
        character(),
        'auspex',
        2,
        characterRulesCatalog,
      ).includes(
        'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_CLAN',
      ),
    )

    assert.ok(
      validateInitialDisciplineManifestation(
        character({
          disciplines: [
            {
              disciplineKey: 'celerity',
              rating: 2,
              powerKeys: [],
              origin: 'creation',
            },
          ],
        }),
        'potence',
        2,
        characterRulesCatalog,
      ).includes(
        'INITIAL_DISCIPLINE_BUDGET_EXCEEDED',
      ),
    )
  },
)

test(
  '057-E2 Caitiff usa 2+1 libre y Sangre Débil no recibe reparto normal',
  () => {
    assert.deepEqual(
      validateInitialDisciplineManifestation(
        character({
          identity: {
            clanKey: 'caitiff',
          },
        }),
        'auspex',
        2,
        characterRulesCatalog,
      ),
      [],
    )

    assert.ok(
      validateInitialDisciplineManifestation(
        character({
          identity: {
            clanKey: 'thinBlood',
          },
        }),
        'auspex',
        1,
        characterRulesCatalog,
      ).includes(
        'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_THIN_BLOOD',
      ),
    )

    assert.deepEqual(
      deriveInitialDisciplineProgress(
        character({
          identity: {
            clanKey: 'thinBlood',
          },
        }),
      ),
      {
        disciplinesComplete: true,
        powersComplete: true,
      },
    )
  },
)

test(
  '057-E2 Poderes respetan capacidad nivel y duplicados',
  () => {
    const base = character({
      disciplines: [
        {
          disciplineKey: 'celerity',
          rating: 2,
          powerKeys: [
            'celerity-cats-grace',
          ],
          origin: 'creation',
        },
        {
          disciplineKey: 'potence',
          rating: 1,
          powerKeys: [],
          origin: 'creation',
        },
      ],
    })

    assert.deepEqual(
      validateInitialPowerManifestation(
        base,
        'celerity',
        'celerity-fleetness',
        characterRulesCatalog,
      ),
      [],
    )

    assert.ok(
      validateInitialPowerManifestation(
        base,
        'celerity',
        'celerity-cats-grace',
        characterRulesCatalog,
      ).includes(
        'INITIAL_DISCIPLINE_POWER_DUPLICATE',
      ),
    )

    assert.ok(
      validateInitialPowerManifestation(
        base,
        'potence',
        'potence-prowess',
        characterRulesCatalog,
      ).includes(
        'INITIAL_DISCIPLINE_POWER_LEVEL_UNMET',
      ),
    )
  },
)

test(
  '057-E2 progreso separa Disciplinas completas de Poderes pendientes',
  () => {
    const base = character({
      disciplines: [
        {
          disciplineKey: 'celerity',
          rating: 2,
          powerKeys: [],
          origin: 'creation',
        },
        {
          disciplineKey: 'potence',
          rating: 1,
          powerKeys: [],
          origin: 'creation',
        },
      ],
    })

    assert.deepEqual(
      deriveInitialDisciplineProgress(base),
      {
        disciplinesComplete: true,
        powersComplete: false,
      },
    )

    assert.deepEqual(
      deriveInitialDisciplineProgress({
        ...base,
        disciplines: [
          {
            disciplineKey: 'celerity',
            rating: 2,
            powerKeys: [
              'celerity-cats-grace',
              'celerity-rapid-reflexes',
            ],
            origin: 'creation',
          },
          {
            disciplineKey: 'potence',
            rating: 1,
            powerKeys: [
              'potence-lethal-body',
            ],
            origin: 'creation',
          },
        ],
      }),
      {
        disciplinesComplete: true,
        powersComplete: true,
      },
    )
  },
)

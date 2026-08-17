import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  getAvailableDisciplinesForClan,
} from '../src/features/character-creation/domain/discipline-rules.ts'

import {
  initialVampireDisciplineChoices,
  initialVampirePowerDisciplineChoices,
} from '../src/features/character-sheet/domain/initial-vampire-transition-discipline-ui-state.ts'

const component =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampireTransition.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const helper =
  await readFile(
    new URL(
      '../src/features/character-sheet/domain/initial-vampire-transition-discipline-ui-state.ts',
      import.meta.url,
    ),
    'utf8',
  )

function transition(
  overrides = {},
) {
  return {
    characterId: 'character-1',
    revision: 7,
    status: 'active',
    phase: 'TRANSITIONAL_VAMPIRE',
    pendingDecisions: [
      'initialDisciplines',
      'initialPowers',
    ],
    creationMode: 'sessionZero',
    identity: {
      clanKey: 'brujah',
      generation: 13,
      sire: 'Sire',
      predatorTypeKey: null,
    },
    predatorTypeChoices: {},
    blood: {
      bloodPotency: 1,
      hunger: 2,
    },
    disciplines: [],
    advantages: {
      selections: [],
    },
    thinBloodTraits: [],
    thinBloodAlchemy: null,
    ...overrides,
  }
}

test(
  '057-F2A3B3C deriva las Disciplinas iniciales del catálogo/regla de clan existente',
  () => {
    const choices =
      initialVampireDisciplineChoices(
        transition(),
      )

    assert.deepEqual(
      choices.map(
        ({ key }) => key,
      ),
      getAvailableDisciplinesForClan(
        'brujah',
      ),
    )

    assert.ok(
      choices.every(
        ({ ratingOptions }) =>
          ratingOptions.length > 0,
      ),
    )

    assert.ok(
      helper.includes(
        'updateDiscipline(',
      ),
    )

    assert.doesNotMatch(
      helper,
      /brujah[\s\S]*celerity[\s\S]*potence[\s\S]*presence/,
    )
  },
)

test(
  '057-F2A3B3C excluye una contribución creation ya manifestada',
  () => {
    const choices =
      initialVampireDisciplineChoices(
        transition({
          disciplines: [
            {
              disciplineKey:
                'celerity',
              rating: 2,
              powerKeys: [],
              origin:
                'creation',
            },
          ],
        }),
      )

    assert.equal(
      choices.some(
        ({ key }) =>
          key === 'celerity',
      ),
      false,
    )
  },
)

test(
  '057-F2A3B3C conserva casos especiales a través de la regla compartida',
  () => {
    const caitiff =
      initialVampireDisciplineChoices(
        transition({
          identity: {
            clanKey: 'caitiff',
            generation: 13,
            sire: null,
            predatorTypeKey: null,
          },
        }),
      )

    assert.deepEqual(
      caitiff.map(
        ({ key }) => key,
      ),
      getAvailableDisciplinesForClan(
        'caitiff',
      ),
    )

    const thinBlood =
      initialVampireDisciplineChoices(
        transition({
          identity: {
            clanKey: 'thinBlood',
            generation: 15,
            sire: null,
            predatorTypeKey: null,
          },
        }),
      )

    assert.deepEqual(
      thinBlood,
      [],
    )
  },
)

test(
  '057-F2A3B3C ofrece Poderes sólo para capacidad creation pendiente y reglas aprendibles',
  () => {
    const choices =
      initialVampirePowerDisciplineChoices(
        transition({
          disciplines: [
            {
              disciplineKey:
                'celerity',
              rating: 2,
              powerKeys: [
                'celerity-cats-grace',
              ],
              origin:
                'creation',
            },
            {
              disciplineKey:
                'potence',
              rating: 1,
              powerKeys: [
                'potence-lethal-body',
              ],
              origin:
                'creation',
            },
          ],
        }),
      )

    const celerity =
      choices.find(
        ({ key }) =>
          key === 'celerity',
      )

    assert.ok(celerity)
    assert.equal(
      celerity.rating,
      2,
    )
    assert.equal(
      celerity.selectedPowerCount,
      1,
    )
    assert.ok(
      celerity.powers.length > 0,
    )
    assert.equal(
      celerity.powers.some(
        ({ key }) =>
          key ===
          'celerity-cats-grace',
      ),
      false,
    )

    assert.equal(
      choices.some(
        ({ key }) =>
          key === 'potence',
      ),
      false,
    )
  },
)

test(
  '057-F2A3B3C usa pendingDecisions como autoridad de presentación',
  () => {
    assert.match(
      component,
      /pending\.includes\(\s*'initialDisciplines'/,
    )

    assert.match(
      component,
      /pending\.includes\(\s*'initialPowers'/,
    )

    assert.match(
      component,
      /<h3>\s*Disciplinas iniciales\s*<\/h3>/,
    )

    assert.match(
      component,
      /<h3>Poderes iniciales<\/h3>/,
    )
  },
)

test(
  '057-F2A3B3C usa las operaciones dedicadas y recarga estado autoritativo',
  () => {
    assert.match(
      component,
      /resolvedGateway\s*\.manifestDiscipline\(/,
    )

    assert.match(
      component,
      /resolvedGateway\s*\.manifestPower\(/,
    )

    assert.match(
      component,
      /transition\.revision/,
    )

    assert.match(
      component,
      /await operation\(\)[\s\S]*onResolved\(\)/,
    )
  },
)

test(
  '057-F2A3B3C no duplica 2+1 ni reglas de Poderes dentro de React',
  () => {
    assert.doesNotMatch(
      component,
      /2\s*\+\s*1/,
    )

    assert.doesNotMatch(
      component,
      /clanKey\s*===\s*['"]brujah['"]/,
    )

    assert.doesNotMatch(
      component,
      /power\.level\s*<=\s*[12345]/,
    )

    assert.match(
      helper,
      /validateDisciplinePowerAcquisition\(/,
    )

    assert.match(
      helper,
      /getActiveDisciplinePowers\(/,
    )
  },
)

test(
  '057-F2A3B3C no adelanta rituales depredador Sangre Débil ventajas ni consolidación',
  () => {
    for (
      const forbidden of [
        'adoptPredatorType(',
        'reviewAdvantages(',
        'resolveThinBloodState(',
        'consolidate(',
        'BloodSorceryRitualSelector',
        'OblivionCeremonySelector',
      ]
    ) {
      assert.equal(
        component.includes(
          forbidden,
        ),
        false,
      )
    }
  },
)

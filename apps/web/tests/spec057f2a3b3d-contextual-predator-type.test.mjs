import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  initialVampirePredatorAdvantages,
  initialVampirePredatorClanKey,
  initialVampirePredatorPowerChoices,
  initialVampirePredatorTypeOptions,
  toInitialVampirePredatorApiAdvantages,
} from '../src/features/character-sheet/domain/initial-vampire-transition-predator-ui-state.ts'

const parentSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampireTransition.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const predatorSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampirePredatorType.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const helperSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/domain/initial-vampire-transition-predator-ui-state.ts',
      import.meta.url,
    ),
    'utf8',
  )

function transition(
  overrides = {},
) {
  return {
    characterId: 'character-1',
    revision: 11,
    status: 'active',
    phase: 'TRANSITIONAL_VAMPIRE',
    pendingDecisions: [
      'predatorType',
      'advantagesReview',
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
      hunger: 1,
    },
    disciplines: [
      {
        disciplineKey: 'potence',
        rating: 2,
        powerKeys: [
          'potence-lethal-body',
          'potence-soaring-leap',
        ],
        origin: 'creation',
      },
      {
        disciplineKey: 'celerity',
        rating: 1,
        powerKeys: [
          'celerity-cats-grace',
        ],
        origin: 'creation',
      },
    ],
    advantages: {
      selections: [],
    },
    thinBloodTraits: [],
    thinBloodAlchemy: null,
    ...overrides,
  }
}

test(
  '057-F2A3B3D canoniza Clan desde catálogo compartido',
  () => {
    assert.equal(
      initialVampirePredatorClanKey(
        transition(),
      ),
      'brujah',
    )

    assert.equal(
      initialVampirePredatorClanKey(
        transition({
          identity: {
            ...transition().identity,
            clanKey: 'invented-clan',
          },
        }),
      ),
      null,
    )
  },
)

test(
  '057-F2A3B3D obtiene Tipos desde reglas existentes y excluye Sangre Débil sin regla React propia',
  () => {
    const ordinary =
      initialVampirePredatorTypeOptions(
        transition(),
      )

    assert.ok(
      ordinary.length > 0,
    )

    const thin =
      initialVampirePredatorTypeOptions(
        transition({
          identity: {
            ...transition().identity,
            clanKey: 'thinBlood',
            generation: 14,
          },
          blood: {
            bloodPotency: 0,
            hunger: 1,
          },
        }),
      )

    assert.deepEqual(thin, [])

    assert.match(
      helperSource,
      /normalizePredatorTypeForCharacter/,
    )

    assert.doesNotMatch(
      predatorSource,
      /clanKey\s*===\s*['"]thinBlood['"]/,
    )
  },
)

test(
  '057-F2A3B3D genera concesiones de Ventajas mediante el motor Predator existente',
  () => {
    const current =
      transition()

    const option =
      initialVampirePredatorTypeOptions(
        current,
      ).find(
        ({ value }) =>
          value === 'bagger',
      )

    assert.ok(option)

    const advantages =
      initialVampirePredatorAdvantages(
        current,
        option.value,
        {
          'bagger-specialty': 0,
          'bagger-discipline': 1,
        },
      )

    assert.ok(
      advantages.selections.length > 0,
    )

    assert.ok(
      advantages.selections.every(
        ({ origin }) =>
          origin === 'predatorType',
      ),
    )

    assert.match(
      helperSource,
      /applyPredatorTypeAdvantages/,
    )

    assert.match(
      helperSource,
      /restorePredatorTypePointDistributionSelections/,
    )
  },
)

test(
  '057-F2A3B3D deriva el Poder concedido con reglas compartidas',
  () => {
    const choices =
      initialVampirePredatorPowerChoices(
        transition(),
        'bagger',
        {
          'bagger-specialty': 0,
          'bagger-discipline': 1,
        },
      )

    assert.ok(
      choices.length > 0,
    )

    assert.match(
      helperSource,
      /applyPredatorTypeDisciplines/,
    )

    assert.match(
      helperSource,
      /validateDisciplinePowerAcquisition/,
    )

    assert.match(
      helperSource,
      /getActiveDisciplinePowers/,
    )
  },
)

test(
  '057-F2A3B3D adapta sólo Ventajas predatorType al DTO API',
  () => {
    const result =
      toInitialVampirePredatorApiAdvantages({
        selections: [
          {
            selectionId:
              'predator-1',
            definitionKey:
              'iron-stomach',
            category: 'merit',
            rating: 3,
            origin: 'predatorType',
          },
          {
            selectionId:
              'creation-1',
            definitionKey:
              'resources',
            category: 'background',
            rating: 2,
            origin: 'creation',
          },
        ],
      })

    assert.deepEqual(
      result.selections,
      [
        {
          selectionId:
            'predator-1',
          definitionKey:
            'iron-stomach',
          category: 'merit',
          rating: 3,
          origin: 'predatorType',
          parentSelectionId: null,
          details: null,
        },
      ],
    )
  },
)

test(
  '057-F2A3B3D usa pendingDecisions como autoridad de presentación',
  () => {
    assert.match(
      parentSource,
      /pending\.includes\(\s*'predatorType'/,
    )

    assert.match(
      parentSource,
      /<PersistedInitialVampirePredatorType/,
    )

    assert.doesNotMatch(
      parentSource,
      /transition\.identity\.predatorTypeKey\s*===\s*null[\s\S]*PersistedInitialVampirePredatorType/,
    )
  },
)

test(
  '057-F2A3B3D reutiliza el configurador completo del creador',
  () => {
    assert.match(
      predatorSource,
      /PredatorTypeConfiguration/,
    )

    assert.match(
      predatorSource,
      /initialVampirePredatorPowerChoices/,
    )

    assert.doesNotMatch(
      predatorSource,
      /predatorTypeDefinitions/,
    )
  },
)

test(
  '057-F2A3B3D usa operación dedicada revisión y recarga autoritativa',
  () => {
    assert.match(
      parentSource,
      /resolvedGateway[\s\S]*\.adoptPredatorType\([\s\S]*transition\.characterId[\s\S]*transition\.revision[\s\S]*input/,
    )

    assert.match(
      parentSource,
      /await\s+operation\(\)[\s\S]*onResolved\(\)/,
    )
  },
)

test(
  '057-F2A3B3D no adelanta Thin Blood Ventajas ni consolidación',
  () => {
    for (
      const forbidden of [
        'reviewAdvantages(',
        'resolveThinBloodState(',
        'consolidate(',
      ]
    ) {
      assert.equal(
        parentSource.includes(
          forbidden,
        ),
        false,
        forbidden,
      )

      assert.equal(
        predatorSource.includes(
          forbidden,
        ),
        false,
        forbidden,
      )
    }
  },
)

test(
  '057-F2A3B3D mantiene mecánica fuera de React',
  () => {
    for (
      const forbidden of [
        'humanityModifier',
        'bloodPotencyModifier',
        'bonusSkillKey',
        'specialty.skillKey',
        'fixedGrants',
        'pointDistributions',
      ]
    ) {
      assert.equal(
        predatorSource.includes(
          forbidden,
        ),
        false,
        forbidden,
      )
    }
  },
)

import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  initialVampireThinBloodResolution,
  initialVampireThinBloodTraitsDraft,
} from '../src/features/character-sheet/domain/initial-vampire-transition-thin-blood-ui-state.ts'

const parentSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampireTransition.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const componentSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampireThinBloodState.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const helperSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/domain/initial-vampire-transition-thin-blood-ui-state.ts',
      import.meta.url,
    ),
    'utf8',
  )

const clanCurseSource =
  await readFile(
    new URL(
      '../src/features/character-creation/components/thin-blood/ClanCurseSection.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const hookSource =
  await readFile(
    new URL(
      '../src/features/character-creation/hooks/useThinBloodTraits.ts',
      import.meta.url,
    ),
    'utf8',
  )

const mapperSource =
  await readFile(
    new URL(
      '../src/features/character-creation/domain/character-draft-api.mapper.ts',
      import.meta.url,
    ),
    'utf8',
  )

function transition(
  overrides = {},
) {
  return {
    characterId:
      'character-thin-1',
    revision: 19,
    status: 'active',
    phase: 'TRANSITIONAL_VAMPIRE',
    pendingDecisions: [
      'thinBloodState',
      'advantagesReview',
    ],
    creationMode: 'sessionZero',
    identity: {
      clanKey: 'thinBlood',
      generation: 14,
      sire: 'Sire',
      predatorTypeKey: null,
    },
    predatorTypeChoices: {},
    blood: {
      bloodPotency: 0,
      hunger: 1,
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
  '057-F2A3B3E adapta estado parcial API a draft sin inventar valores',
  () => {
    const result =
      initialVampireThinBloodTraitsDraft(
        transition({
          thinBloodTraits: [
            {
              definitionKey:
                'clan-curse',
              clanCurseDetails: {
                clanKey: 'brujah',
              },
              disciplineAffinityDetails:
                null,
            },
          ],
        }),
      )

    assert.deepEqual(
      result,
      {
        selections: [
          {
            definitionKey:
              'clan-curse',
            clanCurseDetails: {
              clanKey: 'brujah',
            },
          },
        ],
      },
    )
  },
)

test(
  '057-F2A3B3E valida 1 Mérito y 1 Defecto con reglas compartidas',
  () => {
    const result =
      initialVampireThinBloodResolution(
        {
          selections: [
            {
              definitionKey:
                'day-drinker',
            },
            {
              definitionKey:
                'baby-teeth',
            },
          ],
        },
        {
          rating: 0,
          method: null,
          formulaKeys: [],
        },
      )

    assert.equal(
      result.valid,
      true,
      result.errors.join('\n'),
    )

    assert.deepEqual(
      result.thinBloodAlchemy,
      {
        rating: 0,
        method: null,
        formulaKeys: [],
      },
    )

    assert.equal(
      result.thinBloodTraits.length,
      2,
    )
  },
)

test(
  '057-F2A3B3E no reimplementa equilibrio incompatibilidades ni Alquimia en React',
  () => {
    assert.match(
      helperSource,
      /validateThinBloodTraitsForCharacterKind/,
    )

    assert.match(
      helperSource,
      /normalizeThinBloodAlchemyForCharacter/,
    )

    assert.match(
      helperSource,
      /validateInitialThinBloodAlchemySelection/,
    )

    for (
      const forbidden of [
        'meritCount === flawCount',
        'meritCount >= 1',
        'thin-blood-alchemist',
        'dead-flesh',
        'mortal-frailty',
        'anarch-rejected',
      ]
    ) {
      assert.equal(
        componentSource.includes(
          forbidden,
        ),
        false,
        forbidden,
      )
    }
  },
)

test(
  '057-F2A3B3E reutiliza ThinBloodSection completo del creador',
  () => {
    assert.match(
      componentSource,
      /<ThinBloodSection/,
    )

    assert.match(
      componentSource,
      /useThinBloodTraits/,
    )

    assert.match(
      componentSource,
      /getThinBloodTraitDefinitionsByCategory/,
    )
  },
)

test(
  '057-F2A3B3E completa Maldición de Clan mediante catálogo y dominio compartido',
  () => {
    assert.match(
      hookSource,
      /getClanCurseDetails/,
    )

    assert.match(
      hookSource,
      /setClanCurseDetails/,
    )

    assert.match(
      clanCurseSource,
      /clanDefinitions/,
    )

    assert.match(
      clanCurseSource,
      /kind\s*\}\)\s*=>\s*kind\s*===\s*['"]clan['"]/,
    )

    assert.match(
      clanCurseSource,
      /getThinBloodClanCurseSeverity/,
    )

    assert.doesNotMatch(
      clanCurseSource,
      /return\s*<><\/>/,
    )
  },
)

test(
  '057-F2A3B3E reutiliza la serialización Thin Blood existente',
  () => {
    assert.match(
      mapperSource,
      /export function draftThinBloodTraitsToApi/,
    )

    assert.match(
      helperSource,
      /draftThinBloodTraitsToApi/,
    )
  },
)

test(
  '057-F2A3B3E usa pendingDecisions como autoridad de presentación',
  () => {
    assert.match(
      parentSource,
      /pending\.includes\(\s*'thinBloodState'/,
    )

    assert.match(
      parentSource,
      /<PersistedInitialVampireThinBloodState/,
    )

    assert.doesNotMatch(
      parentSource,
      /identity\.clanKey\s*===\s*['"]thinBlood['"][\s\S]*PersistedInitialVampireThinBloodState/,
    )
  },
)

test(
  '057-F2A3B3E usa gateway dedicado revisión exacta y recarga autoritativa',
  () => {
    assert.match(
      parentSource,
      /resolvedGateway[\s\S]*\.resolveThinBloodState\([\s\S]*transition\.characterId[\s\S]*transition\.revision/,
    )

    assert.match(
      parentSource,
      /await\s+operation\(\)[\s\S]*onResolved\(\)/,
    )
  },
)

test(
  '057-F2A3B3E no adelanta revisión de Ventajas ni consolidación',
  () => {
    for (
      const forbidden of [
        'reviewAdvantages(',
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
        componentSource.includes(
          forbidden,
        ),
        false,
        forbidden,
      )
    }
  },
)

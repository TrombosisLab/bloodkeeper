import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  initialVampireAdvantagesBudgetValid,
  initialVampireAdvantagesDraft,
  initialVampireAdvantagesReviewPayload,
} from '../src/features/character-sheet/domain/initial-vampire-transition-advantages-ui-state.ts'

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
      '../src/features/character-sheet/components/PersistedInitialVampireAdvantagesReview.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const helperSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/domain/initial-vampire-transition-advantages-ui-state.ts',
      import.meta.url,
    ),
    'utf8',
  )

const advantagesStepSource =
  await readFile(
    new URL(
      '../src/features/character-creation/components/AdvantagesStep.tsx',
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

function transition() {
  return {
    characterId: 'character-1',
    revision: 23,
    status: 'active',
    phase: 'TRANSITIONAL_VAMPIRE',
    pendingDecisions: [
      'advantagesReview',
    ],
    creationMode: 'sessionZero',
    identity: {
      clanKey: 'ventrue',
      generation: 13,
      sire: 'Sire',
      predatorTypeKey: 'sandman',
    },
    predatorTypeChoices: {},
    blood: {
      bloodPotency: 1,
      hunger: 1,
    },
    disciplines: [],
    advantages: {
      selections: [
        {
          selectionId: 'creation-haven',
          definitionKey: 'haven',
          category: 'background',
          rating: 3,
          origin: 'creation',
          parentSelectionId: null,
          details: null,
        },
        {
          selectionId: 'creation-resources',
          definitionKey: 'resources',
          category: 'background',
          rating: 4,
          origin: 'creation',
          parentSelectionId: null,
          details: null,
        },
        {
          selectionId: 'creation-enemy',
          definitionKey: 'enemy',
          category: 'flaw',
          rating: 2,
          origin: 'creation',
          parentSelectionId: null,
          details: null,
        },
        {
          selectionId: 'predator-grant',
          definitionKey: 'iron-stomach',
          category: 'merit',
          rating: 3,
          origin: 'predatorType',
          parentSelectionId: null,
          details: null,
        },
      ],
    },
    thinBloodTraits: [],
    thinBloodAlchemy: null,
  }
}

test(
  '057-F2A3B3F adapta snapshot completo al editor existente',
  () => {
    const draft =
      initialVampireAdvantagesDraft(
        transition(),
      )

    assert.equal(
      draft.selections.length,
      4,
    )

    assert.equal(
      draft.selections[3].origin,
      'predatorType',
    )
  },
)

test(
  '057-F2A3B3F envía al endpoint sólo selecciones origin creation',
  () => {
    const payload =
      initialVampireAdvantagesReviewPayload(
        initialVampireAdvantagesDraft(
          transition(),
        ),
      )

    assert.equal(
      payload.selections.length,
      3,
    )

    assert.ok(
      payload.selections.every(
        ({ origin }) =>
          origin === 'creation',
      ),
    )
  },
)

test(
  '057-F2A3B3F reutiliza presupuesto inicial compartido',
  () => {
    assert.equal(
      initialVampireAdvantagesBudgetValid(
        initialVampireAdvantagesDraft(
          transition(),
        ),
      ),
      true,
    )

    assert.match(
      helperSource,
      /validateInitialCharacterAdvantagesBudget/,
    )
  },
)

test(
  '057-F2A3B3F reutiliza mapper bidireccional compartido',
  () => {
    assert.match(
      mapperSource,
      /export function draftAdvantagesToApi/,
    )

    assert.match(
      mapperSource,
      /export function apiAdvantagesToDraft/,
    )

    assert.match(
      helperSource,
      /apiAdvantagesToDraft/,
    )

    assert.match(
      helperSource,
      /draftAdvantagesToApi/,
    )
  },
)

test(
  '057-F2A3B3F distingue naturaleza real sin falsear SESSION_ZERO',
  () => {
    assert.match(
      advantagesStepSource,
      /creationMode === 'sessionZero'[\s\S]*profileNature === 'human'/,
    )

    assert.match(
      componentSource,
      /creationMode=\{\s*transition\.creationMode\s*\}/,
    )

    assert.match(
      componentSource,
      /profileNature="vampire"/,
    )
  },
)

test(
  '057-F2A3B3F no reabre Sangre Débil ni edita concesiones automáticas',
  () => {
    assert.match(
      componentSource,
      /showThinBloodState=\{false\}/,
    )

    assert.match(
      componentSource,
      /automaticGrantDetailsReadOnly/,
    )

    assert.match(
      advantagesStepSource,
      /!automaticGrantDetailsReadOnly/,
    )
  },
)

test(
  '057-F2A3B3F usa pendingDecisions como autoridad de presentación',
  () => {
    assert.match(
      parentSource,
      /pending\.includes\(\s*'advantagesReview'/,
    )

    assert.match(
      parentSource,
      /<PersistedInitialVampireAdvantagesReview/,
    )
  },
)

test(
  '057-F2A3B3F usa gateway dedicado revisión y recarga autoritativa',
  () => {
    assert.match(
      parentSource,
      /resolvedGateway[\s\S]*\.reviewAdvantages\([\s\S]*transition\.characterId[\s\S]*transition\.revision/,
    )

    assert.match(
      parentSource,
      /await\s+operation\(\)[\s\S]*onResolved\(\)/,
    )
  },
)

test(
  '057-F2A3B3F mantiene consolidación fuera de este bloque',
  () => {
    assert.equal(
      parentSource.includes(
        'consolidate(',
      ),
      false,
    )

    assert.equal(
      componentSource.includes(
        'consolidate(',
      ),
      false,
    )
  },
)

test(
  '057-F2A3B3F no intenta decidir qué selección válida puede sustituirse',
  () => {
    for (
      const forbidden of [
        'replaceableSelectionIds',
        'CHARACTER_INITIAL_ADVANTAGE_VALID_SELECTION_MUST_BE_PRESERVED',
        'analyzeInitialAdvantageReview',
      ]
    ) {
      assert.equal(
        componentSource.includes(
          forbidden,
        ),
        false,
        forbidden,
      )

      assert.equal(
        helperSource.includes(
          forbidden,
        ),
        false,
        forbidden,
      )
    }
  },
)

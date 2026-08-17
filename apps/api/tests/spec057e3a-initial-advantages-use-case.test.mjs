import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InitialVampireAdvantagesInvalidError,
  ResolveInitialVampireStateUseCase,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

const ownerId =
  '11111111-1111-4111-8111-111111111111'
const characterId =
  '22222222-2222-4222-8222-222222222222'

function selections() {
  return [
    {
      selectionId: 'resources',
      definitionKey: 'resources',
      category: 'background',
      rating: 5,
      origin: 'creation',
      parentSelectionId: null,
      details: {
        kind: 'resources',
        source: 'Patrimonio',
      },
    },
    {
      selectionId: 'contacts',
      definitionKey: 'contacts',
      category: 'background',
      rating: 2,
      origin: 'creation',
      parentSelectionId: null,
      details: {
        kind: 'contact',
        identity: 'Periodista',
      },
    },
    {
      selectionId: 'vegan',
      definitionKey: 'vegan',
      category: 'flaw',
      rating: 2,
      origin: 'creation',
      parentSelectionId: null,
      details: null,
    },
  ]
}

function character() {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 7,
    identity: {
      clanKey: 'ventrue',
      generation: 13,
      sire: null,
      predatorTypeKey: null,
      ageCategory: 'neonate',
    },
    creation: {
      creationMode: 'sessionZero',
    },
    blood: {
      bloodPotency: 1,
      hunger: 1,
    },
    disciplines: [],
    advantages: {
      selections: selections(),
    },
    humanity: {
      value: 6,
      stains: 1,
    },
  }
}

function candidate() {
  const current = selections()

  return {
    selections: [
      current[0],
      current[1],
      {
        selectionId: 'enemy',
        definitionKey: 'enemy',
        category: 'flaw',
        rating: 2,
        origin: 'creation',
        parentSelectionId: null,
        details: {
          kind: 'enemy',
          identity: 'Rival',
        },
      },
    ],
  }
}

function setup() {
  let current = character()

  const repository = {
    async findByCharacterId() {
      return current
    },

    async resolveInitialVampireState(data) {
      current = {
        ...current,
        revision: current.revision + 1,
        advantages:
          data.advantages,
      }

      return current
    },
  }

  return new ResolveInitialVampireStateUseCase(
    repository,
    {
      async findActiveMembership() {
        throw new Error(
          'No membership without Chronicle',
        )
      },
    },
    characterRulesCatalog,
  )
}

test(
  '057-E3A sustituye sólo la selección inválida y retira advantagesReview',
  async () => {
    const result =
      await setup().reviewAdvantages(
        ownerId,
        {
          characterId,
          expectedRevision: 7,
          advantages: candidate(),
        },
      )

    assert.equal(
      result.pendingDecisions.includes(
        'advantagesReview',
      ),
      false,
    )
    assert.equal(
      result.character.humanity.value,
      6,
    )
  },
)

test(
  '057-E3A bloquea modificación de una selección todavía válida',
  async () => {
    const invalid = candidate()
    invalid.selections[0] = {
      ...invalid.selections[0],
      rating: 4,
    }

    await assert.rejects(
      setup().reviewAdvantages(
        ownerId,
        {
          characterId,
          expectedRevision: 7,
          advantages: invalid,
        },
      ),
      InitialVampireAdvantagesInvalidError,
    )
  },
)

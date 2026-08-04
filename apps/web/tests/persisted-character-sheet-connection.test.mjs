import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  CharacterDraftApiError,
} from '../src/features/character-creation/infrastructure/character-draft.api.ts'

import {
  loadPersistedCharacterSheet,
  messageForCharacterSheetLoadState,
  stateForCharacterSheetLoadError,
} from '../src/features/character-sheet/domain/persisted-character-sheet.loader.ts'

const persistedSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

const sheetSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

const mainSource = await readFile(
  new URL('../src/main.tsx', import.meta.url),
  'utf8',
)

const attributesSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterAttributes.tsx',
    import.meta.url,
  ),
  'utf8',
)

const stateSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterState.tsx',
    import.meta.url,
  ),
  'utf8',
)

const bloodExperienceSource =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/CharacterBloodExperience.tsx',
      import.meta.url,
    ),
    'utf8',
  )

function snapshot() {
  return {
    characterId:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    ownerId:
      '3bbc46f8-a45f-4589-9872-129e6652082c',
    chronicleId: null,
    status: 'draft',
    revision: 3,
    createdAt:
      '2026-08-04T09:00:00.000Z',
    updatedAt:
      '2026-08-04T10:00:00.000Z',

    identity: {
      name: 'Alicia',
      concept: null,
      predatorTypeKey: null,
      ambition: null,
      clanKey: null,
      sire: null,
      desire: null,
      generation: null,
    },

    creation: {
      schemaVersion: 1,
      currentStep: 'attributes',
      skillDistributionMethod:
        'balanced',
      predatorTypeChoices: {},
      updatedAt:
        '2026-08-04T10:00:00.000Z',
    },

    attributes: {
      ...initialCharacterDraft.attributes,
    },

    blood: {
      ...initialCharacterDraft.blood,
    },

    damage: {
      health: {
        superficial: 0,
        aggravated: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 0,
      },
    },

    skills: {
      ...initialCharacterDraft.skills,
    },

    skillSpecialties: [],
    disciplines: [],

    bloodSorceryRituals: {
      ritualKeys: [],
    },

    oblivionCeremonies: {
      ceremonyKeys: [],
    },

    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },

    thinBloodTraits: [],

    advantages: {
      selections: [],
    },

    humanity: {
      value: 7,
      stains: 0,
      convictions: [],
      touchstones: [],
    },
  }
}

test(
  '004-F.2 carga el snapshot mediante gateway y entrega CharacterSheetModel',
  async () => {
    const source = snapshot()

    const gateway = {
      async create() {
        throw new Error('unexpected')
      },

      async load(characterId) {
        assert.equal(
          characterId,
          source.characterId,
        )

        return source
      },

      async update() {
        throw new Error('unexpected')
      },
    }

    const model =
      await loadPersistedCharacterSheet(
        gateway,
        source.characterId,
      )

    assert.equal(
      model.characterId,
      source.characterId,
    )
    assert.equal(model.revision, 3)
    assert.equal(
      model.identity.name,
      'Alicia',
    )
    assert.equal(
      model.damage.healthCapacity,
      4,
    )
    assert.equal(
      model.damage.willpowerCapacity,
      2,
    )
  },
)

test(
  '004-F.2 clasifica sesión ausencia y fallo de carga',
  () => {
    assert.equal(
      stateForCharacterSheetLoadError(
        new CharacterDraftApiError(
          401,
          'AUTHENTICATION_REQUIRED',
        ),
      ),
      'unauthorized',
    )

    assert.equal(
      stateForCharacterSheetLoadError(
        new CharacterDraftApiError(
          404,
          'CHARACTER_DRAFT_NOT_FOUND',
        ),
      ),
      'not-found',
    )

    assert.equal(
      stateForCharacterSheetLoadError(
        new Error('network'),
      ),
      'error',
    )

    assert.match(
      messageForCharacterSheetLoadState(
        'unauthorized',
      ),
      /sesión/,
    )

    assert.match(
      messageForCharacterSheetLoadState(
        'not-found',
      ),
      /no existe/,
    )
  },
)

test(
  '004-F.2 conecta modelo persistido sin eliminar la ficha demo',
  () => {
    assert.match(
      persistedSource,
      /loadPersistedCharacterSheet/,
    )
    assert.match(
      persistedSource,
      /Recargar ficha/,
    )
    assert.match(
      persistedSource,
      /model=\{loadState\.model\}/,
    )

    assert.match(
      mainSource,
      /creationCharacterId === null[\s\S]*<CharacterSheet \/>[\s\S]*<PersistedCharacterSheet/,
    )

    assert.match(
      sheetSource,
      /model\?\.identity/,
    )
    assert.match(
      sheetSource,
      /demoCharacter/,
    )
    assert.match(
      sheetSource,
      /Ficha persistida/,
    )
    assert.match(
      sheetSource,
      /Edición local de demostración/,
    )

    assert.match(
      attributesSource,
      /attributes = demoAttributes/,
    )
    assert.match(
      stateSource,
      /bloodPotency =\s*demoState\.bloodPotency/,
    )
    assert.match(
      bloodExperienceSource,
      /contrato persistente/,
    )

    assert.doesNotMatch(
      persistedSource,
      /\bCharacterDraft\b/,
    )
  },
)

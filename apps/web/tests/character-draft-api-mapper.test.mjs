import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  mapCharacterDraftApiSnapshotToEditorState,
  mapCharacterDraftToCreateRequest,
  mapCharacterDraftToUpdateRequest,
} from '../src/features/character-creation/domain/character-draft-api.mapper.ts'

const attributeKeys = [
  'strength',
  'dexterity',
  'stamina',
  'charisma',
  'manipulation',
  'composure',
  'intelligence',
  'wits',
  'resolve',
]

const skillKeys = [
  'athletics',
  'brawl',
  'craft',
  'drive',
  'firearms',
  'larceny',
  'melee',
  'stealth',
  'survival',
  'animalKen',
  'etiquette',
  'insight',
  'intimidation',
  'leadership',
  'performance',
  'persuasion',
  'streetwise',
  'subterfuge',
  'academics',
  'awareness',
  'finance',
  'investigation',
  'medicine',
  'occult',
  'politics',
  'science',
  'technology',
]

function richSnapshot() {
  return {
    characterId:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    ownerId:
      '3bbc46f8-a45f-4589-9872-129e6652082c',
    chronicleId:
      '2fc3fe58-c087-4473-b315-f072aa65efb1',
    status: 'draft',
    revision: 7,
    createdAt:
      '2026-08-04T09:00:00.000Z',
    updatedAt:
      '2026-08-04T10:00:00.000Z',
    identity: {
      name: 'Alicia',
      concept: null,
      predatorTypeKey: 'sandman',
      ambition: 'Descubrir la verdad',
      clanKey: 'malkavian',
      sire: null,
      desire: 'Entrar en el archivo',
      generation: 13,
      ageCategory: 'ancilla',
    },
    creation: {
      schemaVersion: 1,
      currentStep: 'disciplines',
      skillDistributionMethod:
        'balanced',
      predatorTypeChoices: {
        'sandman-discipline': 0,
      },
      updatedAt:
        '2026-08-04T10:00:00.000Z',
    },
    attributes:
      Object.fromEntries(
        attributeKeys.map(
          (key, index) => [
            key,
            index === 0 ? 4 : 1,
          ],
        ),
      ),
    blood: {
      bloodPotency: 1,
      hunger: 2,
    },
    damage: {
      health: {
        superficial: 1,
        aggravated: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 1,
      },
    },
    skills:
      Object.fromEntries(
        skillKeys.map(
          (key, index) => [
            key,
            index === 0 ? 3 : 0,
          ],
        ),
      ),
    skillSpecialties: [
      {
        id: 'specialty-1',
        skillKey: 'athletics',
        name: 'Escalada',
        origin: null,
      },
      {
        id: 'specialty-2',
        skillKey: 'stealth',
        name: 'Dormitorios',
        origin: 'predatorType',
      },
    ],
    disciplines: [
      {
        disciplineKey: 'auspex',
        rating: 2,
        powerKeys: [
          'auspex-heightened-senses',
          'auspex-premonition',
        ],
        origin: 'creation',
      },
      {
        disciplineKey: 'auspex',
        rating: 1,
        powerKeys: [
          'auspex-scry-the-soul',
        ],
        origin: 'predatorType',
      },
    ],
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
    thinBloodTraits: [
      {
        definitionKey:
          'camarilla-branded',
        clanCurseDetails: null,
        disciplineAffinityDetails:
          null,
      },
    ],
    advantages: {
      selections: [
        {
          selectionId: 'status-1',
          definitionKey: 'status',
          category: 'background',
          rating: 2,
          origin: 'creation',
          parentSelectionId: null,
          details: {
            kind: 'status',
            sphere: 'Camarilla',
          },
        },
        {
          selectionId: 'beautiful-1',
          definitionKey: 'beautiful',
          category: 'merit',
          rating: 2,
          origin: 'creation',
          parentSelectionId: null,
          details: null,
        },
      ],
    },
    humanity: {
      value: 7,
      stains: 2,
      convictions: [
        {
          convictionId: 'conviction-1',
          text: 'Nunca abandonar a un aliado',
          touchstoneId:
            'touchstone-1',
        },
      ],
      touchstones: [
        {
          touchstoneId:
            'touchstone-1',
          name: 'Lucía',
          relationship: 'Hermana',
        },
      ],
    },
  }
}

test(
  '004-E.2A convierte un CharacterDraft nuevo al contrato POST',
  () => {
    const draft =
      structuredClone(
        initialCharacterDraft,
      )

    draft.identity.name = 'Alicia'
    draft.identity.chronicle =
      'Texto legacy no persistible'
    draft.skillSpecialties = [
      {
        id: 'specialty-1',
        skillKey: 'athletics',
        name: 'Escalada',
      },
    ]
    draft.disciplines = [
      {
        key: 'auspex',
        value: 2,
        powerKeys: ['power-1'],
      },
    ]
    draft.thinBloodTraits.selections = [
      {
        definitionKey:
          'camarilla-branded',
      },
    ]
    draft.advantages.selections = [
      {
        selectionId: 'beautiful-1',
        definitionKey: 'beautiful',
        category: 'merit',
        rating: 2,
        origin: 'creation',
      },
    ]

    const source =
      structuredClone(draft)

    const request =
      mapCharacterDraftToCreateRequest(
        draft,
        {
          currentStepId: 'identity',
        },
      )

    assert.equal(
      request.chronicleId,
      null,
    )
    assert.equal(
      request.identity.concept,
      null,
    )
    assert.equal(
      request.identity.clanKey,
      null,
    )
    assert.equal(
      Object.hasOwn(
        request.identity,
        'chronicle',
      ),
      false,
    )
    assert.equal(
      request.skillSpecialties[0]
        .origin,
      null,
    )
    assert.equal(
      request.disciplines[0]
        .origin,
      null,
    )
    assert.equal(
      request.thinBloodTraits[0]
        .clanCurseDetails,
      null,
    )
    assert.equal(
      request.advantages.selections[0]
        .details,
      null,
    )
    assert.equal(
      request.humanity.stains,
      0,
    )
    assert.deepEqual(draft, source)
  },
)

test(
  '004-E.2A reconstruye el editor y separa metadatos técnicos',
  () => {
    const snapshot =
      richSnapshot()

    const state =
      mapCharacterDraftApiSnapshotToEditorState(
        snapshot,
      )

    assert.equal(
      state.characterId,
      snapshot.characterId,
    )
    assert.equal(state.revision, 7)
    assert.equal(
      state.currentStepId,
      'disciplines',
    )
    assert.equal(
      state.humanityStains,
      2,
    )
    assert.deepEqual(
      state.damage,
      snapshot.damage,
    )
    assert.equal(
      state.draft.identity.chronicle,
      '',
    )
    assert.equal(
      state.draft.identity.concept,
      '',
    )
    assert.deepEqual(
      state.draft.predatorTypeChoices,
      {
        'sandman-discipline': 0,
      },
    )
    assert.deepEqual(
      state.draft.disciplines.map(
        (discipline) => ({
          key: discipline.key,
          value: discipline.value,
          origin: discipline.origin,
          powerKeys:
            discipline.powerKeys,
        }),
      ),
      [
        {
          key: 'auspex',
          value: 2,
          origin: 'creation',
          powerKeys: [
            'auspex-heightened-senses',
            'auspex-premonition',
          ],
        },
        {
          key: 'auspex',
          value: 1,
          origin: 'predatorType',
          powerKeys: [
            'auspex-scry-the-soul',
          ],
        },
      ],
    )
    assert.equal(
      Object.hasOwn(
        state.draft
          .skillSpecialties[0],
        'origin',
      ),
      false,
    )
    assert.equal(
      Object.hasOwn(
        state.draft
          .advantages.selections[1],
        'details',
      ),
      false,
    )

    state.damage.health.superficial = 9
    state.draft.identity.name = 'Mutada'

    assert.equal(
      snapshot.damage.health.superficial,
      1,
    )
    assert.equal(
      snapshot.identity.name,
      'Alicia',
    )
  },
)

test(
  '004-E.2A conserva un round-trip editable sin perder procedencia',
  () => {
    const snapshot =
      richSnapshot()

    const state =
      mapCharacterDraftApiSnapshotToEditorState(
        snapshot,
      )

    const request =
      mapCharacterDraftToUpdateRequest(
        state.draft,
        {
          expectedRevision:
            state.revision,
          currentStepId:
            state.currentStepId,
          chronicleId:
            state.chronicleId,
          humanityStains:
            state.humanityStains,
          damage:
            state.damage,
        },
      )

    assert.equal(
      request.expectedRevision,
      7,
    )
    assert.equal(
      request.chronicleId,
      snapshot.chronicleId,
    )
    assert.deepEqual(
      request.damage,
      snapshot.damage,
    )
    assert.deepEqual(
      request.disciplines,
      snapshot.disciplines,
    )
    assert.deepEqual(
      request.skillSpecialties,
      snapshot.skillSpecialties,
    )
    assert.deepEqual(
      request.thinBloodTraits,
      snapshot.thinBloodTraits,
    )
    assert.deepEqual(
      request.advantages,
      snapshot.advantages,
    )
    assert.equal(
      request.humanityValue,
      7,
    )
    assert.equal(
      request.humanityStains,
      2,
    )
    assert.deepEqual(
      request.humanityNarrative,
      {
        convictions:
          snapshot.humanity
            .convictions,
        touchstones:
          snapshot.humanity
            .touchstones,
      },
    )
    assert.deepEqual(
      request.creation,
      {
        currentStep:
          'disciplines',
        skillDistributionMethod:
          'balanced',
        predatorTypeChoices: {
          'sandman-discipline': 0,
        },
      },
    )
  },
)

test(
  'SPEC-021 transporta la categoría etaria en create y load',
  () => {
    const draft =
      structuredClone(
        initialCharacterDraft,
      )

    draft.identity.ageCategory =
      'fledgling'

    const request =
      mapCharacterDraftToCreateRequest(
        draft,
        {
          currentStepId: 'identity',
        },
      )

    assert.equal(
      request.identity.ageCategory,
      'fledgling',
    )

    const snapshot =
      richSnapshot()

    const state =
      mapCharacterDraftApiSnapshotToEditorState(
        snapshot,
      )

    assert.equal(
      state.draft.identity.ageCategory,
      'ancilla',
    )
  },
)

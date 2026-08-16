import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterDraftRequestError,
  parseCharacterDraftIdParam,
  parseCreateCharacterDraftRequest,
  parseUpdateCharacterDraftRequest,
  toCharacterDraftResponse,
} from '../dist/characters/presentation/character-draft.dto.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function createBody() {
  return {
    chronicleId: null,
    identity: { name: 'Alicia' },
    attributes: {
      strength: 1,
      dexterity: 1,
      stamina: 1,
      charisma: 1,
      manipulation: 1,
      composure: 1,
      intelligence: 1,
      wits: 1,
      resolve: 1,
    },
    blood: {
      bloodPotency: 1,
      hunger: 1,
    },
    skills: Object.fromEntries(
      CHARACTER_SKILL_KEYS.map(
        (skillKey) => [skillKey, 0],
      ),
    ),
    skillSpecialties: [],
    disciplines: [],
    bloodSorceryRituals: { ritualKeys: [] },
    oblivionCeremonies: { ceremonyKeys: [] },
    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },
    thinBloodTraits: [],
    advantages: { selections: [] },
    humanity: {
      value: 7,
      stains: 0,
      convictions: [],
      touchstones: [],
    },
    creation: {
      currentStep: 'identity',
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
    },
  }
}

test(
  '004-D.1 crea el comando desde propietario confiable y DTO válido',
  () => {
    const body = createBody()
    const command =
      parseCreateCharacterDraftRequest(
        ownerId,
        body,
      )

    assert.equal(command.ownerId, ownerId)
    assert.equal(command.identity.name, 'Alicia')
    assert.notEqual(command, body)
  },
)

test(
  '006-D transporta Manchas separadas de Humanidad',
  () => {
    const command =
      parseUpdateCharacterDraftRequest(
        characterId,
        {
          expectedRevision: 1,
          humanityValue: 6,
          humanityStains: 2,
        },
      )

    assert.equal(command.humanityValue, 6)
    assert.equal(command.humanityStains, 2)
  },
)

test(
  '004-D.1 rechaza campos inesperados y uniones inválidas',
  () => {
    assert.throws(
      () =>
        parseCreateCharacterDraftRequest(
          ownerId,
          {
            ...createBody(),
            ownerId,
          },
        ),
      InvalidCharacterDraftRequestError,
    )

    assert.throws(
      () =>
        parseCreateCharacterDraftRequest(
          ownerId,
          {
            ...createBody(),
            advantages: {
              selections: [
                {
                  selectionId: 'mask-1',
                  definitionKey: 'mask',
                  category: 'background',
                  rating: 2,
                  origin: 'creation',
                  parentSelectionId: null,
                  details: {
                    kind: 'mask',
                    benefits: ['unsupported'],
                  },
                },
              ],
            },
          },
        ),
      /unsupported value/,
    )
  },
)

test(
  '004-D.1 valida identidad estable y revisión optimista al actualizar',
  () => {
    const command =
      parseUpdateCharacterDraftRequest(
        characterId,
        {
          expectedRevision: 4,
          identity: { concept: 'Investigadora' },
          attributes: { strength: 3 },
        },
      )

    assert.equal(command.characterId, characterId)
    assert.equal(command.expectedRevision, 4)
    assert.equal(
      parseCharacterDraftIdParam(characterId),
      characterId,
    )

    assert.throws(
      () =>
        parseUpdateCharacterDraftRequest(
          'not-a-uuid',
          { expectedRevision: 1 },
        ),
      /must be a UUID/,
    )

    assert.throws(
      () =>
        parseUpdateCharacterDraftRequest(
          characterId,
          { expectedRevision: '4' },
        ),
      /must be an integer/,
    )
  },
)

test(
  '006-C acepta el contrato completo de daño y rechaza formas ambiguas',
  () => {
    const damage = {
      health: {
        superficial: 2,
        aggravated: 1,
      },
      willpower: {
        superficial: 1,
        aggravated: 0,
      },
    }

    assert.deepEqual(
      parseUpdateCharacterDraftRequest(
        characterId,
        {
          expectedRevision: 1,
          damage,
        },
      ).damage,
      damage,
    )

    assert.throws(
      () =>
        parseUpdateCharacterDraftRequest(
          characterId,
          {
            expectedRevision: 1,
            damage: {
              ...damage,
              health: {
                superficial: 2,
              },
            },
          },
        ),
      /aggravated is required/,
    )
  },
)

test(
  '004-D.1 serializa fechas sin filtrar objetos Date al transporte',
  () => {
    const body = createBody()
    const now = new Date('2026-08-03T00:30:00.000Z')
    const draft = {
      ...body,
      characterId,
      ownerId,
      status: 'draft',
      nature: 'vampire',
      revision: 1,
      createdAt: now,
      updatedAt: now,
      creation: {
        ...body.creation,
        schemaVersion: 1,
        creationMode: 'standard',
        updatedAt: now,
      },
    }

    const response = toCharacterDraftResponse(draft)

    assert.equal(
      response.createdAt,
      '2026-08-03T00:30:00.000Z',
    )
    assert.equal(
      response.creation.updatedAt,
      '2026-08-03T00:30:00.000Z',
    )
    assert.equal(response.nature, 'vampire')
    assert.equal(
      response.creation.creationMode,
      'standard',
    )
  },
)


test(
  '004-E.1B.1 transporta y valida elecciones de Tipo de Depredador',
  () => {
    const created =
      parseCreateCharacterDraftRequest(
        ownerId,
        {
          ...createBody(),
          creation: {
            ...createBody().creation,
            predatorTypeChoices: {
              'discipline-choice': 1,
            },
          },
        },
      )

    assert.deepEqual(
      created.creation.predatorTypeChoices,
      {
        'discipline-choice': 1,
      },
    )

    const updated =
      parseUpdateCharacterDraftRequest(
        characterId,
        {
          expectedRevision: 1,
          creation: {
            predatorTypeChoices: {
              'specialty-choice': 0,
            },
          },
        },
      )

    assert.deepEqual(
      updated.creation
        .predatorTypeChoices,
      {
        'specialty-choice': 0,
      },
    )

    assert.throws(
      () =>
        parseUpdateCharacterDraftRequest(
          characterId,
          {
            expectedRevision: 1,
            creation: {
              predatorTypeChoices: {
                'discipline-choice': -1,
              },
            },
          },
        ),
      /zero or greater/,
    )
  },
)

test(
  '004-E.1B.2 transporta contribuciones por origen sin perderlas',
  () => {
    const disciplines = [
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
    ]

    const parsed =
      parseCreateCharacterDraftRequest(
        ownerId,
        {
          ...createBody(),
          disciplines,
        },
      )

    assert.deepEqual(
      parsed.disciplines,
      disciplines,
    )

    assert.throws(
      () =>
        parseCreateCharacterDraftRequest(
          ownerId,
          {
            ...createBody(),
            disciplines: [
              disciplines[0],
              {
                ...disciplines[1],
                origin: 'creation',
              },
            ],
          },
        ),
      /duplicates a Discipline contribution/,
    )
  },
)

test(
  'SPEC-021 valida categoría etaria explícita',
  () => {
    const created =
      parseCreateCharacterDraftRequest(
        ownerId,
        {
          ...createBody(),
          identity: {
            name: 'Alicia',
            ageCategory: 'ancilla',
          },
        },
      )

    assert.equal(
      created.identity.ageCategory,
      'ancilla',
    )

    const updated =
      parseUpdateCharacterDraftRequest(
        characterId,
        {
          expectedRevision: 1,
          identity: {
            ageCategory: 'elder',
          },
        },
      )

    assert.equal(
      updated.identity?.ageCategory,
      'elder',
    )

    assert.throws(
      () =>
        parseUpdateCharacterDraftRequest(
          characterId,
          {
            expectedRevision: 1,
            identity: {
              ageCategory: 'ancient',
            },
          },
        ),
      /unsupported value/,
    )
  },
)


test(
  'SPEC-057-A no expone naturaleza ni modo de creación como edición libre',
  () => {
    assert.throws(
      () =>
        parseCreateCharacterDraftRequest(
          ownerId,
          {
            ...createBody(),
            nature: 'human',
          },
        ),
      /body\.nature is not allowed/,
    )

    assert.throws(
      () =>
        parseCreateCharacterDraftRequest(
          ownerId,
          {
            ...createBody(),
            creation: {
              ...createBody().creation,
              creationMode: 'sessionZero',
            },
          },
        ),
      /body\.creation\.creationMode is not allowed/,
    )

    assert.throws(
      () =>
        parseUpdateCharacterDraftRequest(
          characterId,
          {
            expectedRevision: 1,
            nature: 'human',
          },
        ),
      /body\.nature is not allowed/,
    )

    assert.throws(
      () =>
        parseUpdateCharacterDraftRequest(
          characterId,
          {
            expectedRevision: 1,
            creation: {
              creationMode: 'sessionZero',
            },
          },
        ),
      /body\.creation\.creationMode is not allowed/,
    )
  },
)

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  adaptPersistedCharacterToSheetModel,
} from '../src/features/character-sheet/domain/persisted-character-sheet.adapter.ts'

const adapterSource = await readFile(
  new URL(
    '../src/features/character-sheet/domain/persisted-character-sheet.adapter.ts',
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
  new URL(
    '../src/main.tsx',
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
      concept: 'Investigadora',
      predatorTypeKey: 'sandman',
      ambition: null,
      clanKey: 'brujah',
      sire: null,
      desire: 'Encontrar el archivo',
      generation: 12,
    },

    creation: {
      schemaVersion: 1,
      currentStep: 'review',
      skillDistributionMethod:
        'balanced',
      predatorTypeChoices: {},
      updatedAt:
        '2026-08-04T10:00:00.000Z',
    },

    attributes: {
      ...initialCharacterDraft.attributes,
      strength: 4,
      stamina: 3,
    },

    blood: {
      bloodPotency: 2,
      hunger: 3,
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

    skills: {
      ...initialCharacterDraft.skills,
      athletics: 3,
      stealth: 2,
    },

    skillSpecialties: [
      {
        id: 'specialty-1',
        skillKey: 'athletics',
        name: 'Escalada',
        origin: null,
      },
      {
        id: 'specialty-2',
        skillKey: 'athletics',
        name: 'Carrera',
        origin: 'predatorType',
      },
    ],

    disciplines: [
      {
        disciplineKey: 'presence',
        rating: 2,
        powerKeys: [
          'presence-awe',
        ],
        origin: 'creation',
      },
      {
        disciplineKey: 'presence',
        rating: 1,
        powerKeys: [
          'presence-daunt',
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

    thinBloodTraits: [],

    advantages: {
      selections: [
        {
          selectionId: 'beautiful-1',
          definitionKey: 'beautiful',
          category: 'merit',
          rating: 2,
          origin: 'creation',
          parentSelectionId: null,
          details: null,
        },
        {
          selectionId: 'status-1',
          definitionKey: 'status',
          category: 'background',
          rating: 1,
          origin: 'predatorType',
          parentSelectionId: null,
          details: {
            kind: 'status',
            sphere: 'Camarilla',
          },
        },
      ],
    },

    humanity: {
      value: 7,
      stains: 2,
      convictions: [
        {
          convictionId: 'conviction-1',
          text:
            'Nunca abandonar a un aliado',
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
  '004-F.1 crea identidad visible desde catálogos sin exponer el UUID de Crónica',
  () => {
    const model =
      adaptPersistedCharacterToSheetModel(
        snapshot(),
      )

    assert.equal(
      model.identity.name,
      'Alicia',
    )
    assert.equal(
      model.identity.clan,
      'Brujah',
    )
    assert.equal(
      model.identity.predatorType,
      'Sandman',
    )
    assert.equal(
      model.identity.generation,
      '12ª',
    )
    assert.equal(
      model.identity.chronicle,
      '',
    )
    assert.equal(
      model.chronicleId,
      '2fc3fe58-c087-4473-b315-f072aa65efb1',
    )
    assert.equal(
      model.availability.chronicleName,
      false,
    )
  },
)

test(
  '004-F.1 proyecta Atributos Habilidades y Especialidades desde catálogos',
  () => {
    const model =
      adaptPersistedCharacterToSheetModel(
        snapshot(),
      )

    assert.deepEqual(
      model.attributes.map(
        ({ key, label }) => ({
          key,
          label,
        }),
      ),
      [
        {
          key: 'physical',
          label: 'Físicos',
        },
        {
          key: 'social',
          label: 'Sociales',
        },
        {
          key: 'mental',
          label: 'Mentales',
        },
      ],
    )

    const strength =
      model.attributes
        .flatMap(
          (category) =>
            category.attributes,
        )
        .find(
          (attribute) =>
            attribute.key === 'strength',
        )

    assert.deepEqual(
      strength,
      {
        key: 'strength',
        label: 'Fuerza',
        value: 4,
      },
    )

    const athletics =
      model.skills
        .flatMap(
          (category) =>
            category.skills,
        )
        .find(
          (skill) =>
            skill.key === 'athletics',
        )

    assert.deepEqual(
      athletics,
      {
        key: 'athletics',
        label: 'Atletismo',
        value: 3,
        specialties: [
          'Escalada',
          'Carrera',
        ],
      },
    )
  },
)

test(
  '004-F.1 suma contribuciones de Disciplina antes de construir su lectura',
  () => {
    const model =
      adaptPersistedCharacterToSheetModel(
        snapshot(),
      )

    assert.equal(
      model.disciplines.length,
      1,
    )
    assert.equal(
      model.disciplines[0].key,
      'presence',
    )
    assert.equal(
      model.disciplines[0].name,
      'Presencia',
    )
    assert.equal(
      model.disciplines[0].value,
      3,
    )
    assert.deepEqual(
      model.disciplines[0].powers.map(
        (power) => power.key,
      ),
      [
        'presence-awe',
        'presence-daunt',
      ],
    )
  },
)

test(
  '004-F.1 reutiliza el modelo canónico de Ventajas y conserva narrativa y estado',
  () => {
    const model =
      adaptPersistedCharacterToSheetModel(
        snapshot(),
      )

    assert.equal(
      model.advantages.advantages[0].name,
      'Bello',
    )
    assert.equal(
      model.advantages.backgrounds[0].name,
      'Estatus',
    )
    assert.equal(
      model.advantages.backgrounds[0].detail,
      'Camarilla',
    )

    assert.deepEqual(
      model.state,
      {
        humanity: {
          value: 7,
          stains: 2,
        },
        hunger: 3,
        bloodPotency: 2,
      },
    )

    assert.deepEqual(
      model.damage,
      {
        health: {
          superficial: 1,
          aggravated: 0,
        },
        healthCapacity: 6,
        willpower: {
          superficial: 0,
          aggravated: 1,
        },
        willpowerCapacity: 2,
      },
    )

    assert.deepEqual(
      model.narrative,
      {
        convictions: [
          {
            key: 'conviction-1',
            text:
              'Nunca abandonar a un aliado',
          },
        ],
        touchstones: [
          {
            key: 'touchstone-1',
            name: 'Lucía',
            relation: 'Hermana',
          },
        ],
        notes: '',
      },
    )

    assert.equal(
      model.availability.bloodExperience,
      false,
    )
  },
)

test(
  '004-F.1 entrega un modelo independiente y mantiene la ficha demo desacoplada',
  () => {
    const source = snapshot()
    const model =
      adaptPersistedCharacterToSheetModel(
        source,
      )

    model.identity.name = 'Mutada'
    model.damage.health.superficial = 9

    assert.equal(
      source.identity.name,
      'Alicia',
    )
    assert.equal(
      source.damage.health.superficial,
      1,
    )

    assert.doesNotMatch(
      adapterSource,
      /\bCharacterDraft\b/,
    )
    assert.doesNotMatch(
      adapterSource,
      /demo-/,
    )

    assert.match(
      sheetSource,
      /demoCharacter/,
    )
    assert.match(
      sheetSource,
      /demoState/,
    )
    assert.match(
      mainSource,
      /<PersistedCharacterSheet[\s\S]{0,180}characterId=/,
    )
  },
)

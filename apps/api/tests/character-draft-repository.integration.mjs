import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaCharacterDraftRepository,
} from '../dist/characters/infrastructure/prisma-character-draft.repository.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function createSkills(overrides = {}) {
  return {
    ...Object.fromEntries(
      CHARACTER_SKILL_KEYS.map(
        (skillKey) => [skillKey, 0],
      ),
    ),
    ...overrides,
  }
}


async function createTestOwner(
  database,
  ownerId,
) {
  await database.user.create({
    data: {
      id: ownerId,
      username: `character-test-${ownerId}`,
      displayName: 'Character integration owner',
      passwordHash: 'integration-test-only',
    },
  })
}

test(
  '004-D.2 persiste con acceso aislado por propietario',
  async () => {
    const database = new DatabaseService()
    const repository =
      new PrismaCharacterDraftRepository(
        database,
      )
    const ownerId = randomUUID()
    let characterId = null

    await database.$connect()

    try {
      await createTestOwner(
        database,
        ownerId,
      )

      const created = await repository.create({
        ownerId,
        chronicleId: null,
        identity: {
          name: 'Borrador 004-C',
        },
        attributes: {
          strength: 1,
          dexterity: 2,
          stamina: 3,
          charisma: 2,
          manipulation: 2,
          composure: 3,
          intelligence: 4,
          wits: 2,
          resolve: 3,
        },
        blood: {
          bloodPotency: 1,
          hunger: 1,
        },
        skills: createSkills({
          athletics: 2,
          investigation: 3,
        }),
        skillSpecialties: [
          {
            id: 'specialty-004-c-3',
            skillKey: 'investigation',
            name: 'Escenas del crimen',
            origin: 'creation',
          },
        ],
        disciplines: [
          {
            disciplineKey: 'auspex',
            rating: 2,
            powerKeys: [
              'heightened-senses',
              'premonition',
            ],
            origin: 'creation',
          },
        ],
        bloodSorceryRituals: {
          ritualKeys: ['wake-with-evenings-freshness'],
        },
        oblivionCeremonies: {
          ceremonyKeys: ['the-binding-fetter'],
        },
        thinBloodAlchemy: {
          rating: 1,
          method: 'fixatio',
          formulaKeys: ['far-reach'],
        },
        thinBloodTraits: [
          {
            definitionKey: 'clan-curse',
            clanCurseDetails: {
              clanKey: 'brujah',
            },
            disciplineAffinityDetails: null,
          },
          {
            definitionKey: 'discipline-affinity',
            clanCurseDetails: null,
            disciplineAffinityDetails: {
              disciplineKey: 'auspex',
              powerKey: 'heightened-senses',
            },
          },
        ],
        advantages: {
          selections: [
            {
              selectionId: 'haven-1',
              definitionKey: 'haven',
              category: 'background',
              rating: 2,
              origin: 'creation',
              parentSelectionId: null,
              details: {
                kind: 'haven',
                identity: 'Almacén del puerto',
              },
            },
            {
              selectionId: 'haunted-1',
              definitionKey: 'haven-haunted',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              parentSelectionId: 'haven-1',
              details: null,
            },
          ],
        },
        humanity: {
          value: 7,
          stains: 0,
          touchstones: [
            {
              touchstoneId: 'touchstone-004-c-4',
              name: 'Elena',
              relationship: 'Hermana mortal',
            },
          ],
          convictions: [
            {
              convictionId: 'conviction-004-c-4',
              text: 'Protege a tu familia',
              touchstoneId: 'touchstone-004-c-4',
            },
          ],
        },
        creation: {
          currentStep: 'identity',
          skillDistributionMethod: 'balanced',
        },
      })

      characterId = created.characterId

      assert.equal(created.status, 'draft')
      assert.equal(created.nature, 'vampire')
      assert.equal(
        created.creation.creationMode,
        'standard',
      )
      assert.equal(created.revision, 1)
      assert.equal(created.attributes.intelligence, 4)
      assert.equal(created.blood.hunger, 1)
      assert.deepEqual(created.damage, {
        health: {
          superficial: 0,
          aggravated: 0,
        },
        willpower: {
          superficial: 0,
          aggravated: 0,
        },
      })
      assert.equal(created.skills.investigation, 3)
      assert.equal(
        created.skillSpecialties[0]?.name,
        'Escenas del crimen',
      )
      assert.equal(created.humanity.value, 7)
      assert.equal(created.humanity.stains, 0)
      assert.deepEqual(created.disciplines, [
        {
          disciplineKey: 'auspex',
          rating: 2,
          powerKeys: [
            'heightened-senses',
            'premonition',
          ],
          origin: 'creation',
        },
      ])
      assert.deepEqual(
        created.bloodSorceryRituals.ritualKeys,
        ['wake-with-evenings-freshness'],
      )
      assert.deepEqual(
        created.oblivionCeremonies.ceremonyKeys,
        ['the-binding-fetter'],
      )
      assert.deepEqual(created.thinBloodAlchemy, {
        rating: 1,
        method: 'fixatio',
        formulaKeys: ['far-reach'],
      })
      assert.equal(
        created.thinBloodTraits[0]
          ?.clanCurseDetails?.clanKey,
        'brujah',
      )
      assert.equal(
        created.thinBloodTraits[1]
          ?.disciplineAffinityDetails?.disciplineKey,
        'auspex',
      )
      assert.equal(
        created.advantages.selections.find(
          (selection) =>
            selection.selectionId === 'haunted-1',
        )?.parentSelectionId,
        'haven-1',
      )
      assert.deepEqual(
        created.advantages.selections.find(
          (selection) =>
            selection.selectionId === 'haven-1',
        )?.details,
        {
          kind: 'haven',
          identity: 'Almacén del puerto',
        },
      )
      assert.equal(
        created.humanity.convictions[0]
          ?.touchstoneId,
        'touchstone-004-c-4',
      )

      const loaded =
        await repository.findById(
          ownerId,
          characterId,
        )

      assert.equal(
        loaded?.identity.name,
        'Borrador 004-C',
      )

      assert.equal(
        await repository.findById(
          randomUUID(),
          characterId,
        ),
        null,
      )

      await assert.rejects(
        repository.update(randomUUID(), {
          characterId,
          expectedRevision: 1,
          identity: { name: 'Intruso' },
        }),
        {
          name: 'CharacterDraftWriteConflictError',
        },
      )

      const updated = await repository.update(ownerId, {
        characterId,
        expectedRevision: 1,
        identity: {
          concept: 'Prueba de persistencia',
        },
        creation: {
          currentStep: 'attributes',
        },
        attributes: {
          strength: 4,
        },
        blood: {
          hunger: 2,
        },
        damage: {
          health: {
            superficial: 2,
            aggravated: 1,
          },
          willpower: {
            superficial: 1,
            aggravated: 0,
          },
        },
        skills: {
          investigation: 4,
        },
        skillSpecialties: [
          {
            id: 'specialty-004-c-3-updated',
            skillKey: 'investigation',
            name: 'Forense',
            origin: null,
          },
        ],
        disciplines: [
          {
            disciplineKey: 'obfuscate',
            rating: 1,
            powerKeys: ['cloak-of-shadows'],
            origin: 'predatorType',
          },
        ],
        bloodSorceryRituals: {
          ritualKeys: ['blood-walk'],
        },
        oblivionCeremonies: {
          ceremonyKeys: ['summon-spirit'],
        },
        thinBloodAlchemy: {
          rating: 2,
          method: 'calcinatio',
          formulaKeys: ['haze'],
        },
        thinBloodTraits: [
          {
            definitionKey: 'day-drinker',
            clanCurseDetails: null,
            disciplineAffinityDetails: null,
          },
        ],
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
                identity: 'Lucía Varela',
                benefits: ['erased', 'tailor'],
              },
            },
          ],
        },
        humanityValue: 6,
        humanityStains: 2,
        humanityNarrative: {
          touchstones: [
            {
              touchstoneId:
                'touchstone-004-c-4-updated',
              name: 'Marcos',
              relationship: 'Amigo de infancia',
            },
          ],
          convictions: [
            {
              convictionId:
                'conviction-004-c-4-updated',
              text: 'No abandones a los tuyos',
              touchstoneId:
                'touchstone-004-c-4-updated',
            },
          ],
        },
      })

      assert.equal(updated.revision, 2)
      assert.equal(
        updated.identity.concept,
        'Prueba de persistencia',
      )
      assert.equal(
        updated.creation.currentStep,
        'attributes',
      )
      assert.equal(updated.attributes.strength, 4)
      assert.equal(updated.blood.hunger, 2)
      assert.deepEqual(updated.damage, {
        health: {
          superficial: 2,
          aggravated: 1,
        },
        willpower: {
          superficial: 1,
          aggravated: 0,
        },
      })
      assert.equal(updated.skills.investigation, 4)
      assert.deepEqual(
        updated.skillSpecialties.map(
          ({ name, origin }) => ({ name, origin }),
        ),
        [{ name: 'Forense', origin: null }],
      )
      assert.equal(updated.humanity.value, 6)
      assert.equal(updated.humanity.stains, 2)
      assert.deepEqual(updated.disciplines, [
        {
          disciplineKey: 'obfuscate',
          rating: 1,
          powerKeys: ['cloak-of-shadows'],
          origin: 'predatorType',
        },
      ])
      assert.deepEqual(
        updated.bloodSorceryRituals.ritualKeys,
        ['blood-walk'],
      )
      assert.deepEqual(
        updated.oblivionCeremonies.ceremonyKeys,
        ['summon-spirit'],
      )
      assert.deepEqual(updated.thinBloodAlchemy, {
        rating: 2,
        method: 'calcinatio',
        formulaKeys: ['haze'],
      })
      assert.deepEqual(
        updated.thinBloodTraits.map(
          (trait) => trait.definitionKey,
        ),
        ['day-drinker'],
      )
      assert.deepEqual(
        updated.advantages.selections,
        [
          {
            selectionId: 'mask-1',
            definitionKey: 'mask',
            category: 'background',
            rating: 2,
            origin: 'creation',
            parentSelectionId: null,
            details: {
              kind: 'mask',
              identity: 'Lucía Varela',
              benefits: ['erased', 'tailor'],
            },
          },
        ],
      )
      assert.equal(
        updated.humanity.touchstones[0]?.name,
        'Marcos',
      )
      assert.equal(
        updated.humanity.convictions[0]
          ?.touchstoneId,
        'touchstone-004-c-4-updated',
      )

      await assert.rejects(
        repository.update(ownerId, {
          characterId,
          expectedRevision: 1,
          identity: { name: 'Obsoleto' },
        }),
        {
          name: 'CharacterDraftWriteConflictError',
        },
      )

      await assert.rejects(
        repository.transitionLifecycle(
          randomUUID(),
          {
            characterId,
            expectedRevision: 2,
            expectedStatus: 'draft',
            nextStatus: 'active',
          },
        ),
        {
          name:
            'CharacterLifecycleWriteConflictError',
        },
      )

      const activated =
        await repository.transitionLifecycle(
          ownerId,
          {
            characterId,
            expectedRevision: 2,
            expectedStatus: 'draft',
            nextStatus: 'active',
          },
        )

      assert.equal(activated.status, 'active')
      assert.equal(activated.revision, 3)

      await assert.rejects(
        repository.transitionLifecycle(ownerId, {
          characterId,
          expectedRevision: 2,
          expectedStatus: 'draft',
          nextStatus: 'active',
        }),
        {
          name:
            'CharacterLifecycleWriteConflictError',
        },
      )
    } finally {
      if (characterId !== null) {
        await database.character.delete({
          where: { id: characterId },
        })
      }

      await database.user.deleteMany({
        where: { id: ownerId },
      })

      await database.$disconnect()
    }
  },
)

test(
  '004-E.1B.2 conserva dos contribuciones de la misma Disciplina',
  async () => {
    const database = new DatabaseService()
    const repository =
      new PrismaCharacterDraftRepository(
        database,
      )
    const ownerId = randomUUID()
    let characterId = null

    await database.$connect()

    try {
      await createTestOwner(
        database,
        ownerId,
      )

      const created = await repository.create({
        ownerId,
        chronicleId: null,
        identity: {
          name: 'Solapamiento 004-E',
          predatorTypeKey: 'sandman',
        },
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
        skills: createSkills(),
        skillSpecialties: [],
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
        creation: {
          currentStep: 'identity',
          skillDistributionMethod: 'balanced',
          predatorTypeChoices: {
            'discipline-choice': 0,
          },
        },
      })

      characterId = created.characterId

      assert.deepEqual(
        created.disciplines,
        [
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
      )

      const loaded =
        await repository.findById(
          ownerId,
          characterId,
        )

      assert.deepEqual(
        loaded?.disciplines,
        created.disciplines,
      )
    } finally {
      if (characterId !== null) {
        await database.character.delete({
          where: { id: characterId },
        })
      }

      await database.user.deleteMany({
        where: { id: ownerId },
      })

      await database.$disconnect()
    }
  },
)

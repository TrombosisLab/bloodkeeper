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

test(
  '004-C persiste, carga y actualiza un borrador de forma atómica',
  async () => {
    const database = new DatabaseService()
    const repository =
      new PrismaCharacterDraftRepository(
        database,
      )
    let characterId = null

    await database.$connect()

    try {
      const created = await repository.create({
        ownerId: randomUUID(),
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
        humanity: {
          value: 7,
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
      assert.equal(created.revision, 1)
      assert.equal(created.attributes.intelligence, 4)
      assert.equal(created.blood.hunger, 1)
      assert.equal(created.skills.investigation, 3)
      assert.equal(
        created.skillSpecialties[0]?.name,
        'Escenas del crimen',
      )
      assert.equal(created.humanity.value, 7)
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
        created.humanity.convictions[0]
          ?.touchstoneId,
        'touchstone-004-c-4',
      )

      const loaded =
        await repository.findById(characterId)

      assert.equal(
        loaded?.identity.name,
        'Borrador 004-C',
      )

      const updated = await repository.update({
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
        humanityValue: 6,
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
      assert.equal(updated.skills.investigation, 4)
      assert.deepEqual(
        updated.skillSpecialties.map(
          ({ name, origin }) => ({ name, origin }),
        ),
        [{ name: 'Forense', origin: null }],
      )
      assert.equal(updated.humanity.value, 6)
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
        repository.update({
          characterId,
          expectedRevision: 1,
          identity: { name: 'Obsoleto' },
        }),
        {
          name: 'CharacterDraftWriteConflictError',
        },
      )
    } finally {
      if (characterId !== null) {
        await database.character.delete({
          where: { id: characterId },
        })
      }

      await database.$disconnect()
    }
  },
)

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

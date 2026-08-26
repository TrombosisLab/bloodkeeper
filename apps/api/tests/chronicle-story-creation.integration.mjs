import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaAuthUserRepository,
} from '../dist/auth/infrastructure/prisma-auth-user.repository.js'

import {
  ScryptPasswordHasher,
} from '../dist/auth/infrastructure/scrypt-password-hasher.js'

const api =
  'http://127.0.0.1:3000'

async function login(
  username,
  password,
) {
  const response =
    await fetch(
      `${api}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      },
    )

  assert.equal(response.status, 200)
  const setCookie =
    response.headers.get('set-cookie')
  assert.ok(setCookie)
  return setCookie.split(';')[0]
}

test(
  'SPEC-060 crea una Historia con sus cinco hitos por HTTP',
  async () => {
    const database =
      new DatabaseService()
    const users =
      new PrismaAuthUserRepository(
        database,
      )
    const passwords =
      new ScryptPasswordHasher()
    const suffix = randomUUID()
    const username =
      `story-create-${suffix}`
    const password =
      'story-create-integration-password'

    await database.$connect()

    const narrator =
      await users.create({
        username,
        displayName:
          'Narrador Historia integracion',
        passwordHash:
          await passwords.hash(password),
        status: 'active',
        roles: [
          'narrator',
          'player',
        ],
      })

    let chronicleId = null

    try {
      const cookie =
        await login(username, password)
      const chronicleResponse =
        await fetch(
          `${api}/chronicles`,
          {
            method: 'POST',
            headers: {
              Cookie: cookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              name:
                `Cronica Historia ${suffix}`,
              description:
                'Integracion SPEC-060.',
            }),
          },
        )

      assert.equal(
        chronicleResponse.status,
        201,
      )
      const chronicle =
        await chronicleResponse.json()
      chronicleId = chronicle.id

      const storyResponse =
        await fetch(
          `${api}/chronicles/${chronicleId}/stories`,
          {
            method: 'POST',
            headers: {
              Cookie: cookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              title:
                'La noche de la prueba',
              type: 'main_arc',
              premise: null,
              stakes: null,
              narratorNotes: null,
              sharedSummary: null,
              visibility:
                'narrator_only',
            }),
          },
        )

      const storyText =
        await storyResponse.text()
      assert.equal(
        storyResponse.status,
        201,
        storyText,
      )
      const story = JSON.parse(storyText)

      assert.equal(
        story.chronicleId,
        chronicleId,
      )
      assert.equal(
        story.title,
        'La noche de la prueba',
      )
      assert.equal(story.type, 'main_arc')
      assert.equal(story.status, 'planned')
      assert.equal(story.revision, 1)
      assert.deepEqual(
        story.milestones.map(
          (milestone) => milestone.key,
        ),
        [
          'hook',
          'first_turn',
          'revelation',
          'climax',
          'resolution',
        ],
      )
      assert.deepEqual(
        story.progress,
        {
          completed: 0,
          total: 5,
          percentage: 0,
        },
      )

      const persisted =
        await database.chronicleStory
          .findUnique({
            where: {
              id: story.id,
            },
            include: {
              milestones: {
                orderBy: {
                  sortOrder: 'asc',
                },
              },
            },
          })

      assert.ok(persisted)
      assert.equal(
        persisted.chronicleId,
        chronicleId,
      )
      assert.equal(
        persisted.milestones.length,
        5,
      )
      assert.equal(
        persisted.milestones.every(
          (milestone) =>
            milestone.chronicleId ===
              chronicleId,
        ),
        true,
      )
    } finally {
      if (chronicleId !== null) {
        await database
          .chronicleStoryCompletionOperation
          .deleteMany({
            where: {
              story: { chronicleId },
            },
          })
        await database.chronicleStorySession
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleStoryEvent
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleStoryCharacter
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleStoryNpc
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleStoryLocation
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleStoryReminder
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleStoryMilestone
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleStory
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicleParticipant
          .deleteMany({
            where: { chronicleId },
          })
        await database.chronicle
          .deleteMany({
            where: { id: chronicleId },
          })
      }

      await database.user.deleteMany({
        where: { id: narrator.id },
      })
      await database.$disconnect()
    }
  },
)

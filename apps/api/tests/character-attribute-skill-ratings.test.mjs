import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LoadCharacterAttributeSkillRatingsUseCase,
} from '../dist/characters/application/load-character-attribute-skill-ratings.use-case.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function repository() {
  const calls = []
  const draft = {
    characterId,
    revision: 7,
    attributes: {
      strength: 4,
      dexterity: 3,
    },
    skills: {
      athletics: 2,
      investigation: 3,
    },
    identity: {
      name: 'No debe exponerse',
    },
    humanity: {
      value: 7,
    },
  }

  return {
    calls,
    draft,
    async findById(owner, id) {
      calls.push(['findById', owner, id])

      return owner === ownerId &&
        id === characterId
        ? draft
        : null
    },
  }
}

test(
  '005-B expone solo puntuaciones autorizadas',
  async () => {
    const source = repository()
    const useCase =
      new LoadCharacterAttributeSkillRatingsUseCase(
        source,
      )

    const ratings = await useCase.execute(
      ownerId,
      characterId,
    )

    assert.deepEqual(
      Object.keys(ratings),
      [
        'characterId',
        'revision',
        'attributes',
        'skills',
      ],
    )
    assert.equal(ratings.attributes.strength, 4)
    assert.equal(ratings.skills.investigation, 3)
    assert.deepEqual(source.calls, [
      ['findById', ownerId, characterId],
    ])
  },
)

test(
  '005-B mantiene aislada la proyeccion de lectura',
  async () => {
    const source = repository()
    const useCase =
      new LoadCharacterAttributeSkillRatingsUseCase(
        source,
      )
    const ratings = await useCase.execute(
      ownerId,
      characterId,
    )

    assert.throws(
      () => {
        ratings.attributes.strength = 1
      },
      TypeError,
    )
    assert.equal(source.draft.attributes.strength, 4)
  },
)

test(
  '005-B no revela personajes ajenos o ausentes',
  async () => {
    const source = repository()
    const useCase =
      new LoadCharacterAttributeSkillRatingsUseCase(
        source,
      )

    assert.equal(
      await useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        characterId,
      ),
      null,
    )
  },
)

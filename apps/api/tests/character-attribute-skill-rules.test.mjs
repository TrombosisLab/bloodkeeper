import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertValidCharacterAttributeSkillState,
} from '../dist/characters/domain/character-attribute-skill.rules.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function attributes() {
  return {
    strength: 4,
    dexterity: 3,
    stamina: 3,
    charisma: 3,
    manipulation: 2,
    composure: 2,
    intelligence: 2,
    wits: 2,
    resolve: 1,
  }
}

function skills() {
  const ratings = [
    ...Array(7).fill(1),
    ...Array(5).fill(2),
    ...Array(3).fill(3),
  ]

  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (key, index) => [
        key,
        ratings[index] ?? 0,
      ],
    ),
  )
}

function emptySkills() {
  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (key) => [key, 0],
    ),
  )
}

function completeSpecialties() {
  return [
    {
      id: 'creation-free',
      skillKey: 'drive',
      name: 'Motocicletas',
      origin: 'creation',
    },
    {
      id: 'creation-craft',
      skillKey: 'craft',
      name: 'Carpintería',
      origin: 'creation',
    },
    {
      id: 'creation-performance',
      skillKey: 'performance',
      name: 'Canto',
      origin: 'creation',
    },
  ]
}

function violations(action) {
  let error = null

  try {
    action()
  } catch (caught) {
    error = caught
  }

  assert.equal(
    error?.name,
    'InvalidCharacterAttributeSkillStateError',
  )

  return error.violations
}

test(
  '005-A acepta la distribucion equilibrada vigente',
  () => {
    assert.doesNotThrow(() =>
      assertValidCharacterAttributeSkillState(
        attributes(),
        skills(),
        'balanced',
        'blood',
        completeSpecialties(),
      ),
    )
  },
)

test(
  '005-A permite guardar fases aun incompletas',
  () => {
    const initialAttributes = Object.fromEntries(
      Object.keys(attributes()).map(
        (key) => [key, 1],
      ),
    )

    assert.doesNotThrow(() =>
      assertValidCharacterAttributeSkillState(
        initialAttributes,
        emptySkills(),
        'balanced',
        'identity',
        [],
      ),
    )
  },
)

test(
  '005-A rechaza valores y distribuciones de atributos invalidos',
  () => {
    const state = attributes()
    state.strength = 5

    assert.deepEqual(
      violations(() =>
        assertValidCharacterAttributeSkillState(
          state,
          skills(),
          'balanced',
          'skills',
          [],
        ),
      ),
      [
        'ATTRIBUTE_RATING_OUT_OF_RANGE',
        'ATTRIBUTE_DISTRIBUTION_INVALID',
      ],
    )
  },
)

test(
  '005-A rechaza valores y distribuciones de habilidades invalidos',
  () => {
    const state = skills()
    state.athletics = -1

    assert.deepEqual(
      violations(() =>
        assertValidCharacterAttributeSkillState(
          attributes(),
          state,
          'balanced',
          'blood',
          completeSpecialties(),
        ),
      ),
      [
        'SKILL_RATING_OUT_OF_RANGE',
        'SKILL_DISTRIBUTION_INVALID',
      ],
    )
  },
)

test(
  '005-A vincula especialidades a habilidades adquiridas',
  () => {
    const state = skills()

    assert.deepEqual(
      violations(() =>
        assertValidCharacterAttributeSkillState(
          attributes(),
          state,
          'balanced',
          'blood',
          [
            ...completeSpecialties(),
            {
              id: 'specialty-1',
              skillKey: 'technology',
              name: '   ',
              origin: 'predatorType',
            },
            {
              id: 'specialty-2',
              skillKey: 'athletics',
              name: 'Carrera',
              origin: 'predatorType',
            },
            {
              id: 'specialty-3',
              skillKey: 'athletics',
              name: ' carrera ',
              origin: 'predatorType',
            },
          ],
        ),
      ),
      [
        'SKILL_SPECIALTY_EMPTY',
        'SKILL_SPECIALTY_WITH_ZERO_RATING',
        'SKILL_SPECIALTY_DUPLICATE',
      ],
    )
  },
)

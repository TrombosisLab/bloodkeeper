import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterAttributeSkillState,
} from '../dist/characters/domain/character-attribute-skill.rules.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const automatic = new Set([
  'academics',
  'craft',
  'performance',
  'science',
])

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

function balancedSkills(
  requiredKeys = [],
) {
  const keys = [
    ...requiredKeys,
    ...CHARACTER_SKILL_KEYS.filter(
      (key) =>
        !requiredKeys.includes(key) &&
        !automatic.has(key),
    ),
  ]

  const ratings = [
    ...Array(7).fill(1),
    ...Array(5).fill(2),
    ...Array(3).fill(3),
  ]

  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (key) => [key, 0],
    ).map(([key], index) => {
      const selectedIndex =
        keys.indexOf(key)

      return [
        key,
        selectedIndex >= 0
          ? ratings[selectedIndex] ?? 0
          : 0,
      ]
    }),
  )
}

function specialty(
  id,
  skillKey,
  name,
  origin = 'creation',
) {
  return {
    id,
    skillKey,
    name,
    origin,
  }
}

function validate(
  skills,
  specialties,
  currentStep = 'review',
) {
  return validateCharacterAttributeSkillState(
    attributes(),
    skills,
    'balanced',
    currentStep,
    specialties,
  )
}

test(
  '003-L backend exige una Especialidad libre al completar Habilidades',
  () => {
    const skills = balancedSkills()

    assert.deepEqual(
      validate(skills, []),
      [
        'SKILL_SPECIALTY_CREATION_COUNT_INCOMPLETE',
      ],
    )

    assert.deepEqual(
      validate(
        skills,
        [
          specialty(
            'free',
            'athletics',
            'Carrera',
          ),
        ],
      ),
      [],
    )
  },
)

test(
  '003-L backend rechaza Especialidades de creación por encima del cupo',
  () => {
    const skills = balancedSkills()

    assert.deepEqual(
      validate(
        skills,
        [
          specialty(
            'one',
            'athletics',
            'Carrera',
          ),
          specialty(
            'two',
            'brawl',
            'Agarres',
          ),
        ],
        'skills',
      ),
      [
        'SKILL_SPECIALTY_CREATION_LIMIT_EXCEEDED',
      ],
    )
  },
)

test(
  '003-L backend exige Academicismo, Artesanía, Ciencia e Interpretación activas',
  () => {
    const skills =
      balancedSkills([
        'academics',
        'craft',
        'science',
        'performance',
      ])

    const complete = [
      specialty(
        'free',
        'athletics',
        'Carrera',
      ),
      specialty(
        'academics',
        'academics',
        'Historia',
      ),
      specialty(
        'craft',
        'craft',
        'Carpintería',
      ),
      specialty(
        'science',
        'science',
        'Química',
      ),
      specialty(
        'performance',
        'performance',
        'Canto',
      ),
    ]

    assert.deepEqual(
      validate(skills, complete),
      [],
    )

    const missing = [
      ...complete.filter(
        ({ skillKey }) =>
          skillKey !== 'science',
      ),
      specialty(
        'extra-free',
        'brawl',
        'Agarres',
      ),
    ]

    assert.deepEqual(
      validate(skills, missing),
      [
        'SKILL_SPECIALTY_REQUIRED_MISSING',
      ],
    )
  },
)

test(
  '003-L backend no cuenta Especialidades del Tipo de Depredador',
  () => {
    const skills = balancedSkills()

    assert.deepEqual(
      validate(
        skills,
        [
          specialty(
            'free',
            'athletics',
            'Carrera',
          ),
          specialty(
            'predator',
            'brawl',
            'Vástagos',
            'predatorType',
          ),
        ],
      ),
      [],
    )
  },
)

test(
  '003-L backend trata el origen legado nulo como creación',
  () => {
    const skills = balancedSkills()

    assert.deepEqual(
      validate(
        skills,
        [
          specialty(
            'legacy',
            'athletics',
            'Carrera',
            null,
          ),
        ],
      ),
      [],
    )
  },
)

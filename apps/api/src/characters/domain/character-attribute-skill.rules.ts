import {
  CHARACTER_ATTRIBUTE_KEYS,
  CHARACTER_SKILL_KEYS,
} from './persisted-character.types'

import type {
  PersistedCharacterAttributes,
  PersistedCharacterSkills,
  PersistedCharacterSkillSpecialty,
  CharacterCreationStep,
  SkillDistributionMethod,
} from './persisted-character.types'

export type CharacterAttributeSkillViolation =
  | 'ATTRIBUTE_RATING_OUT_OF_RANGE'
  | 'ATTRIBUTE_DISTRIBUTION_INVALID'
  | 'SKILL_RATING_OUT_OF_RANGE'
  | 'SKILL_DISTRIBUTION_INVALID'
  | 'SKILL_SPECIALTY_EMPTY'
  | 'SKILL_SPECIALTY_WITH_ZERO_RATING'
  | 'SKILL_SPECIALTY_DUPLICATE'
  | 'SKILL_SPECIALTY_CREATION_LIMIT_EXCEEDED'
  | 'SKILL_SPECIALTY_CREATION_COUNT_INCOMPLETE'
  | 'SKILL_SPECIALTY_REQUIRED_MISSING'

export class InvalidCharacterAttributeSkillStateError
  extends Error {
  readonly violations:
    CharacterAttributeSkillViolation[]

  constructor(
    violations:
      CharacterAttributeSkillViolation[],
  ) {
    super('Character attributes or skills are invalid')
    this.name =
      'InvalidCharacterAttributeSkillStateError'
    this.violations = violations
  }
}

const attributeDistribution = {
  1: 1,
  2: 4,
  3: 3,
  4: 1,
} as const

const skillDistributions = {
  generalist: {
    1: 10,
    2: 8,
    3: 1,
    4: 0,
  },
  balanced: {
    1: 7,
    2: 5,
    3: 3,
    4: 0,
  },
  specialist: {
    1: 3,
    2: 3,
    3: 3,
    4: 1,
  },
} as const

function countRating(
  values: number[],
  rating: number,
): number {
  return values.filter(
    (value) => value === rating,
  ).length
}

function validateAttributes(
  attributes: PersistedCharacterAttributes,
  requireCompleteDistribution: boolean,
): CharacterAttributeSkillViolation[] {
  const values = CHARACTER_ATTRIBUTE_KEYS.map(
    (key) => attributes[key],
  )
  const violations:
    CharacterAttributeSkillViolation[] = []

  if (
    values.some(
      (value) =>
        !Number.isInteger(value) ||
        value < 1 ||
        value > 4,
    )
  ) {
    violations.push(
      'ATTRIBUTE_RATING_OUT_OF_RANGE',
    )
  }

  const distributionValid =
    ([1, 2, 3, 4] as const).every(
      (rating) =>
        countRating(values, rating) ===
        attributeDistribution[rating],
    )

  if (
    requireCompleteDistribution &&
    !distributionValid
  ) {
    violations.push(
      'ATTRIBUTE_DISTRIBUTION_INVALID',
    )
  }

  return violations
}

function validateSkills(
  skills: PersistedCharacterSkills,
  method: SkillDistributionMethod,
  requireCompleteDistribution: boolean,
): CharacterAttributeSkillViolation[] {
  const values = CHARACTER_SKILL_KEYS.map(
    (key) => skills[key],
  )
  const violations:
    CharacterAttributeSkillViolation[] = []

  if (
    values.some(
      (value) =>
        !Number.isInteger(value) ||
        value < 0 ||
        value > 4,
    )
  ) {
    violations.push(
      'SKILL_RATING_OUT_OF_RANGE',
    )
  }

  const required = skillDistributions[method]
  const distributionValid =
    ([1, 2, 3, 4] as const).every(
      (rating) =>
        countRating(values, rating) ===
        required[rating],
    )

  if (
    requireCompleteDistribution &&
    !distributionValid
  ) {
    violations.push(
      'SKILL_DISTRIBUTION_INVALID',
    )
  }

  return violations
}

const creationSpecialtySkillKeys = [
  'academics',
  'craft',
  'performance',
  'science',
] as const satisfies readonly (
  typeof CHARACTER_SKILL_KEYS[number]
)[]

function validateSpecialties(
  skills: PersistedCharacterSkills,
  specialties:
    PersistedCharacterSkillSpecialty[],
  requireCompleteCreation: boolean,
): CharacterAttributeSkillViolation[] {
  const violations:
    CharacterAttributeSkillViolation[] = []
  const identities = new Set<string>()

  for (const specialty of specialties) {
    const normalized = specialty.name
      .trim()
      .replace(/\s+/g, ' ')

    if (normalized.length === 0) {
      violations.push('SKILL_SPECIALTY_EMPTY')
    }

    if (skills[specialty.skillKey] === 0) {
      violations.push(
        'SKILL_SPECIALTY_WITH_ZERO_RATING',
      )
    }

    const identity = [
      specialty.skillKey,
      normalized.toLocaleLowerCase(),
    ].join(':')

    if (identities.has(identity)) {
      violations.push('SKILL_SPECIALTY_DUPLICATE')
    }

    identities.add(identity)
  }

  const creationSpecialties =
    specialties.filter(
      (specialty) =>
        specialty.origin !== 'predatorType',
    )

  const mandatorySkillKeys =
    creationSpecialtySkillKeys.filter(
      (skillKey) => skills[skillKey] > 0,
    )

  const requiredCreationCount =
    1 + mandatorySkillKeys.length

  if (
    creationSpecialties.length >
    requiredCreationCount
  ) {
    violations.push(
      'SKILL_SPECIALTY_CREATION_LIMIT_EXCEEDED',
    )
  }

  if (
    requireCompleteCreation &&
    creationSpecialties.length <
      requiredCreationCount
  ) {
    violations.push(
      'SKILL_SPECIALTY_CREATION_COUNT_INCOMPLETE',
    )
  }

  if (
    requireCompleteCreation &&
    mandatorySkillKeys.some(
      (skillKey) =>
        !creationSpecialties.some(
          (specialty) =>
            specialty.skillKey === skillKey,
        ),
    )
  ) {
    violations.push(
      'SKILL_SPECIALTY_REQUIRED_MISSING',
    )
  }

  return violations
}

export function validateCharacterAttributeSkillState(
  attributes: PersistedCharacterAttributes,
  skills: PersistedCharacterSkills,
  method: SkillDistributionMethod,
  currentStep: CharacterCreationStep,
  specialties:
    PersistedCharacterSkillSpecialty[],
  specialtySkills:
    PersistedCharacterSkills = skills,
): CharacterAttributeSkillViolation[] {
  const steps: CharacterCreationStep[] = [
    'identity',
    'attributes',
    'skills',
    'blood',
    'disciplines',
    'advantages',
    'humanity',
    'review',
  ]
  const currentStepIndex =
    steps.indexOf(currentStep)
  const attributesComplete =
    currentStepIndex > steps.indexOf('attributes')
  const skillsComplete =
    currentStepIndex > steps.indexOf('skills')

  return [
    ...validateAttributes(
      attributes,
      attributesComplete,
    ),
    ...validateSkills(
      skills,
      method,
      skillsComplete,
    ),
    ...validateSpecialties(
      specialtySkills,
      specialties,
      skillsComplete,
    ),
  ]
}

export function assertValidCharacterAttributeSkillState(
  attributes: PersistedCharacterAttributes,
  skills: PersistedCharacterSkills,
  method: SkillDistributionMethod,
  currentStep: CharacterCreationStep,
  specialties:
    PersistedCharacterSkillSpecialty[],
  specialtySkills:
    PersistedCharacterSkills = skills,
): void {
  const violations =
    validateCharacterAttributeSkillState(
      attributes,
      skills,
      method,
      currentStep,
      specialties,
      specialtySkills,
    )

  if (violations.length > 0) {
    throw new InvalidCharacterAttributeSkillStateError(
      [...new Set(violations)],
    )
  }
}

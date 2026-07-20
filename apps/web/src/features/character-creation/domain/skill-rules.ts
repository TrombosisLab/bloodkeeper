import {
  skillKeys,
} from '../data/skill-definitions.ts'

import type {
  CharacterSkillsDraft,
  SkillDistributionMethod,
  SkillKey,
} from '../types/character-skills-draft.types'

export interface SkillValidationResult {
  valid: boolean
  errors: string[]

  distribution: {
    rating0: number
    rating1: number
    rating2: number
    rating3: number
    rating4: number
  }
}

const DISTRIBUTIONS = {
  generalist: {
    rating1: 10,
    rating2: 8,
    rating3: 1,
    rating4: 0,
  },

  balanced: {
    rating1: 7,
    rating2: 5,
    rating3: 3,
    rating4: 0,
  },

  specialist: {
    rating1: 3,
    rating2: 3,
    rating3: 3,
    rating4: 1,
  },
} as const

export function createEmptySkills():
  CharacterSkillsDraft {
  return skillKeys.reduce(
    (skills, key) => {
      skills[key] = 0
      return skills
    },
    {} as CharacterSkillsDraft,
  )
}

export function validateSkillDistribution(
  skills: CharacterSkillsDraft,
  method: SkillDistributionMethod,
): SkillValidationResult {
  const values =
    skillKeys.map(
      (key) => skills[key],
    )

  const distribution = {
    rating0:
      values.filter(
        (value) => value === 0,
      ).length,

    rating1:
      values.filter(
        (value) => value === 1,
      ).length,

    rating2:
      values.filter(
        (value) => value === 2,
      ).length,

    rating3:
      values.filter(
        (value) => value === 3,
      ).length,

    rating4:
      values.filter(
        (value) => value === 4,
      ).length,
  }

  const errors: string[] = []

  if (
    values.some(
      (value) =>
        !Number.isInteger(value) ||
        value < 0 ||
        value > 4,
    )
  ) {
    errors.push(
      'Las habilidades deben tener valores entre 0 y 4.',
    )
  }

  const required =
    DISTRIBUTIONS[method]

  if (
    distribution.rating1 !==
    required.rating1
  ) {
    errors.push(
      `La distribución requiere ${required.rating1} habilidades a nivel 1.`,
    )
  }

  if (
    distribution.rating2 !==
    required.rating2
  ) {
    errors.push(
      `La distribución requiere ${required.rating2} habilidades a nivel 2.`,
    )
  }

  if (
    distribution.rating3 !==
    required.rating3
  ) {
    errors.push(
      `La distribución requiere ${required.rating3} habilidades a nivel 3.`,
    )
  }

  if (
    distribution.rating4 !==
    required.rating4
  ) {
    errors.push(
      `La distribución requiere ${required.rating4} habilidades a nivel 4.`,
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    distribution,
  }
}

function shuffle<T>(
  values: T[],
  random: () => number,
): T[] {
  const result = [...values]

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const target =
      Math.floor(
        random() * (index + 1),
      )

    ;[
      result[index],
      result[target],
    ] = [
      result[target],
      result[index],
    ]
  }

  return result
}

export function randomizeSkills(
  method: SkillDistributionMethod,
  random: () => number = Math.random,
): CharacterSkillsDraft {
  const required =
    DISTRIBUTIONS[method]

  const ratings = [
    ...Array(required.rating4).fill(4),
    ...Array(required.rating3).fill(3),
    ...Array(required.rating2).fill(2),
    ...Array(required.rating1).fill(1),
  ]

  while (
    ratings.length <
    skillKeys.length
  ) {
    ratings.push(0)
  }

  const shuffled =
    shuffle(
      ratings,
      random,
    )

  return skillKeys.reduce(
    (
      skills,
      key,
      index,
    ) => {
      skills[key] =
        shuffled[index]

      return skills
    },
    {} as CharacterSkillsDraft,
  )
}

export function updateSkill(
  skills: CharacterSkillsDraft,
  key: SkillKey,
  value: number,
): CharacterSkillsDraft {
  return {
    ...skills,

    [key]:
      Math.max(
        0,
        Math.min(
          4,
          Math.trunc(value),
        ),
      ),
  }
}

import { attributeKeys } from '../data/attribute-definitions.ts'

import type {
  AttributeKey,
  CharacterAttributesDraft,
} from '../types/character-attributes-draft.types'

export interface AttributeValidationResult {
  valid: boolean
  errors: string[]
  distribution: {
    rating1: number
    rating2: number
    rating3: number
    rating4: number
  }
}

const REQUIRED_DISTRIBUTION = {
  rating1: 1,
  rating2: 4,
  rating3: 3,
  rating4: 1,
} as const

export function validateAttributeDistribution(
  attributes: CharacterAttributesDraft,
): AttributeValidationResult {
  const values =
    attributeKeys.map(
      (key) => attributes[key],
    )

  const distribution = {
    rating1:
      values.filter((value) => value === 1).length,

    rating2:
      values.filter((value) => value === 2).length,

    rating3:
      values.filter((value) => value === 3).length,

    rating4:
      values.filter((value) => value === 4).length,
  }

  const errors: string[] = []

  if (
    values.some(
      (value) =>
        !Number.isInteger(value) ||
        value < 1 ||
        value > 4,
    )
  ) {
    errors.push(
      'Todos los atributos deben tener un valor entre 1 y 4.',
    )
  }

  if (
    distribution.rating4 !==
    REQUIRED_DISTRIBUTION.rating4
  ) {
    errors.push(
      'Debe existir exactamente un atributo con valor 4.',
    )
  }

  if (
    distribution.rating3 !==
    REQUIRED_DISTRIBUTION.rating3
  ) {
    errors.push(
      'Deben existir exactamente tres atributos con valor 3.',
    )
  }

  if (
    distribution.rating2 !==
    REQUIRED_DISTRIBUTION.rating2
  ) {
    errors.push(
      'Deben existir exactamente cuatro atributos con valor 2.',
    )
  }

  if (
    distribution.rating1 !==
    REQUIRED_DISTRIBUTION.rating1
  ) {
    errors.push(
      'Debe existir exactamente un atributo con valor 1.',
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

    const currentValue =
      result[index]

    result[index] =
      result[target]

    result[target] =
      currentValue
  }

  return result
}

export function randomizeAttributes(
  random: () => number = Math.random,
): CharacterAttributesDraft {
  const ratings = shuffle(
    [
      4,
      3,
      3,
      3,
      2,
      2,
      2,
      2,
      1,
    ],
    random,
  )

  return attributeKeys.reduce(
    (
      attributes,
      key,
      index,
    ) => {
      attributes[key] =
        ratings[index]

      return attributes
    },
    {} as CharacterAttributesDraft,
  )
}

export function updateAttribute(
  attributes: CharacterAttributesDraft,
  key: AttributeKey,
  value: number,
): CharacterAttributesDraft {
  return {
    ...attributes,
    [key]: Math.max(
      1,
      Math.min(4, value),
    ),
  }
}

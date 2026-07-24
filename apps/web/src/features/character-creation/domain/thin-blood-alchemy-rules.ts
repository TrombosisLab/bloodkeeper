import {
  getThinBloodAlchemyFormulaByKey,
} from '../data/thin-blood-alchemy-formulas.ts'

import type {
  CharacterThinBloodAlchemyDraft,
  ThinBloodAlchemyMethod,
} from '../types/thin-blood-alchemy.types.ts'

import type {
  ClanKey,
} from '../types/clan.types.ts'

import type {
  CharacterThinBloodTraitsDraft,
} from '../types/thin-blood-trait.types.ts'

export function hasThinBloodAlchemistMerit(
  traits: CharacterThinBloodTraitsDraft,
): boolean {
  return traits.selections.some(
    (selection) =>
      selection.definitionKey ===
      'thin-blood-alchemist',
  )
}

export const thinBloodAlchemyMethods:
  ThinBloodAlchemyMethod[] = [
    'athanorCorporis',
    'calcinatio',
    'fixatio',
  ]

export function createEmptyThinBloodAlchemy():
  CharacterThinBloodAlchemyDraft {
  return {
    rating: 0,
    method: null,
    formulaKeys: [],
  }
}

export function isThinBloodAlchemyMethod(
  value: string,
): value is ThinBloodAlchemyMethod {
  return thinBloodAlchemyMethods.includes(
    value as ThinBloodAlchemyMethod,
  )
}

export function normalizeThinBloodAlchemyForClan(
  alchemy: CharacterThinBloodAlchemyDraft,
  clanKey: ClanKey | null,
): CharacterThinBloodAlchemyDraft {
  if (clanKey !== 'thinBlood') {
    return createEmptyThinBloodAlchemy()
  }

  const safeRating =
    Number.isInteger(alchemy.rating)
      ? Math.max(
          0,
          Math.min(
            5,
            alchemy.rating,
          ),
        )
      : 0

  if (safeRating === 0) {
    return createEmptyThinBloodAlchemy()
  }

  return {
    rating: safeRating,

    method:
      alchemy.method !== null &&
      isThinBloodAlchemyMethod(
        alchemy.method,
      )
        ? alchemy.method
        : null,

    formulaKeys: [
      ...new Set(
        alchemy.formulaKeys.filter(
          (key) =>
            typeof key === 'string' &&
            key.trim().length > 0,
        ),
      ),
    ],
  }
}


export function normalizeThinBloodAlchemyForCharacter(
  alchemy: CharacterThinBloodAlchemyDraft,
  clanKey: ClanKey | null,
  traits: CharacterThinBloodTraitsDraft,
): CharacterThinBloodAlchemyDraft {
  if (
    clanKey !== 'thinBlood' ||
    !hasThinBloodAlchemistMerit(
      traits,
    )
  ) {
    return createEmptyThinBloodAlchemy()
  }

  return normalizeThinBloodAlchemyForClan(
    alchemy,
    clanKey,
  )
}

export interface ThinBloodAlchemyValidationResult {
  valid: boolean
  errors: string[]
}

export function normalizeThinBloodAlchemyRating(
  rating: number,
): number {
  if (!Number.isFinite(rating)) {
    return 0
  }

  return Math.max(
    0,
    Math.min(
      5,
      Math.trunc(rating),
    ),
  )
}

export function normalizeThinBloodAlchemyFormulaKeys(
  formulaKeys: unknown,
  rating: number,
): string[] {
  if (!Array.isArray(formulaKeys)) {
    return []
  }

  const safeRating =
    normalizeThinBloodAlchemyRating(
      rating,
    )

  if (safeRating === 0) {
    return []
  }

  const normalized: string[] = []

  for (const value of formulaKeys) {
    if (
      typeof value !== 'string' ||
      value.trim().length === 0
    ) {
      continue
    }

    const key = value.trim()

    if (normalized.includes(key)) {
      continue
    }

    const formula =
      getThinBloodAlchemyFormulaByKey(
        key,
      )

    if (
      formula === null ||
      formula.level > safeRating
    ) {
      continue
    }

    normalized.push(key)
  }

  return normalized
}

export function validateThinBloodAlchemyForCharacter(
  value: CharacterThinBloodAlchemyDraft,
  clanKey: ClanKey | null,
  traits: CharacterThinBloodTraitsDraft,
): ThinBloodAlchemyValidationResult {
  if (
    clanKey !== 'thinBlood' ||
    !hasThinBloodAlchemistMerit(
      traits,
    )
  ) {
    const isEmpty =
      value.rating === 0 &&
      value.method === null &&
      value.formulaKeys.length === 0

    if (isEmpty) {
      return {
        valid: true,
        errors: [],
      }
    }

    return {
      valid: false,
      errors: [
        clanKey === 'thinBlood'
          ? 'Alquimia de Sangre Débil requiere el Mérito Alquimista de Sangre Débil.'
          : 'Sólo un personaje Sangre Débil puede conservar Alquimia de Sangre Débil.',
      ],
    }
  }

  return validateThinBloodAlchemyDraft(
    value,
  )
}

export function validateThinBloodAlchemyDraft(
  value: CharacterThinBloodAlchemyDraft,
): ThinBloodAlchemyValidationResult {
  const errors: string[] = []

  const rating =
    normalizeThinBloodAlchemyRating(
      value.rating,
    )

  if (rating !== value.rating) {
    errors.push(
      'La puntuación de Alquimia de Sangre Débil debe estar entre 0 y 5.',
    )
  }

  if (rating === 0) {
    if (value.method !== null) {
      errors.push(
        'Un personaje sin Alquimia de Sangre Débil no puede tener método de destilación.',
      )
    }

    if (value.formulaKeys.length > 0) {
      errors.push(
        'Un personaje sin Alquimia de Sangre Débil no puede conocer fórmulas.',
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  if (
    value.method === null ||
    !isThinBloodAlchemyMethod(
      value.method,
    )
  ) {
    errors.push(
      'Un personaje con Alquimia de Sangre Débil debe tener un método de destilación válido.',
    )
  }

  const seen = new Set<string>()

  for (const key of value.formulaKeys) {
    if (seen.has(key)) {
      errors.push(
        `La fórmula ${key} está duplicada.`,
      )
      continue
    }

    seen.add(key)

    const formula =
      getThinBloodAlchemyFormulaByKey(
        key,
      )

    if (formula === null) {
      errors.push(
        `La fórmula ${key} no existe en el catálogo disponible.`,
      )
      continue
    }

    if (formula.level > rating) {
      errors.push(
        `La fórmula ${formula.name} es de nivel ${formula.level} y supera la puntuación ${rating} de Alquimia de Sangre Débil.`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

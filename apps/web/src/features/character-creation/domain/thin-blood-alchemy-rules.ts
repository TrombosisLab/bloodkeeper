import type {
  CharacterThinBloodAlchemyDraft,
  ThinBloodAlchemyMethod,
} from '../types/thin-blood-alchemy.types.ts'

import type {
  ClanKey,
} from '../types/clan.types.ts'

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

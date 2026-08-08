import {
  deriveCharacterHealthCapacity,
  deriveCharacterWillpowerCapacity,
} from '@v5r/character-rules'

import type {
  CharacterAttributesDraft,
} from '../types/character-attributes-draft.types'

import type {
  CharacterBloodDraft,
  CharacterDerivedTraits,
} from '../types/character-blood-draft.types'

import type {
  CharacterGeneration,
} from '../types/character-generation.types'

import {
  CHARACTER_INITIAL_HUNGER,
  normalizeCharacterHunger,
  validateCharacterHunger,
} from '../../character/domain/hunger-rules.ts'

export interface BloodValidationResult {
  valid: boolean
  errors: string[]
}

const GENERATION_BLOOD_POTENCY_RANGE: Record<
  CharacterGeneration,
  {
    min: number
    max: number
  }
> = {
  10: { min: 1, max: 4 },
  11: { min: 1, max: 3 },
  12: { min: 1, max: 3 },
  13: { min: 1, max: 3 },
  14: { min: 0, max: 2 },
  15: { min: 0, max: 1 },
  16: { min: 0, max: 0 },
}

export function getBloodPotencyRange(
  generation: CharacterGeneration,
) {
  return {
    ...GENERATION_BLOOD_POTENCY_RANGE[
      generation
    ],
  }
}

export function getInitialBloodPotency(
  generation: CharacterGeneration,
): number {
  return getBloodPotencyRange(
    generation,
  ).min
}

export function createInitialBloodDraft(
  generation: CharacterGeneration = 13,
): CharacterBloodDraft {
  return {
    bloodPotency:
      getInitialBloodPotency(
        generation,
      ),

    hunger:
      CHARACTER_INITIAL_HUNGER,
  }
}

export function normalizeBloodForGeneration(
  blood: CharacterBloodDraft,
  generation: CharacterGeneration,
): CharacterBloodDraft {
  const range =
    getBloodPotencyRange(
      generation,
    )

  return {
    ...blood,

    bloodPotency:
      Math.max(
        range.min,
        Math.min(
          range.max,
          blood.bloodPotency,
        ),
      ),
  }
}

export function updateBloodPotency(
  blood: CharacterBloodDraft,
  generation: CharacterGeneration,
  bloodPotency: number,
): CharacterBloodDraft {
  const range =
    getBloodPotencyRange(
      generation,
    )

  return {
    ...blood,

    bloodPotency:
      Math.max(
        range.min,
        Math.min(
          range.max,
          Math.trunc(
            bloodPotency,
          ),
        ),
      ),
  }
}

export function updateHunger(
  blood: CharacterBloodDraft,
  hunger: number,
): CharacterBloodDraft {
  return {
    ...blood,

    hunger:
      normalizeCharacterHunger(
        hunger,
      ),
  }
}

export function deriveCharacterTraits(
  attributes: CharacterAttributesDraft,
): CharacterDerivedTraits {
  return {
    health:
      deriveCharacterHealthCapacity(attributes),

    willpower:
      deriveCharacterWillpowerCapacity(attributes),
  }
}

export function validateBloodDraft(
  blood: CharacterBloodDraft,
  generation:
    | CharacterGeneration
    | null,
): BloodValidationResult {
  const errors: string[] = []

  if (generation === null) {
    errors.push(
      'Debes seleccionar una generación en Identidad.',
    )

    return {
      valid: false,
      errors,
    }
  }

  const range =
    getBloodPotencyRange(
      generation,
    )

  if (
    !Number.isInteger(
      blood.bloodPotency,
    ) ||
    blood.bloodPotency <
      range.min ||
    blood.bloodPotency >
      range.max
  ) {
    errors.push(
      `La Potencia de Sangre debe estar entre ${range.min} y ${range.max} para la generación seleccionada.`,
    )
  }

  errors.push(
    ...validateCharacterHunger(
      blood.hunger,
    ).errors,
  )

  return {
    valid: errors.length === 0,
    errors,
  }
}

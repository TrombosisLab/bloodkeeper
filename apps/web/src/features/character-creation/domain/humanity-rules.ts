import type {
  CharacterHumanityDraft,
} from '../types/character-humanity-draft.types.ts'

export const INITIAL_HUMANITY_VALUE = 7
export const MIN_INITIAL_CONVICTIONS = 1
export const MAX_INITIAL_CONVICTIONS = 3

export interface HumanityValidationResult {
  valid: boolean
  errors: string[]
}

function hasDuplicateValues(
  values: string[],
): boolean {
  return new Set(values).size !== values.length
}

export function validateInitialHumanity(
  humanity: CharacterHumanityDraft,
  expectedValue: number =
    INITIAL_HUMANITY_VALUE,
): HumanityValidationResult {
  const errors: string[] = []

  if (
    humanity.value !==
    expectedValue
  ) {
    errors.push(
      `La Humanidad inicial debe ser ${expectedValue}.`,
    )
  }

  if (
    humanity.convictions.length <
    MIN_INITIAL_CONVICTIONS ||
    humanity.convictions.length >
    MAX_INITIAL_CONVICTIONS
  ) {
    errors.push(
      'Debes definir entre 1 y 3 Convicciones.',
    )
  }

  const convictionIds =
    humanity.convictions.map(
      (conviction) =>
        conviction.convictionId,
    )

  const touchstoneIds =
    humanity.touchstones.map(
      (touchstone) =>
        touchstone.touchstoneId,
    )

  if (
    convictionIds.some(
      (id) => !id.trim(),
    ) ||
    hasDuplicateValues(convictionIds)
  ) {
    errors.push(
      'Las Convicciones deben tener identificadores únicos y válidos.',
    )
  }

  if (
    touchstoneIds.some(
      (id) => !id.trim(),
    ) ||
    hasDuplicateValues(touchstoneIds)
  ) {
    errors.push(
      'Las Piedras de Toque deben tener identificadores únicos y válidos.',
    )
  }

  for (
    const conviction of
    humanity.convictions
  ) {
    if (!conviction.text.trim()) {
      errors.push(
        'Todas las Convicciones deben tener una descripción.',
      )
    }

    if (
      conviction.touchstoneId === null ||
      !conviction.touchstoneId.trim()
    ) {
      errors.push(
        'Cada Convicción debe estar vinculada a una Piedra de Toque.',
      )
      continue
    }

    if (
      !touchstoneIds.includes(
        conviction.touchstoneId,
      )
    ) {
      errors.push(
        'Cada Convicción debe estar vinculada a una Piedra de Toque existente.',
      )
    }
  }

  const linkedTouchstoneIds =
    humanity.convictions
      .map(
        (conviction) =>
          conviction.touchstoneId,
      )
      .filter(
        (
          touchstoneId,
        ): touchstoneId is string =>
          touchstoneId !== null &&
          Boolean(
            touchstoneId.trim(),
          ),
      )

  if (
    hasDuplicateValues(
      linkedTouchstoneIds,
    )
  ) {
    errors.push(
      'Una Piedra de Toque no puede estar vinculada a varias Convicciones.',
    )
  }

  for (
    const touchstone of
    humanity.touchstones
  ) {
    if (!touchstone.name.trim()) {
      errors.push(
        'Todas las Piedras de Toque deben tener un nombre.',
      )
    }

    if (
      !touchstone.relationship.trim()
    ) {
      errors.push(
        'Todas las Piedras de Toque deben indicar su relación con el personaje.',
      )
    }

    if (
      !linkedTouchstoneIds.includes(
        touchstone.touchstoneId,
      )
    ) {
      errors.push(
        'No puede haber Piedras de Toque sin una Convicción vinculada.',
      )
    }
  }

  if (
    humanity.touchstones.length !==
    humanity.convictions.length
  ) {
    errors.push(
      'Debe existir exactamente una Piedra de Toque por cada Convicción.',
    )
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}

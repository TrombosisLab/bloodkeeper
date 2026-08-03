import type {
  UpdateCharacterSecondaryData,
} from './persisted-character-secondary.types'

export type CharacterSecondaryViolation =
  | 'SECONDARY_ID_DUPLICATED'
  | 'INVENTORY_NAME_REQUIRED'
  | 'INVENTORY_QUANTITY_INVALID'
  | 'INVENTORY_OPTIONAL_TEXT_EMPTY'
  | 'INVENTORY_STATUS_INVALID'
  | 'NOTE_CONTENT_REQUIRED'
  | 'HISTORY_TITLE_REQUIRED'
  | 'HISTORY_DESCRIPTION_REQUIRED'

export class InvalidCharacterSecondaryDataError
  extends Error {
  readonly violations:
    CharacterSecondaryViolation[]

  constructor(
    violations:
      CharacterSecondaryViolation[],
  ) {
    super('Character secondary data is invalid')
    this.name =
      'InvalidCharacterSecondaryDataError'
    this.violations = violations
  }
}

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function hasDuplicatedIds(
  entries: readonly { id: string }[],
): boolean {
  const ids = entries.map((entry) => entry.id)
  return new Set(ids).size !== ids.length
}

export function validateCharacterSecondaryUpdate(
  data: UpdateCharacterSecondaryData,
): CharacterSecondaryViolation[] {
  const violations:
    CharacterSecondaryViolation[] = []

  switch (data.section) {
    case 'inventory':
      if (hasDuplicatedIds(data.inventory)) {
        violations.push('SECONDARY_ID_DUPLICATED')
      }

      if (
        data.inventory.some(
          (item) => !hasText(item.name),
        )
      ) {
        violations.push('INVENTORY_NAME_REQUIRED')
      }

      if (
        data.inventory.some(
          (item) =>
            !Number.isInteger(item.quantity) ||
            item.quantity < 1,
        )
      ) {
        violations.push(
          'INVENTORY_QUANTITY_INVALID',
        )
      }

      if (
        data.inventory.some(
          (item) =>
            [
              item.description,
              item.category,
              item.notes,
            ].some(
              (value) =>
                value !== null &&
                !hasText(value),
            ),
        )
      ) {
        violations.push(
          'INVENTORY_OPTIONAL_TEXT_EMPTY',
        )
      }

      if (
        data.inventory.some(
          (item) =>
            item.status !== 'active' &&
            item.status !== 'archived',
        )
      ) {
        violations.push(
          'INVENTORY_STATUS_INVALID',
        )
      }
      break

    case 'notes':
      if (hasDuplicatedIds(data.notes)) {
        violations.push('SECONDARY_ID_DUPLICATED')
      }

      if (
        data.notes.some(
          (note) => !hasText(note.content),
        )
      ) {
        violations.push('NOTE_CONTENT_REQUIRED')
      }
      break

    case 'history':
      if (hasDuplicatedIds(data.history)) {
        violations.push('SECONDARY_ID_DUPLICATED')
      }

      if (
        data.history.some(
          (entry) => !hasText(entry.title),
        )
      ) {
        violations.push('HISTORY_TITLE_REQUIRED')
      }

      if (
        data.history.some(
          (entry) =>
            !hasText(entry.description),
        )
      ) {
        violations.push(
          'HISTORY_DESCRIPTION_REQUIRED',
        )
      }
      break
  }

  return violations
}

export function assertValidCharacterSecondaryUpdate(
  data: UpdateCharacterSecondaryData,
): void {
  const violations =
    validateCharacterSecondaryUpdate(data)

  if (violations.length > 0) {
    throw new InvalidCharacterSecondaryDataError(
      violations,
    )
  }
}

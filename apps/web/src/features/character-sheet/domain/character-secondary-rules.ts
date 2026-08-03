import type {
  CharacterSecondaryData,
} from '../types/character-secondary.types.ts'

export type CharacterSecondaryViolation =
  | 'INVENTORY_ID_REQUIRED'
  | 'INVENTORY_ID_DUPLICATED'
  | 'INVENTORY_NAME_REQUIRED'
  | 'INVENTORY_QUANTITY_INVALID'
  | 'INVENTORY_OPTIONAL_TEXT_EMPTY'
  | 'INVENTORY_STATUS_INVALID'
  | 'NOTE_ID_REQUIRED'
  | 'NOTE_ID_DUPLICATED'
  | 'NOTE_CONTENT_REQUIRED'
  | 'HISTORY_ID_REQUIRED'
  | 'HISTORY_ID_DUPLICATED'
  | 'HISTORY_TITLE_REQUIRED'
  | 'HISTORY_DESCRIPTION_REQUIRED'

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function hasDuplicatedIds(
  entries: readonly { readonly id: string }[],
): boolean {
  const ids = entries.map(
    (entry) => entry.id,
  )

  return new Set(ids).size !== ids.length
}

export function createEmptyCharacterSecondaryData():
  CharacterSecondaryData {
  return {
    inventory: [],
    notes: [],
    history: [],
  }
}

export function validateCharacterSecondaryData(
  data: CharacterSecondaryData,
): CharacterSecondaryViolation[] {
  const violations:
    CharacterSecondaryViolation[] = []

  if (
    data.inventory.some(
      (item) => !hasText(item.id),
    )
  ) {
    violations.push('INVENTORY_ID_REQUIRED')
  }

  if (hasDuplicatedIds(data.inventory)) {
    violations.push('INVENTORY_ID_DUPLICATED')
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
    violations.push('INVENTORY_STATUS_INVALID')
  }

  if (
    data.notes.some(
      (note) => !hasText(note.id),
    )
  ) {
    violations.push('NOTE_ID_REQUIRED')
  }

  if (hasDuplicatedIds(data.notes)) {
    violations.push('NOTE_ID_DUPLICATED')
  }

  if (
    data.notes.some(
      (note) => !hasText(note.content),
    )
  ) {
    violations.push('NOTE_CONTENT_REQUIRED')
  }

  if (
    data.history.some(
      (entry) => !hasText(entry.id),
    )
  ) {
    violations.push('HISTORY_ID_REQUIRED')
  }

  if (hasDuplicatedIds(data.history)) {
    violations.push('HISTORY_ID_DUPLICATED')
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

  return violations
}

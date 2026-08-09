import type {
  CharacterNote,
  CharacterSecondaryData,
  HistoryEntry,
  InventoryItem,
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
  | 'SECONDARY_ENTRY_NOT_FOUND'

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

function assertValidCharacterSecondaryData(
  data: CharacterSecondaryData,
): void {
  const violations =
    validateCharacterSecondaryData(data)

  if (violations.length > 0) {
    throw new InvalidCharacterSecondaryDataError(
      violations,
    )
  }
}

function entryNotFound(): never {
  throw new InvalidCharacterSecondaryDataError(
    ['SECONDARY_ENTRY_NOT_FOUND'],
  )
}

export function addInventoryItem(
  data: CharacterSecondaryData,
  item: InventoryItem,
): CharacterSecondaryData {
  const next = {
    ...data,
    inventory: [
      ...data.inventory,
      item,
    ],
  }

  assertValidCharacterSecondaryData(next)
  return next
}

export function updateInventoryItem(
  data: CharacterSecondaryData,
  item: InventoryItem,
): CharacterSecondaryData {
  if (
    !data.inventory.some(
      (candidate) => candidate.id === item.id,
    )
  ) {
    return entryNotFound()
  }

  const next = {
    ...data,
    inventory: data.inventory.map(
      (candidate) =>
        candidate.id === item.id
          ? item
          : candidate,
    ),
  }

  assertValidCharacterSecondaryData(next)
  return next
}

export function setInventoryItemArchived(
  data: CharacterSecondaryData,
  itemId: string,
  archived: boolean,
): CharacterSecondaryData {
  const item = data.inventory.find(
    (candidate) => candidate.id === itemId,
  )

  if (!item) {
    return entryNotFound()
  }

  return updateInventoryItem(data, {
    ...item,
    status: archived
      ? 'archived'
      : 'active',
  })
}

export function removeInventoryItem(
  data: CharacterSecondaryData,
  itemId: string,
): CharacterSecondaryData {
  if (
    !data.inventory.some(
      (candidate) => candidate.id === itemId,
    )
  ) {
    return entryNotFound()
  }

  const next = {
    ...data,
    inventory: data.inventory.filter(
      (candidate) => candidate.id !== itemId,
    ),
  }

  assertValidCharacterSecondaryData(next)
  return next
}

export function addCharacterNote(
  data: CharacterSecondaryData,
  note: CharacterNote,
): CharacterSecondaryData {
  const next = {
    ...data,
    notes: [...data.notes, note],
  }

  assertValidCharacterSecondaryData(next)
  return next
}

export function updateCharacterNote(
  data: CharacterSecondaryData,
  note: CharacterNote,
): CharacterSecondaryData {
  if (
    !data.notes.some(
      (candidate) => candidate.id === note.id,
    )
  ) {
    return entryNotFound()
  }

  const next = {
    ...data,
    notes: data.notes.map(
      (candidate) =>
        candidate.id === note.id
          ? note
          : candidate,
    ),
  }

  assertValidCharacterSecondaryData(next)
  return next
}

export function removeCharacterNote(
  data: CharacterSecondaryData,
  noteId: string,
): CharacterSecondaryData {
  if (
    !data.notes.some(
      (candidate) => candidate.id === noteId,
    )
  ) {
    return entryNotFound()
  }

  return {
    ...data,
    notes: data.notes.filter(
      (candidate) => candidate.id !== noteId,
    ),
  }
}

export function addHistoryEntry(
  data: CharacterSecondaryData,
  entry: HistoryEntry,
): CharacterSecondaryData {
  const next = {
    ...data,
    history: [...data.history, entry],
  }

  assertValidCharacterSecondaryData(next)
  return next
}

export function updateHistoryEntry(
  data: CharacterSecondaryData,
  entry: HistoryEntry,
): CharacterSecondaryData {
  if (
    !data.history.some(
      (candidate) => candidate.id === entry.id,
    )
  ) {
    return entryNotFound()
  }

  const next = {
    ...data,
    history: data.history.map(
      (candidate) =>
        candidate.id === entry.id
          ? entry
          : candidate,
    ),
  }

  assertValidCharacterSecondaryData(next)
  return next
}

export function removeHistoryEntry(
  data: CharacterSecondaryData,
  entryId: string,
): CharacterSecondaryData {
  if (
    !data.history.some(
      (candidate) => candidate.id === entryId,
    )
  ) {
    return entryNotFound()
  }

  return {
    ...data,
    history: data.history.filter(
      (candidate) => candidate.id !== entryId,
    ),
  }
}

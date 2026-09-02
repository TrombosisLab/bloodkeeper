import type {
  CharacterExperienceLedger,
} from '../domain/character-experience.types'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

import type {
  PersistedCharacterSecondaryData,
} from '../domain/persisted-character-secondary.types'

export type CharacterSheetPdfFormat =
  | 'editable'
  | 'print'

export interface CharacterSheetPdfSnapshot {
  readonly character: PersistedCharacterDraft
  readonly secondary:
    PersistedCharacterSecondaryData | null
  readonly experience:
    CharacterExperienceLedger
}

export interface CharacterSheetPdfDocument {
  readonly bytes: Uint8Array
  readonly fileName: string
}

export interface CharacterSheetPdfRenderer {
  render(
    snapshot: CharacterSheetPdfSnapshot,
    format: CharacterSheetPdfFormat,
  ): Promise<Uint8Array>
}

export const CHARACTER_SHEET_PDF_RENDERER =
  Symbol('CHARACTER_SHEET_PDF_RENDERER')

export type CharacterInventoryItemStatus =
  | 'active'
  | 'archived'

export interface PersistedCharacterInventoryItem {
  id: string
  name: string
  quantity: number
  description: string | null
  category: string | null
  notes: string | null
  status: CharacterInventoryItemStatus
}

export interface PersistedCharacterNote {
  id: string
  content: string
}

export interface PersistedCharacterHistoryEntry {
  id: string
  title: string
  description: string
}

export interface PersistedCharacterSecondaryData {
  characterId: string
  revision: number
  inventory:
    PersistedCharacterInventoryItem[]
  notes: PersistedCharacterNote[]
  history: PersistedCharacterHistoryEntry[]
}

interface CharacterSecondaryUpdateBase {
  characterId: string
  expectedRevision: number
}

export type UpdateCharacterSecondaryData =
  CharacterSecondaryUpdateBase & (
    | {
        section: 'inventory'
        inventory:
          PersistedCharacterInventoryItem[]
      }
    | {
        section: 'notes'
        notes: PersistedCharacterNote[]
      }
    | {
        section: 'history'
        history:
          PersistedCharacterHistoryEntry[]
      }
  )

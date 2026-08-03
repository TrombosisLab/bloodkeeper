export interface InventoryItem {
  readonly id: string
  readonly name: string
  readonly quantity: number
  readonly description: string | null
  readonly category: string | null
  readonly notes: string | null
  readonly status: 'active' | 'archived'
}

export interface CharacterNote {
  readonly id: string
  readonly content: string
}

export interface HistoryEntry {
  readonly id: string
  readonly title: string
  readonly description: string
}

export interface CharacterSecondaryData {
  readonly inventory:
    readonly InventoryItem[]
  readonly notes:
    readonly CharacterNote[]
  readonly history:
    readonly HistoryEntry[]
}

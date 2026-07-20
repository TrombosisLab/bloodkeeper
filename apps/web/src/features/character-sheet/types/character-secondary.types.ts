export interface InventoryItem {
  key: string
  name: string
  detail?: string
}

export interface HistoryEntry {
  key: string
  title: string
  detail: string
}

export interface CharacterSecondaryData {
  inventory: InventoryItem[]
  notes: string[]
  history: HistoryEntry[]
}

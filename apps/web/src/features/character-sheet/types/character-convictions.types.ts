export interface Conviction {
  key: string
  text: string
  touchstoneKey: string | null
}

export interface Touchstone {
  key: string
  name: string
  relation: string
}

export interface CharacterNarrativeState {
  convictions: Conviction[]
  touchstones: Touchstone[]
  notes: string
}

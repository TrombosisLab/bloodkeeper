export interface Conviction {
  key: string
  text: string
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

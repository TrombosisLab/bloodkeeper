export interface CharacterAttribute {
  key: string
  label: string
  value: number
}

export interface CharacterAttributeCategory {
  key: string
  label: string
  attributes: CharacterAttribute[]
}

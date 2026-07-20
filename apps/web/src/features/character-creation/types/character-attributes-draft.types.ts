export type AttributeKey =
  | 'strength'
  | 'dexterity'
  | 'stamina'
  | 'charisma'
  | 'manipulation'
  | 'composure'
  | 'intelligence'
  | 'wits'
  | 'resolve'

export type CharacterAttributesDraft =
  Record<AttributeKey, number>

export interface AttributeDefinition {
  key: AttributeKey
  label: string
  category:
    | 'physical'
    | 'social'
    | 'mental'
}

import type {
  AttributeDefinition,
  AttributeKey,
} from '../types/character-attributes-draft.types'

export const attributeDefinitions: AttributeDefinition[] = [
  {
    key: 'strength',
    label: 'Fuerza',
    category: 'physical',
  },
  {
    key: 'dexterity',
    label: 'Destreza',
    category: 'physical',
  },
  {
    key: 'stamina',
    label: 'Resistencia',
    category: 'physical',
  },

  {
    key: 'charisma',
    label: 'Carisma',
    category: 'social',
  },
  {
    key: 'manipulation',
    label: 'Manipulación',
    category: 'social',
  },
  {
    key: 'composure',
    label: 'Compostura',
    category: 'social',
  },

  {
    key: 'intelligence',
    label: 'Inteligencia',
    category: 'mental',
  },
  {
    key: 'wits',
    label: 'Astucia',
    category: 'mental',
  },
  {
    key: 'resolve',
    label: 'Resolución',
    category: 'mental',
  },
]

export const attributeKeys: AttributeKey[] =
  attributeDefinitions.map(
    (attribute) => attribute.key,
  )

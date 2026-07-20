import type {
  CharacterAttributeCategory,
} from '../types/character-attributes.types'

export const demoAttributes: CharacterAttributeCategory[] = [
  {
    key: 'physical',
    label: 'Físicos',
    attributes: [
      {
        key: 'strength',
        label: 'Fuerza',
        value: 3,
      },
      {
        key: 'dexterity',
        label: 'Destreza',
        value: 3,
      },
      {
        key: 'stamina',
        label: 'Resistencia',
        value: 2,
      },
    ],
  },
  {
    key: 'social',
    label: 'Sociales',
    attributes: [
      {
        key: 'charisma',
        label: 'Carisma',
        value: 2,
      },
      {
        key: 'manipulation',
        label: 'Manipulación',
        value: 3,
      },
      {
        key: 'composure',
        label: 'Compostura',
        value: 3,
      },
    ],
  },
  {
    key: 'mental',
    label: 'Mentales',
    attributes: [
      {
        key: 'intelligence',
        label: 'Inteligencia',
        value: 3,
      },
      {
        key: 'wits',
        label: 'Astucia',
        value: 2,
      },
      {
        key: 'resolve',
        label: 'Resolución',
        value: 3,
      },
    ],
  },
]

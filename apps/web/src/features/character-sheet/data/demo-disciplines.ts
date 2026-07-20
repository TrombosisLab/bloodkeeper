import type {
  CharacterDiscipline,
} from '../types/character-disciplines.types'

export const demoDisciplines: CharacterDiscipline[] = [
  {
    key: 'celerity',
    name: 'Celeridad',
    value: 2,
    powers: [
      {
        key: 'cats-grace',
        name: 'Gracia Felina',
        level: 1,
      },
      {
        key: 'rapid-reflexes',
        name: 'Reflejos Rápidos',
        level: 1,
      },
    ],
  },
  {
    key: 'potence',
    name: 'Potencia',
    value: 2,
    powers: [
      {
        key: 'lethal-body',
        name: 'Cuerpo Letal',
        level: 1,
      },
      {
        key: 'prowess',
        name: 'Proeza',
        level: 2,
      },
    ],
  },
  {
    key: 'presence',
    name: 'Presencia',
    value: 1,
    powers: [
      {
        key: 'awe',
        name: 'Fascinación',
        level: 1,
      },
    ],
  },
]

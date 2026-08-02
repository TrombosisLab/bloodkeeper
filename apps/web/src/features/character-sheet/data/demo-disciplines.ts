import type {
  CharacterDisciplineState,
} from '../types/character-disciplines.types'

export const demoDisciplines:
  CharacterDisciplineState[] = [
    {
      key: 'celerity',
      value: 2,
      powerKeys: [
        'celerity-cats-grace',
        'celerity-rapid-reflexes',
      ],
    },
    {
      key: 'potence',
      value: 2,
      powerKeys: [
        'potence-lethal-body',
        'potence-prowess',
      ],
    },
    {
      key: 'presence',
      value: 1,
      powerKeys: ['presence-awe'],
    },
  ]

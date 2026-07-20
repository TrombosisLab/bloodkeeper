import type {
  CharacterAdvantages,
} from '../types/character-advantages.types'

export const demoAdvantages: CharacterAdvantages = {
  advantages: [
    {
      key: 'looks',
      name: 'Aspecto',
      value: 2,
      detail: 'Atractivo',
    },
    {
      key: 'linguistics',
      name: 'Lingüística',
      value: 1,
      detail: 'Inglés',
    },
  ],

  backgrounds: [
    {
      key: 'contacts',
      name: 'Contactos',
      value: 2,
      detail: 'Política local',
    },
    {
      key: 'resources',
      name: 'Recursos',
      value: 2,
    },
    {
      key: 'status',
      name: 'Estatus',
      value: 1,
      detail: 'Camarilla',
    },
  ],

  flaws: [
    {
      key: 'enemy',
      name: 'Enemigo',
      value: 1,
      detail: 'Rival político',
    },
    {
      key: 'feeding',
      name: 'Exclusión de presa',
      value: 1,
    },
  ],
}

import type {
  CharacterNarrativeState,
} from '../types/character-convictions.types'

export const demoNarrativeState: CharacterNarrativeState = {
  convictions: [
    {
      key: 'protect-weak',
      text: 'No abandonar a quien no puede defenderse',
    },
    {
      key: 'keep-word',
      text: 'La palabra dada tiene un precio',
    },
  ],

  touchstones: [
    {
      key: 'maria',
      name: 'María',
      relation: 'Hermana mortal',
    },
    {
      key: 'daniel',
      name: 'Daniel',
      relation: 'Antiguo compañero de activismo',
    },
  ],

  notes:
    'Mantiene vínculos con círculos políticos locales y evita comprometer directamente a su familia mortal.',
}

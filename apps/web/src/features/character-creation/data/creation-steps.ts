import type {
  CreationStep,
  CreationStepId,
} from '../types/creation-step.types'

import type {
  CharacterDraftApiCreationMode,
} from '../types/character-draft-api.types'

export const creationSteps: CreationStep[] = [
  {
    id: 'identity',
    number: 1,
    title: 'Identidad',
    shortTitle: 'Identidad',
    description:
      'Define quién es el personaje y su lugar inicial en la crónica.',
  },
  {
    id: 'attributes',
    number: 2,
    title: 'Atributos',
    shortTitle: 'Atributos',
    description:
      'Distribuye las capacidades físicas, sociales y mentales.',
  },
  {
    id: 'skills',
    number: 3,
    title: 'Habilidades',
    shortTitle: 'Habilidades',
    description:
      'Define las capacidades aprendidas y especialidades.',
  },
  {
    id: 'blood',
    number: 4,
    title: 'Sangre',
    shortTitle: 'Sangre',
    description:
      'Configura los rasgos fundamentales de la condición vampírica.',
  },
  {
    id: 'disciplines',
    number: 5,
    title: 'Disciplinas',
    shortTitle: 'Disciplinas',
    description:
      'Selecciona los poderes sobrenaturales del personaje.',
  },
  {
    id: 'advantages',
    number: 6,
    title: 'Ventajas',
    shortTitle: 'Ventajas',
    description:
      'Define ventajas, trasfondos y defectos.',
  },
  {
    id: 'humanity',
    number: 7,
    title: 'Humanidad',
    shortTitle: 'Humanidad',
    description:
      'Establece convicciones, humanidad y piedras de toque.',
  },
  {
    id: 'review',
    number: 8,
    title: 'Revisión final',
    shortTitle: 'Revisión',
    description:
      'Comprueba el personaje completo antes de finalizar.',
  },
]


const sessionZeroStepIds:
  readonly CreationStepId[] = [
    'identity',
    'attributes',
    'skills',
    'advantages',
    'humanity',
    'review',
  ]

export function getCreationSteps(
  creationMode: CharacterDraftApiCreationMode,
): CreationStep[] {
  const selected =
    creationMode === 'sessionZero'
      ? creationSteps.filter(
          step =>
            sessionZeroStepIds.includes(
              step.id,
            ),
        )
      : creationSteps

  return selected.map(
    (step, index) => ({
      ...step,
      number: index + 1,
    }),
  )
}

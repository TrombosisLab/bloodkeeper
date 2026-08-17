import {
  CharacterInitialVampireApiError,
} from '../infrastructure/character-initial-vampire.api.ts'

import type {
  CharacterInitialVampirePendingDecision,
} from '../types/character-transition-read-model.types.ts'

export const initialVampirePendingDecisionLabels:
  Readonly<
    Record<
      CharacterInitialVampirePendingDecision,
      string
    >
  > = {
    clan: 'Clan',
    generation: 'Generación',
    sire: 'Sire',
    bloodState: 'Estado de Sangre',
    thinBloodState: 'Estado de Sangre Débil',
    predatorType: 'Tipo de Depredador',
    initialDisciplines: 'Disciplinas iniciales',
    initialPowers: 'Poderes iniciales',
    advantagesReview:
      'Revisión de Ventajas y Defectos',
  }

function prerequisiteLabel(
  value: unknown,
): string {
  if (typeof value !== 'string') {
    return 'otra decisión vampírica'
  }

  const known =
    initialVampirePendingDecisionLabels[
      value as
        CharacterInitialVampirePendingDecision
    ]

  return known ?? value
}

export function messageForInitialVampireTransitionError(
  error: unknown,
): string {
  if (
    !(
      error instanceof
        CharacterInitialVampireApiError
    )
  ) {
    return (
      'No se pudo resolver la decisión vampírica.'
    )
  }

  if (error.status === 401) {
    return (
      'La sesión ya no permite modificar este personaje.'
    )
  }

  if (error.status === 403) {
    return (
      'No tienes permiso para resolver esta decisión vampírica.'
    )
  }

  if (error.status === 404) {
    return (
      'El personaje ya no está disponible.'
    )
  }

  if (error.status === 409) {
    return (
      'La ficha cambió o esta decisión ya fue resuelta. Recárgala antes de continuar.'
    )
  }

  if (
    error.status === 422 &&
    error.details.prerequisite !== undefined
  ) {
    return (
      'Antes debes resolver: ' +
      prerequisiteLabel(
        error.details.prerequisite,
      ) +
      '.'
    )
  }

  if (
    error.status === 422 &&
    Array.isArray(
      error.details.violations,
    )
  ) {
    return (
      'La decisión no cumple todavía las reglas requeridas por el personaje.'
    )
  }

  return (
    'El backend rechazó la decisión vampírica.'
  )
}

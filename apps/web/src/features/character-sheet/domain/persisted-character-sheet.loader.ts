import {
  CharacterDraftApiError,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import type {
  CharacterDraftGateway,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import {
  CharacterProfilePhaseApiError,
} from '../infrastructure/character-profile-phase.api.ts'

import type {
  CharacterProfilePhaseGateway,
} from '../infrastructure/character-profile-phase.api.ts'

import type {
  CharacterSheetModel,
} from '../types/character-sheet-model.types.ts'

import {
  adaptPersistedCharacterToSheetModel,
} from './persisted-character-sheet.adapter.ts'

export type CharacterSheetLoadFailureState =
  | 'unauthorized'
  | 'not-found'
  | 'error'

export async function loadPersistedCharacterSheet(
  gateway: CharacterDraftGateway,
  profilePhaseGateway: CharacterProfilePhaseGateway,
  characterId: string,
): Promise<CharacterSheetModel> {
  const [
    snapshot,
    profilePhase,
  ] = await Promise.all([
    gateway.load(characterId),
    profilePhaseGateway.load(characterId),
  ])

  return adaptPersistedCharacterToSheetModel(
    snapshot,
    profilePhase.phase,
  )
}

export function stateForCharacterSheetLoadError(
  error: unknown,
): CharacterSheetLoadFailureState {
  if (
    error instanceof CharacterDraftApiError ||
    error instanceof CharacterProfilePhaseApiError
  ) {
    if (error.status === 401) {
      return 'unauthorized'
    }

    if (error.status === 404) {
      return 'not-found'
    }
  }

  return 'error'
}

export function messageForCharacterSheetLoadState(
  state:
    | 'loading'
    | CharacterSheetLoadFailureState,
): string {
  switch (state) {
    case 'loading':
      return 'Cargando ficha persistida…'

    case 'unauthorized':
      return (
        'La sesión actual no permite cargar este personaje.'
      )

    case 'not-found':
      return (
        'El personaje solicitado no existe o ya no está disponible.'
      )

    case 'error':
      return 'No se pudo cargar la ficha persistida.'
  }
}

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

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

import {
  adaptPersistedCharacterToSheetModel,
} from './persisted-character-sheet.adapter.ts'

export type CharacterSheetLoadFailureState =
  | 'unauthorized'
  | 'not-found'
  | 'error'

export interface PersistedCharacterSheetLoadResult {
  readonly model: CharacterSheetModel
  readonly transition:
    CharacterInitialVampireTransitionReadModel | null
}

function buildTransitionReadModel(
  snapshot:
    Awaited<ReturnType<CharacterDraftGateway['load']>>,
  profilePhase:
    Awaited<ReturnType<CharacterProfilePhaseGateway['load']>>,
): CharacterInitialVampireTransitionReadModel | null {
  if (
    profilePhase.phase !==
      'TRANSITIONAL_VAMPIRE'
  ) {
    return null
  }

  return {
    characterId:
      snapshot.characterId,
    revision:
      snapshot.revision,
    status:
      snapshot.status,
    phase:
      'TRANSITIONAL_VAMPIRE',
    pendingDecisions: [
      ...profilePhase.pendingDecisions,
    ],
    creationMode:
      snapshot.creation.creationMode,

    identity: {
      clanKey:
        snapshot.identity.clanKey,
      generation:
        snapshot.identity.generation,
      sire:
        snapshot.identity.sire,
      predatorTypeKey:
        snapshot.identity.predatorTypeKey,
    },

    predatorTypeChoices: {
      ...snapshot.creation
        .predatorTypeChoices,
    },

    blood:
      snapshot.blood === null
        ? null
        : {
            ...snapshot.blood,
          },

    disciplines:
      snapshot.disciplines.map(
        (discipline) => ({
          ...discipline,
          powerKeys: [
            ...discipline.powerKeys,
          ],
        }),
      ),

    advantages: {
      selections:
        structuredClone(
          snapshot.advantages
            .selections,
        ),
    },

    thinBloodTraits:
      structuredClone(
        snapshot.thinBloodTraits,
      ),

    thinBloodAlchemy:
      snapshot.thinBloodAlchemy === null
        ? null
        : {
            ...snapshot.thinBloodAlchemy,
            formulaKeys: [
              ...snapshot
                .thinBloodAlchemy
                .formulaKeys,
            ],
          },
  }
}

export async function loadPersistedCharacterSheetState(
  gateway: CharacterDraftGateway,
  profilePhaseGateway: CharacterProfilePhaseGateway,
  characterId: string,
): Promise<PersistedCharacterSheetLoadResult> {
  const [
    snapshot,
    profilePhase,
  ] = await Promise.all([
    gateway.load(characterId),
    profilePhaseGateway.load(characterId),
  ])

  return {
    model:
      adaptPersistedCharacterToSheetModel(
        snapshot,
        profilePhase.phase,
      ),
    transition:
      buildTransitionReadModel(
        snapshot,
        profilePhase,
      ),
  }
}

export async function loadPersistedCharacterSheet(
  gateway: CharacterDraftGateway,
  profilePhaseGateway: CharacterProfilePhaseGateway,
  characterId: string,
): Promise<CharacterSheetModel> {
  const result =
    await loadPersistedCharacterSheetState(
      gateway,
      profilePhaseGateway,
      characterId,
    )

  return result.model
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

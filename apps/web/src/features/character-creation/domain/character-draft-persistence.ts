import type {
  CharacterDraftApiCreationMode,
} from '../types/character-draft-api.types.ts'

import {
  CharacterDraftApiError,
} from '../infrastructure/character-draft.api.ts'

import type {
  CharacterDraftGateway,
} from '../infrastructure/character-draft.api.ts'

import {
  mapCharacterDraftApiSnapshotToEditorState,
  mapCharacterDraftToCreateRequest,
  mapCharacterDraftToUpdateRequest,
} from './character-draft-api.mapper.ts'

import type {
  CharacterDraftApiEditorState,
} from './character-draft-api.mapper.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CreationStepId,
} from '../types/creation-step.types.ts'

export type CharacterDraftPersistenceUiState =
  | 'loading'
  | 'ready'
  | 'saving'
  | 'unauthorized'
  | 'not-found'
  | 'conflict'
  | 'rejected'
  | 'error'

export function stateForCharacterDraftPersistenceError(
  error: unknown,
): CharacterDraftPersistenceUiState {
  if (error instanceof CharacterDraftApiError) {
    if (error.status === 401) return 'unauthorized'
    if (error.status === 404) return 'not-found'
    if (error.status === 409) return 'conflict'
    if (error.status === 422) return 'rejected'
  }

  return 'error'
}

export function messageForCharacterDraftPersistenceState(
  state: CharacterDraftPersistenceUiState,
): string | null {
  switch (state) {
    case 'loading':
      return 'Cargando el borrador persistido…'
    case 'saving':
      return 'Guardando el borrador…'
    case 'unauthorized':
      return 'Necesitas una sesión válida para guardar este borrador.'
    case 'not-found':
      return 'El borrador no existe o no tienes permiso para abrirlo.'
    case 'conflict':
      return 'El borrador cambió en otra sesión. Recárgalo antes de guardar.'
    case 'rejected':
      return 'El backend rechazó el borrador por reglas o dependencias pendientes.'
    case 'error':
      return 'No se pudo sincronizar el borrador con el servidor.'
    case 'ready':
      return null
  }
}

export async function loadCharacterDraftEditorState(
  gateway: CharacterDraftGateway,
  characterId: string,
): Promise<CharacterDraftApiEditorState> {
  return mapCharacterDraftApiSnapshotToEditorState(
    await gateway.load(characterId),
  )
}

export async function persistCharacterDraftEditorState(
  gateway: CharacterDraftGateway,
  draft: CharacterDraft,
  currentStepId: CreationStepId,
  editorState: CharacterDraftApiEditorState | null,
  creationMode:
    CharacterDraftApiCreationMode =
      editorState?.creationMode ?? 'standard',
): Promise<CharacterDraftApiEditorState> {
  const snapshot =
    editorState === null
      ? await gateway.create(
          mapCharacterDraftToCreateRequest(
            draft,
            {
              currentStepId,
              creationMode,
            },
          ),
        )
      : await gateway.update(
          editorState.characterId,
          mapCharacterDraftToUpdateRequest(
            draft,
            {
              expectedRevision:
                editorState.revision,
              creationMode:
                editorState.creationMode,
              currentStepId,
              chronicleId:
                editorState.chronicleId,
              humanityStains:
                editorState.humanityStains,
              damage:
                editorState.damage,
            },
          ),
        )

  return mapCharacterDraftApiSnapshotToEditorState(
    snapshot,
  )
}

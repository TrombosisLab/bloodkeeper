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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function persistenceErrorDetail(error: unknown): string | null {
  if (!(error instanceof CharacterDraftApiError)) return null

  const details = error.violations.map((violation) => {
    if (typeof violation === 'string') return violation.trim()
    if (!isRecord(violation)) return null

    const message = typeof violation.message === 'string'
      ? violation.message.trim()
      : typeof violation.detail === 'string'
        ? violation.detail.trim()
        : null
    const field = typeof violation.field === 'string'
      ? violation.field.trim()
      : typeof violation.path === 'string'
        ? violation.path.trim()
        : null
    const code = typeof violation.code === 'string'
      ? violation.code.trim()
      : null
    return [field, message ?? code]
      .filter((value): value is string => value !== null && value.length > 0)
      .join(': ')
  }).filter((value): value is string => value !== null && value.length > 0)

  return details.length > 0
    ? details.join(' · ')
    : error.serverMessage?.trim() || null
}

export function messageForCharacterDraftPersistenceState(
  state: CharacterDraftPersistenceUiState,
  error: unknown = null,
): string | null {
  const message = (() => {
    switch (state) {
      case 'loading': return 'Cargando el borrador persistido…'
      case 'saving': return 'Guardando el borrador…'
      case 'unauthorized': return 'Necesitas una sesión válida para guardar este borrador.'
      case 'not-found': return 'El borrador no existe o no tienes permiso para abrirlo.'
      case 'conflict': return 'El borrador cambió en otra sesión. Recárgalo antes de guardar.'
      case 'rejected': return 'El backend rechazó el borrador por reglas o dependencias pendientes.'
      case 'error': return 'No se pudo sincronizar el borrador con el servidor.'
      case 'ready': return null
    }
  })()

  const detail = persistenceErrorDetail(error)
  if (message === null || detail === null) return message
  return `${message} Detalle: ${detail}`
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

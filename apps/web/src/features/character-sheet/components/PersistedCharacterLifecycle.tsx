import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CharacterLifecycleApiError,
  createCharacterLifecycleGateway,
} from '../infrastructure/character-lifecycle.api'

import type {
  CharacterLifecycleGateway,
} from '../infrastructure/character-lifecycle.api'

import {
  CharacterValidationApiError,
  createCharacterValidationGateway,
} from '../infrastructure/character-validation.api'

import type {
  CharacterValidationGateway,
} from '../infrastructure/character-validation.api'

import type {
  CharacterLifecycleState,
} from '../types/character-lifecycle.types'

interface PersistedCharacterLifecycleProps {
  characterId: string
  lifecycleGateway?: CharacterLifecycleGateway
  validationGateway?: CharacterValidationGateway
}

type LifecycleUiState =
  | 'loading'
  | 'ready'
  | 'checking'
  | 'saving'
  | 'blocked'
  | 'unauthorized'
  | 'not-found'
  | 'conflict'
  | 'rejected'
  | 'error'

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
} as const

function stateForError(error: unknown): LifecycleUiState {
  if (
    error instanceof CharacterLifecycleApiError ||
    error instanceof CharacterValidationApiError
  ) {
    if (error.status === 401) return 'unauthorized'
    if (error.status === 404) return 'not-found'
    if (error.status === 409) return 'conflict'
    if (error.status === 422) return 'rejected'
  }

  return 'error'
}

function messageForState(
  state: LifecycleUiState,
): string | null {
  switch (state) {
    case 'loading':
      return 'Cargando estado del personaje...'
    case 'checking':
      return 'Comprobando si el personaje puede activarse...'
    case 'saving':
      return 'Actualizando el estado del personaje...'
    case 'blocked':
      return 'La validacion global mantiene bloqueada la activacion.'
    case 'unauthorized':
      return 'Necesitas una sesion valida para cambiar este estado.'
    case 'not-found':
      return 'El personaje no existe o no tienes permiso para verlo.'
    case 'conflict':
      return 'El personaje cambio en otra sesion. Recarga antes de continuar.'
    case 'rejected':
      return 'El dominio rechazo la transicion solicitada.'
    case 'error':
      return 'No se pudo actualizar el ciclo de vida.'
    case 'ready':
      return null
  }
}

export function PersistedCharacterLifecycle({
  characterId,
  lifecycleGateway: providedLifecycleGateway,
  validationGateway: providedValidationGateway,
}: PersistedCharacterLifecycleProps) {
  const lifecycleGateway = useMemo(
    () =>
      providedLifecycleGateway ??
      createCharacterLifecycleGateway(),
    [providedLifecycleGateway],
  )
  const validationGateway = useMemo(
    () =>
      providedValidationGateway ??
      createCharacterValidationGateway(),
    [providedValidationGateway],
  )
  const [snapshot, setSnapshot] =
    useState<CharacterLifecycleState | null>(null)
  const [state, setState] =
    useState<LifecycleUiState>('loading')
  const [reloadVersion, setReloadVersion] =
    useState(0)
  const [archiveConfirmation, setArchiveConfirmation] =
    useState(false)

  useEffect(() => {
    let active = true
    setState('loading')
    setArchiveConfirmation(false)

    void lifecycleGateway
      .load(characterId)
      .then((loaded) => {
        if (!active) return
        setSnapshot(loaded)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        setSnapshot(null)
        setState(stateForError(error))
      })

    return () => {
      active = false
    }
  }, [characterId, lifecycleGateway, reloadVersion])

  const activate = useCallback(async () => {
    if (snapshot === null) return
    setState('checking')

    try {
      const report =
        await validationGateway.validate(
          characterId,
          'activation',
        )

      if (!report.canProceed) {
        setState('blocked')
        return
      }

      setState('saving')
      const transitioned =
        await lifecycleGateway.transition(
          characterId,
          snapshot.revision,
          'active',
          false,
        )

      setSnapshot({
        characterId: transitioned.characterId,
        status: transitioned.status,
        revision: transitioned.revision,
      })
      setState('ready')
    } catch (error: unknown) {
      const failedState = stateForError(error)
      if (failedState === 'conflict') {
        setSnapshot(null)
      }
      setState(failedState)
    }
  }, [
    characterId,
    lifecycleGateway,
    snapshot,
    validationGateway,
  ])

  const archive = useCallback(async () => {
    if (snapshot === null) return
    setState('saving')

    try {
      const transitioned =
        await lifecycleGateway.transition(
          characterId,
          snapshot.revision,
          'archived',
          true,
        )

      setSnapshot({
        characterId: transitioned.characterId,
        status: transitioned.status,
        revision: transitioned.revision,
      })
      setArchiveConfirmation(false)
      setState('ready')
    } catch (error: unknown) {
      const failedState = stateForError(error)
      if (failedState === 'conflict') {
        setSnapshot(null)
      }
      setState(failedState)
    }
  }, [characterId, lifecycleGateway, snapshot])

  const busy =
    state === 'loading' ||
    state === 'checking' ||
    state === 'saving'
  const message = messageForState(state)

  return (
    <section
      className="sheet-section lifecycle-section"
      aria-busy={busy}
    >
      <div className="section-title">
        <h2>Ciclo de vida</h2>
        <span>
          {snapshot === null
            ? 'Sin estado'
            : statusLabels[snapshot.status]}
        </span>
      </div>

      <div className="lifecycle-section__content">
        {message !== null ? (
          <p
            role={
              state === 'loading' ||
              state === 'checking' ||
              state === 'saving'
                ? 'status'
                : 'alert'
            }
          >
            {message}
          </p>
        ) : null}

        {snapshot !== null ? (
          <p className="lifecycle-section__revision">
            Revision {snapshot.revision}
          </p>
        ) : null}

        <div className="lifecycle-section__actions">
          {snapshot?.status === 'draft' ||
          snapshot?.status === 'archived' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void activate()
              }}
            >
              {snapshot.status === 'draft'
                ? 'Activar personaje'
                : 'Reactivar personaje'}
            </button>
          ) : null}

          {snapshot?.status === 'active' &&
          !archiveConfirmation ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setArchiveConfirmation(true)
              }
            >
              Archivar personaje
            </button>
          ) : null}

          {snapshot?.status === 'active' &&
          archiveConfirmation ? (
            <div
              className="lifecycle-section__confirmation"
              role="alert"
            >
              <span>
                El personaje dejara de estar disponible para el uso habitual.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void archive()
                }}
              >
                Confirmar archivado
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setArchiveConfirmation(false)
                }
              >
                Cancelar
              </button>
            </div>
          ) : null}

          {snapshot === null && !busy ? (
            <button
              type="button"
              onClick={() =>
                setReloadVersion(
                  (version) => version + 1,
                )
              }
            >
              Recargar estado
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

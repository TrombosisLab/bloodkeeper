import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  createEmptyCharacterSecondaryData,
} from '../domain/character-secondary-rules'

import {
  CharacterSecondaryApiError,
  createCharacterSecondaryGateway,
} from '../infrastructure/character-secondary.api'

import type {
  CharacterSecondaryGateway,
} from '../infrastructure/character-secondary.api'

import type {
  CharacterSecondaryData,
  CharacterSecondarySection,
  CharacterSecondarySnapshot,
} from '../types/character-secondary.types'

import { CharacterSecondary } from './CharacterSecondary'

type PersistenceState =
  | 'loading'
  | 'ready'
  | 'saving'
  | 'unauthorized'
  | 'not-found'
  | 'conflict'
  | 'error'

interface PersistedCharacterSecondaryProps {
  characterId: string
  gateway?: CharacterSecondaryGateway
}

function stateForError(
  error: unknown,
): PersistenceState {
  if (
    error instanceof CharacterSecondaryApiError
  ) {
    if (error.status === 401) return 'unauthorized'
    if (error.status === 404) return 'not-found'
    if (error.status === 409) return 'conflict'
  }

  return 'error'
}

function messageForState(
  state: PersistenceState,
): string | null {
  switch (state) {
    case 'loading':
      return 'Cargando información secundaria…'
    case 'saving':
      return 'Guardando cambios…'
    case 'unauthorized':
      return 'Necesitas una sesión válida para consultar esta información.'
    case 'not-found':
      return 'El personaje no existe o no tienes permiso para verlo.'
    case 'conflict':
      return 'La ficha cambió en otra sesión. Recarga antes de continuar.'
    case 'error':
      return 'No se pudo sincronizar esta sección.'
    case 'ready':
      return null
  }
}

export function PersistedCharacterSecondary({
  characterId,
  gateway: providedGateway,
}: PersistedCharacterSecondaryProps) {
  const gateway = useMemo(
    () =>
      providedGateway ??
      createCharacterSecondaryGateway(),
    [providedGateway],
  )
  const [snapshot, setSnapshot] =
    useState<CharacterSecondarySnapshot | null>(
      null,
    )
  const [state, setState] =
    useState<PersistenceState>('loading')
  const [reloadVersion, setReloadVersion] =
    useState(0)
  const saving = useRef(false)

  useEffect(() => {
    let active = true
    setState('loading')

    void gateway
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
  }, [characterId, gateway, reloadVersion])

  const persist = useCallback(
    async (
      section: CharacterSecondarySection,
      data: CharacterSecondaryData,
    ) => {
      if (snapshot === null || saving.current) {
        return
      }

      const previous = snapshot
      saving.current = true
      setSnapshot({
        ...data,
        characterId,
        revision: previous.revision,
      })
      setState('saving')

      try {
        const saved = await gateway.update(
          characterId,
          previous.revision,
          section,
          data,
        )
        setSnapshot(saved)
        setState('ready')
      } catch (error: unknown) {
        setSnapshot(previous)
        setState(stateForError(error))
      } finally {
        saving.current = false
      }
    },
    [characterId, gateway, snapshot],
  )

  const statusMessage = messageForState(state)
  const canRetry =
    state !== 'loading' &&
    state !== 'saving' &&
    state !== 'ready'

  return (
    <CharacterSecondary
      busy={
        state === 'loading' || state === 'saving'
      }
      data={
        snapshot ??
        createEmptyCharacterSecondaryData()
      }
      interactionDisabled={
        state !== 'ready' || snapshot === null
      }
      onChange={(section, data) => {
        void persist(section, data)
      }}
      status={
        statusMessage === null
          ? undefined
          : {
              message: statusMessage,
              actionLabel: canRetry
                ? 'Recargar'
                : undefined,
              onAction: canRetry
                ? () =>
                    setReloadVersion(
                      (version) => version + 1,
                    )
                : undefined,
            }
      }
    />
  )
}

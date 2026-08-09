import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createCharacterDraftGateway,
} from '../../character-creation/infrastructure/character-draft.api'

import type {
  CharacterDraftGateway,
} from '../../character-creation/infrastructure/character-draft.api'

import {
  loadPersistedCharacterSheet,
  messageForCharacterSheetLoadState,
  stateForCharacterSheetLoadError,
} from '../domain/persisted-character-sheet.loader'

import type {
  CharacterSheetLoadFailureState,
} from '../domain/persisted-character-sheet.loader'

import type {
  CharacterOperationalStateSnapshot,
} from '../types/character-state-persistence.types'

import type {
  CharacterSheetModel,
} from '../types/character-sheet-model.types'

import { CharacterSheet } from './CharacterSheet'

interface PersistedCharacterSheetProps {
  characterId: string
  gateway?: CharacterDraftGateway
}

type LoadState =
  | {
      kind: 'loading'
    }
  | {
      kind: 'ready'
      model: CharacterSheetModel
    }
  | {
      kind: CharacterSheetLoadFailureState
    }

function withOperationalState(
  model: CharacterSheetModel,
  snapshot: CharacterOperationalStateSnapshot,
): CharacterSheetModel {
  return {
    ...model,
    revision: snapshot.revision,
    status: snapshot.status,
    damage: {
      ...model.damage,
      health: {
        ...snapshot.damage.health,
      },
      willpower: {
        ...snapshot.damage.willpower,
      },
    },
    state: {
      ...model.state,
      humanity: {
        ...snapshot.humanity,
      },
      hunger: snapshot.hunger,
    },
  }
}

export function PersistedCharacterSheet({
  characterId,
  gateway,
}: PersistedCharacterSheetProps) {
  const resolvedGateway =
    useMemo(
      () =>
        gateway ??
        createCharacterDraftGateway(),
      [gateway],
    )

  const [reloadVersion, setReloadVersion] =
    useState(0)

  const [loadState, setLoadState] =
    useState<LoadState>({
      kind: 'loading',
    })

  useEffect(() => {
    let cancelled = false

    setLoadState({
      kind: 'loading',
    })

    void loadPersistedCharacterSheet(
      resolvedGateway,
      characterId,
    )
      .then((model) => {
        if (cancelled) return

        setLoadState({
          kind: 'ready',
          model,
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return

        setLoadState({
          kind:
            stateForCharacterSheetLoadError(
              error,
            ),
        })
      })

    return () => {
      cancelled = true
    }
  }, [
    characterId,
    reloadVersion,
    resolvedGateway,
  ])

  const viewState =
    loadState.kind === 'loading'
      ? 'loading'
      : loadState.kind === 'ready'
        ? 'content'
        : [
              'unauthorized',
              'not-found',
            ].includes(loadState.kind)
          ? 'permission'
          : 'error'

  if (loadState.kind === 'ready') {
    return (
      <CharacterSheet
        key={
          `${loadState.model.characterId}:` +
          loadState.model.revision
        }
        characterId={
          loadState.model.characterId
        }
        model={loadState.model}
        onStateSaved={(snapshot) => {
          setLoadState((current) =>
            current.kind === 'ready'
              ? {
                  kind: 'ready',
                  model:
                    withOperationalState(
                      current.model,
                      snapshot,
                    ),
                }
              : current,
          )
        }}
        onStateReload={() =>
          setReloadVersion(
            (version) => version + 1,
          )
        }
      />
    )
  }

  return (
    <article
      className="character-sheet"
      data-view-state={viewState}
      aria-busy={
        loadState.kind === 'loading'
      }
    >
      <header className="sheet-header">
        <div>
          <p className="sheet-header__eyebrow">
            Ficha de personaje
          </p>

          <h1>Vampiro: La Mascarada</h1>
        </div>

        <div className="sheet-header__edition">
          <span>V5</span>
        </div>
      </header>

      <p
        className="sheet-edit-notice"
        role={
          viewState === 'loading'
            ? 'status'
            : 'alert'
        }
        aria-live={
          viewState === 'loading'
            ? 'polite'
            : 'assertive'
        }
      >
        {messageForCharacterSheetLoadState(
          loadState.kind,
        )}
      </p>

      {loadState.kind !== 'loading' ? (
        <button
          type="button"
          className="sheet-header__state-edit"
          onClick={() =>
            setReloadVersion(
              (version) => version + 1,
            )
          }
        >
          Recargar ficha
        </button>
      ) : null}
    </article>
  )
}

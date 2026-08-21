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
  loadPersistedCharacterSheetState,
  messageForCharacterSheetLoadState,
  stateForCharacterSheetLoadError,
} from '../domain/persisted-character-sheet.loader'

import {
  createCharacterProfilePhaseGateway,
} from '../infrastructure/character-profile-phase.api'

import type {
  CharacterProfilePhaseGateway,
} from '../infrastructure/character-profile-phase.api'

import type {
  CharacterSheetLoadFailureState,
} from '../domain/persisted-character-sheet.loader'

import type {
  CharacterOperationalStateSnapshot,
} from '../types/character-state-persistence.types'

import type {
  CharacterSheetModel,
} from '../types/character-sheet-model.types'

import type {
  CharacterRouseCheckResult,
} from '../types/character-rouse-check-persistence.types'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types'

import { CharacterSheet } from './CharacterSheet'

interface PersistedCharacterSheetProps {
  characterId: string
  gateway?: CharacterDraftGateway
  profilePhaseGateway?: CharacterProfilePhaseGateway
}

type LoadState =
  | {
      kind: 'loading'
    }
  | {
      kind: 'ready'
      model: CharacterSheetModel
      transition:
        CharacterInitialVampireTransitionReadModel | null
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
  profilePhaseGateway,
}: PersistedCharacterSheetProps) {
  const resolvedGateway =
    useMemo(
      () =>
        gateway ??
        createCharacterDraftGateway(),
      [gateway],
    )

  const resolvedProfilePhaseGateway =
    useMemo(
      () =>
        profilePhaseGateway ??
        createCharacterProfilePhaseGateway(),
      [profilePhaseGateway],
    )

  const [reloadVersion, setReloadVersion] =
    useState(0)

  const [
    lastRouseCheckResult,
    setLastRouseCheckResult,
  ] = useState<
    CharacterRouseCheckResult | null
  >(null)

  const [loadState, setLoadState] =
    useState<LoadState>({
      kind: 'loading',
    })

  useEffect(() => {
    setLastRouseCheckResult(null)
  }, [characterId])

  useEffect(() => {
    let cancelled = false

    setLoadState({
      kind: 'loading',
    })

    void loadPersistedCharacterSheetState(
      resolvedGateway,
      resolvedProfilePhaseGateway,
      characterId,
    )
      .then((result) => {
        if (cancelled) return

        setLoadState({
          kind: 'ready',
          model: result.model,
          transition:
            result.transition,
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
    resolvedProfilePhaseGateway,
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
        lastRouseCheckResult={
          lastRouseCheckResult
        }
        onRouseCheckApplied={(result) => {
          setLastRouseCheckResult(
            result,
          )
          setReloadVersion(
            (version) => version + 1,
          )
        }}
        transition={
          loadState.transition
        }
        onStateSaved={(snapshot) => {
          setLoadState((current) =>
            current.kind === 'ready'
              ? {
                  ...current,
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

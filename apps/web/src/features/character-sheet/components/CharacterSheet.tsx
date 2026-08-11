import {
  useMemo,
  useRef,
  useState,
} from 'react'

import { demoCharacter } from '../data/demo-character'

import {
  demoHealth,
  demoWillpower,
} from '../data/demo-trackers'

import { demoState } from '../data/demo-state'

import {
  CharacterStateApiError,
  createCharacterStateGateway,
} from '../infrastructure/character-state.api'

import type {
  CharacterStateGateway,
} from '../infrastructure/character-state.api'

import type {
  CharacterOperationalStateSnapshot,
  CharacterOperationalStateUpdate,
} from '../types/character-state-persistence.types'

import type {
  CharacterSheetModel,
} from '../types/character-sheet-model.types'

import type {
  CharacterExperienceGateway,
} from '../types/character-experience.types'

import { CharacterAttributes } from './CharacterAttributes'
import { CharacterIdentity } from './CharacterIdentity'
import { CharacterSkills } from './CharacterSkills'
import { CharacterState } from './CharacterState'
import { CharacterDisciplines } from './CharacterDisciplines'
import { CharacterAdvantages } from './CharacterAdvantages'
import { CharacterNarrative } from './CharacterNarrative'
import { CharacterBloodExperience } from './CharacterBloodExperience'
import { PersistedCharacterExperience } from './PersistedCharacterExperience'
import { CharacterSecondary } from './CharacterSecondary'
import { PersistedCharacterSecondary } from './PersistedCharacterSecondary'
import { PersistedCharacterLifecycle } from './PersistedCharacterLifecycle'
import { PersistedCharacterValidation } from './PersistedCharacterValidation'

interface CharacterSheetProps {
  characterId?: string
  model?: CharacterSheetModel
  stateGateway?: CharacterStateGateway
  experienceGateway?: CharacterExperienceGateway
  onStateSaved?: (
    snapshot: CharacterOperationalStateSnapshot,
  ) => void
  onStateReload?: () => void
}

type StatePersistenceState =
  | 'ready'
  | 'saving'
  | 'unauthorized'
  | 'not-found'
  | 'conflict'
  | 'error'

function persistenceStateForError(
  error: unknown,
): StatePersistenceState {
  if (error instanceof CharacterStateApiError) {
    if (error.status === 401) return 'unauthorized'
    if (error.status === 404) return 'not-found'
    if (error.status === 409) return 'conflict'
  }

  return 'error'
}

function persistenceMessage(
  state: StatePersistenceState,
): string | null {
  switch (state) {
    case 'saving':
      return 'Guardando Salud, Voluntad, Humanidad, Manchas y Hambre…'
    case 'unauthorized':
      return 'La sesión ya no permite guardar estos estados.'
    case 'not-found':
      return 'El personaje ya no está disponible para guardar estados.'
    case 'conflict':
      return 'La ficha cambió en otra operación. Recárgala antes de continuar.'
    case 'error':
      return 'No se pudieron guardar los estados del personaje.'
    case 'ready':
      return null
  }
}

export function CharacterSheet({
  characterId,
  model,
  stateGateway,
  experienceGateway,
  onStateSaved,
  onStateReload,
}: CharacterSheetProps) {
  const persisted =
    model !== undefined

  const resolvedStateGateway =
    useMemo(
      () =>
        persisted
          ? (
              stateGateway ??
              createCharacterStateGateway()
            )
          : null,
      [persisted, stateGateway],
    )

  const [stateEditing, setStateEditing] =
    useState(false)

  const [statePersistence, setStatePersistence] =
    useState<StatePersistenceState>('ready')

  const stateSaving = useRef(false)

  const [health, setHealth] = useState(
    () => ({
      ...(
        model?.damage.health ??
        demoHealth.track
      ),
    }),
  )

  const [willpower, setWillpower] =
    useState(
      () => ({
        ...(
          model?.damage.willpower ??
          demoWillpower.track
        ),
      }),
    )

  const [humanity, setHumanity] =
    useState(
      () => ({
        ...(
          model?.state.humanity ??
          demoState.humanity
        ),
      }),
    )

  const [hunger, setHunger] =
    useState(
      () =>
        model?.state.hunger ??
        demoState.hunger,
    )

  const persistedStateEditable =
    persisted &&
    model.status !== 'archived' &&
    resolvedStateGateway !== null

  async function persistState(
    changes: CharacterOperationalStateUpdate,
    rollback: () => void,
  ): Promise<void> {
    if (
      !persistedStateEditable ||
      resolvedStateGateway === null ||
      stateSaving.current
    ) {
      return
    }

    stateSaving.current = true
    setStatePersistence('saving')

    try {
      const saved =
        await resolvedStateGateway.update(
          model.characterId,
          model.revision,
          changes,
        )

      setStatePersistence('ready')
      setStateEditing(false)
      onStateSaved?.(saved)
    } catch (error: unknown) {
      rollback()
      setStateEditing(false)
      setStatePersistence(
        persistenceStateForError(error),
      )
    } finally {
      stateSaving.current = false
    }
  }

  function handleHealthChange(
    nextHealth: typeof health,
  ): void {
    if (!persisted) {
      setHealth(nextHealth)
      return
    }

    if (!stateEditing) return

    const previous = health
    setHealth(nextHealth)

    void persistState(
      {
        damage: {
          health: nextHealth,
          willpower,
        },
      },
      () => setHealth(previous),
    )
  }

  function handleWillpowerChange(
    nextWillpower: typeof willpower,
  ): void {
    if (!persisted) {
      setWillpower(nextWillpower)
      return
    }

    if (!stateEditing) return

    const previous = willpower
    setWillpower(nextWillpower)

    void persistState(
      {
        damage: {
          health,
          willpower: nextWillpower,
        },
      },
      () => setWillpower(previous),
    )
  }

  function handleHumanityChange(
    nextHumanity: typeof humanity,
  ): void {
    if (!persisted) {
      setHumanity(nextHumanity)
      return
    }

    if (!stateEditing) return

    const previous = humanity
    setHumanity(nextHumanity)

    void persistState(
      {
        humanityValue:
          nextHumanity.value,
        humanityStains:
          nextHumanity.stains,
      },
      () => setHumanity(previous),
    )
  }

  function handleHungerChange(
    nextHunger: number,
  ): void {
    if (!persisted) {
      setHunger(nextHunger)
      return
    }

    if (!stateEditing) return

    const previous = hunger
    setHunger(nextHunger)

    void persistState(
      { hunger: nextHunger },
      () => setHunger(previous),
    )
  }

  const persistenceStatus =
    persistenceMessage(statePersistence)

  const canRetryPersistence =
    persisted &&
    statePersistence !== 'ready' &&
    statePersistence !== 'saving' &&
    onStateReload !== undefined

  return (
    <article className="character-sheet">
      <header className="sheet-header">
        <div>
          <p className="sheet-header__eyebrow">
            Ficha de personaje
          </p>

          <h1>Vampiro: La Mascarada</h1>
        </div>

        <div className="sheet-header__actions">
          {(
            !persisted ||
            persistedStateEditable
          ) ? (
            <button
              type="button"
              className="sheet-header__state-edit"
              aria-pressed={stateEditing}
              disabled={
                statePersistence === 'saving'
              }
              onClick={() =>
                setStateEditing(
                  (editing) => !editing,
                )
              }
            >
              {stateEditing
                ? 'Finalizar edición'
                : 'Editar estados'}
            </button>
          ) : null}

          <div className="sheet-header__edition">
            <span>V5</span>
          </div>
        </div>
      </header>

      {persisted ? (
        <div
          className="sheet-edit-notice"
          role="status"
          aria-live="polite"
        >
          <span>
            {persistenceStatus ??
              (
                model.status === 'archived'
                  ? (
                      `Ficha persistida · revisión ${model.revision} · archivada · estados en solo lectura`
                    )
                  : stateEditing
                    ? (
                        'Edición persistida de Salud, Voluntad, Humanidad, Manchas y Hambre.'
                      )
                    : (
                        `Ficha persistida · revisión ${model.revision}`
                      )
              )}
          </span>

          {canRetryPersistence ? (
            <>
              {' '}
              <button
                type="button"
                className="sheet-header__state-edit"
                onClick={onStateReload}
              >
                Recargar ficha
              </button>
            </>
          ) : null}
        </div>
      ) : stateEditing ? (
        <p
          className="sheet-edit-notice"
          role="status"
        >
          Edición local de demostración. Los cambios no
          se guardan.
        </p>
      ) : null}

      <CharacterIdentity
        character={
          model?.identity ??
          demoCharacter
        }
      />

      <CharacterAttributes
        attributes={model?.attributes}
        health={health}
        healthCapacity={
          model?.damage.healthCapacity
        }
        willpower={willpower}
        willpowerCapacity={
          model?.damage.willpowerCapacity
        }
        stateEditing={stateEditing}
        onHealthChange={handleHealthChange}
        onWillpowerChange={
          handleWillpowerChange
        }
      />

      <CharacterSkills
        skills={model?.skills}
      />

      <CharacterState
        humanity={humanity}
        hunger={hunger}
        bloodPotency={
          model?.state.bloodPotency
        }
        stateEditing={stateEditing}
        hungerEditing={
          stateEditing
        }
        onHumanityChange={
          handleHumanityChange
        }
        onHungerChange={
          handleHungerChange
        }
      />

      <CharacterDisciplines
        disciplines={model?.disciplines}
      />

      <CharacterAdvantages
        advantages={model?.advantages}
      />

      <CharacterNarrative
        narrative={model?.narrative}
      />

      {persisted &&
      characterId !== undefined &&
      model.availability.bloodExperience ? (
        <PersistedCharacterExperience
          characterId={characterId}
          revision={model.revision}
          status={model.status}
          advantages={model.advantages}
          gateway={experienceGateway}
          onPurchased={onStateReload}
        />
      ) : (
        <CharacterBloodExperience
          available={
            model?.availability
              .bloodExperience ??
            true
          }
        />
      )}

      {characterId ? (
        <>
          <PersistedCharacterValidation
            characterId={characterId}
          />
          <PersistedCharacterLifecycle
            characterId={characterId}
          />
        </>
      ) : null}

      {characterId ? (
        <PersistedCharacterSecondary
          characterId={characterId}
        />
      ) : (
        <CharacterSecondary />
      )}
    </article>
  )
}

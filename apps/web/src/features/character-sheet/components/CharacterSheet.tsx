import { renderSafeNode } from './renderSafeNode'
import { createPortal } from 'react-dom'
import { displayValue } from './displayValue'
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
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types'

import type {
  CharacterExperienceGateway,
} from '../types/character-experience.types'

import type {
  CharacterRouseCheckGateway,
  CharacterRouseCheckResult,
} from '../types/character-rouse-check-persistence.types'

import { CharacterAttributes } from './CharacterAttributes'
import { CharacterTrackers } from './CharacterTrackers'
import { CharacterIdentity } from './CharacterIdentity'
import { CharacterSkills } from './CharacterSkills'
import { CharacterState } from './CharacterState'
import { CharacterDisciplines } from './CharacterDisciplines'
import { CharacterAdvantages } from './CharacterAdvantages'
import { CharacterNarrative } from './CharacterNarrative'
import { CharacterBloodExperience } from './CharacterBloodExperience'
import { CharacterQuickNotes } from './CharacterQuickNotes'
import { PersistedCharacterFeeding } from './PersistedCharacterFeeding'
import { PersistedCharacterRouseCheck } from './PersistedCharacterRouseCheck'
import { PersistedCharacterExperience } from './PersistedCharacterExperience'
import { CharacterSecondary } from './CharacterSecondary'
import { PersistedCharacterSecondary } from './PersistedCharacterSecondary'
import { PersistedCharacterLifecycle } from './PersistedCharacterLifecycle'
import { PersistedCharacterValidation } from './PersistedCharacterValidation'
import { PersistedCharacterEmbrace } from './PersistedCharacterEmbrace'
import { PersistedInitialVampireTransition } from './PersistedInitialVampireTransition'

import { PersistedCharacterPdfExport } from './PersistedCharacterPdfExport'

import '../../../styles/character-sheet-redesign.css'

import type {
  CharacterBlushOfLifeResult,
} from '../types/character-blush-of-life-persistence.types'

interface CharacterSheetProps {
  characterId?: string
  model?: CharacterSheetModel
  transition?:
    CharacterInitialVampireTransitionReadModel | null
  stateGateway?: CharacterStateGateway
  experienceGateway?: CharacterExperienceGateway
  rouseCheckGateway?: CharacterRouseCheckGateway
  lastRouseCheckResult?:
    CharacterRouseCheckResult | null
  onRouseCheckApplied?: (
    result: CharacterRouseCheckResult,
  ) => void
  lastBlushOfLifeResult?:
    CharacterBlushOfLifeResult | null
  onBlushOfLifeApplied?: (
    result: CharacterBlushOfLifeResult,
  ) => void
  onStateSaved?: (
    snapshot: CharacterOperationalStateSnapshot,
  ) => void
  onStateReload?: () => void
  readOnly?: boolean
}

type CharacterSheetSection =
  | 'identity'
  | 'skills'
  | 'disciplines'
  | 'advantages'
  | 'story'
  | 'inventory'
  | 'status'

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
  hasHunger: boolean,
): string | null {
  switch (state) {
    case 'saving':
      return hasHunger
        ? 'Guardando Salud, Voluntad, Humanidad, Manchas y Hambre…'
        : 'Guardando Salud, Voluntad, Humanidad y Manchas…'
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
  transition,
  stateGateway,
  experienceGateway,
  rouseCheckGateway,
  lastRouseCheckResult = null,
  onRouseCheckApplied,
  onStateSaved,
  onStateReload,
  readOnly = false,
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


  const [activeSection, setActiveSection] =
    useState<CharacterSheetSection>('identity')

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
    useState<number | null>(
      () =>
        model === undefined
          ? demoState.hunger
          : model.state.hunger,
    )

  const persistedStateEditable =
    persisted &&
    !readOnly &&
    model.status !== 'archived' &&
    resolvedStateGateway !== null

  const hasHunger =
    hunger !== null

  const profilePhase =
    model?.profilePhase

  const showDisciplines =
    !persisted ||
    model.profilePhase ===
      'ESTABLISHED_VAMPIRE' ||
    (
      model.profilePhase ===
        'TRANSITIONAL_VAMPIRE' &&
      model.disciplines.length > 0
    )

  const phaseNotice =
    !persisted
      ? null
      : model.profilePhase === 'HUMAN'
        ? (
            'Personaje humano · sin Hambre, Potencia de Sangre ni rasgos vampíricos.'
          )
        : model.profilePhase ===
            'TRANSITIONAL_VAMPIRE'
          ? (
              'Vampiro en transición · sólo se muestran los recursos ya disponibles; lo pendiente no se sustituye por valores ficticios.'
            )
          : null

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
    persistenceMessage(
      statePersistence,
      hasHunger,
    )

  const canRetryPersistence =
    persisted &&
    !readOnly &&
    statePersistence !== 'ready' &&
    statePersistence !== 'saving' &&
    onStateReload !== undefined

  return (
    <article
      className="character-sheet character-sheet--dashboard"
      data-profile-phase={profilePhase ?? 'DEMO'}
    >
      {/* BLOODKEEPER_CHARACTER_SHEET_DASHBOARD_V11 */}
      {typeof document !== 'undefined' &&
      document.getElementById('character-sheet-page-actions') !== null
        ? createPortal(
            <div className="character-sheet__header-actions">
              {(!persisted || persistedStateEditable) ? (
                <button
                  type="button"
                  className="sheet-header__state-edit"
                  aria-pressed={stateEditing}
                  disabled={statePersistence === 'saving'}
                  onClick={() => setStateEditing((editing) => !editing)}
                >
                  {stateEditing ? 'Finalizar edición' : 'Editar estados'}
                </button>
              ) : null}

              {characterId !== undefined ? (
                <PersistedCharacterPdfExport characterId={characterId} />
              ) : null}
            </div>,
            document.getElementById('character-sheet-page-actions')!,
          )
        : null}

      {phaseNotice !== null ? (
        <p className="sheet-phase-notice" role="status">
          {renderSafeNode(phaseNotice)}
        </p>
      ) : null}

      {persisted &&
      (persistenceStatus !== null ||
        canRetryPersistence ||
        stateEditing ||
        model.status === 'archived') ? (
        <div className="sheet-edit-notice" role="status" aria-live="polite">
          <span>
            {persistenceStatus ??
              (model.status === 'archived'
                ? `Ficha persistida · revisión ${model.revision} · archivada · estados en solo lectura`
                : stateEditing
                  ? hasHunger
                    ? 'Edición persistida de Salud, Voluntad, Humanidad, Manchas y Hambre.'
                    : 'Edición persistida de Salud, Voluntad, Humanidad y Manchas.'
                  : `Ficha persistida · revisión ${model.revision}`)}
          </span>

          {canRetryPersistence ? (
            <button
              type="button"
              className="sheet-header__state-edit"
              onClick={onStateReload}
            >
              Recargar ficha
            </button>
          ) : null}
        </div>
      ) : stateEditing ? (
        <p className="sheet-edit-notice" role="status">
          Edición local de demostración. Los cambios no se guardan.
        </p>
      ) : null}

      <section className="character-sheet__identity-stage" aria-label="Resumen del personaje">
        <CharacterIdentity
          characterId={characterId}
          character={model?.identity ?? demoCharacter}
          profilePhase={profilePhase}
        />

        <div className="character-sheet__state-panel">
          <CharacterState
            humanity={humanity}
            hunger={hunger}
            bloodPotency={model?.state.bloodPotency}
            profilePhase={profilePhase}
            stateEditing={stateEditing}
            hungerEditing={stateEditing && hasHunger}
            onHumanityChange={handleHumanityChange}
            onHungerChange={handleHungerChange}
          />
        </div>
      </section>

      <section
        className={stateEditing ? 'character-sheet__compact-state-strip is-editing' : 'character-sheet__compact-state-strip'}
        aria-label="Estado actual del personaje"
      >
        <CharacterTrackers
          health={health}
          healthCapacity={model?.damage.healthCapacity}
          willpower={willpower}
          willpowerCapacity={model?.damage.willpowerCapacity}
          stateEditing={stateEditing}
          onHealthChange={handleHealthChange}
          onWillpowerChange={handleWillpowerChange}
        />

        <CharacterState
          humanity={humanity}
          hunger={hunger}
          bloodPotency={model?.state.bloodPotency}
          profilePhase={profilePhase}
          stateEditing={stateEditing}
          hungerEditing={stateEditing && hasHunger}
          onHumanityChange={handleHumanityChange}
          onHungerChange={handleHungerChange}
        />
      </section>

      <nav className="character-sheet__section-nav" aria-label="Secciones de la ficha">
        {([
          ['identity', 'Identidad'],
          ['skills', 'Habilidades'],
          ['disciplines', 'Disciplinas'],
          ['advantages', 'Ventajas'],
          ['story', 'Historia'],
          ['inventory', 'Inventario'],
          ['status', 'Estado'],
        ] as const).map(([section, label]) => (
          <button
            key={section}
            type="button"
            className={activeSection === section ? 'is-active' : undefined}
            aria-pressed={activeSection === section}
            onClick={() => setActiveSection(section)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="character-sheet__active-view" data-active-section={activeSection}>
        {activeSection === 'identity' ? (
          <>
            <section className="character-sheet__core-stage" aria-label="Atributos y marcadores">
              <div className="character-sheet__attributes-panel">
                <CharacterAttributes
                  attributes={model?.attributes}
                  health={health}
                  healthCapacity={model?.damage.healthCapacity}
                  willpower={willpower}
                  willpowerCapacity={model?.damage.willpowerCapacity}
                  stateEditing={stateEditing}
                  onHealthChange={handleHealthChange}
                  onWillpowerChange={handleWillpowerChange}
                />
              </div>
            </section>

            <section className="character-sheet__powers-stage" aria-label="Poderes, ventajas y acciones">
              <div className="character-sheet__disciplines-panel">
                {showDisciplines ? (
                  <CharacterDisciplines disciplines={model?.disciplines} />
                ) : null}
              </div>

              <div className="character-sheet__advantages-panel">
                <CharacterAdvantages advantages={model?.advantages} />
              </div>

              <div className="character-sheet__blood-panel">
                {persisted && model.nature === 'vampire' ? (
                  <CharacterBloodExperience
                    blood={model.blood}
                    actions={
                      characterId !== undefined &&
                      model.blood !== null &&
                      model.state.hunger !== null &&
                      model.status !== 'archived' &&
                      onStateReload !== undefined ? (
                        <div className="blood-quick-actions">
                          {onRouseCheckApplied !== undefined ? (
                            <PersistedCharacterRouseCheck
                              characterId={characterId}
                              revision={model.revision}
                              hunger={model.state.hunger}
                              result={lastRouseCheckResult}
                              gateway={rouseCheckGateway}
                              onApplied={onRouseCheckApplied}
                              onConflictReload={onStateReload}
                            />
                          ) : null}
                          <PersistedCharacterFeeding
                            characterId={characterId}
                            revision={model.revision}
                            hunger={model.state.hunger}
                            onApplied={onStateReload}
                          />
                        </div>
                      ) : undefined
                    }
                  />
                ) : null}
                                <CharacterQuickNotes characterId={characterId} />

              </div>
            </section>
          </>
        ) : null}

        {activeSection === 'skills' ? (
          <section className="character-sheet__single-stage" aria-labelledby="skills-title">
            <CharacterSkills skills={model?.skills} />
          </section>
        ) : null}

        {activeSection === 'disciplines' ? (
          <section className="character-sheet__single-stage">
            {showDisciplines ? (
              <CharacterDisciplines disciplines={model?.disciplines} />
            ) : (
              <p className="character-sheet__empty">Las disciplinas todavía no están disponibles.</p>
            )}
          </section>
        ) : null}

        {activeSection === 'advantages' ? (
          <section className="character-sheet__single-stage">
            <CharacterAdvantages advantages={model?.advantages} />
          </section>
        ) : null}

        {activeSection === 'story' ? (
          <section className="character-sheet__single-stage" aria-labelledby="narrative-title">
            <CharacterNarrative narrative={model?.narrative} />
          </section>
        ) : null}

        {activeSection === 'status' ? (
          <section className="character-sheet__single-stage character-sheet__status-stage">
            {persisted && characterId !== undefined && model.availability.bloodExperience ? (
              <PersistedCharacterExperience
                characterId={characterId}
                revision={model.revision}
                status={model.status}
                advantages={model.advantages}
                profilePhase={model.profilePhase}
                blood={model.blood}
                gateway={experienceGateway}
                onPurchased={onStateReload}
              />
            ) : null}

            {characterId && !readOnly ? (
              <>
                {model?.profilePhase === 'HUMAN' &&
                model.status !== 'archived' &&
                onStateReload !== undefined ? (
                  <PersistedCharacterEmbrace
                    characterId={characterId}
                    revision={model.revision}
                    onEmbraced={onStateReload}
                  />
                ) : null}

                {model?.profilePhase === 'TRANSITIONAL_VAMPIRE' &&
                model.status !== 'archived' &&
                transition !== undefined &&
                transition !== null &&
                onStateReload !== undefined ? (
                  <PersistedInitialVampireTransition
                    transition={transition}
                    onResolved={onStateReload}
                  />
                ) : null}

                <PersistedCharacterLifecycle characterId={characterId} />
                <PersistedCharacterValidation characterId={characterId} />
              </>
            ) : null}
          </section>
        ) : null}

        {activeSection === 'inventory' ? (
          <section className="character-sheet__single-stage">
            {characterId && !readOnly ? (
              <PersistedCharacterSecondary characterId={characterId} />
            ) : (
              <CharacterSecondary />
            )}
          </section>
        ) : null}
      </div>
    </article>
  )
}

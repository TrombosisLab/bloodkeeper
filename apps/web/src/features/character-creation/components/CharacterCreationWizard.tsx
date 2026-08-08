import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { creationSteps } from '../data/creation-steps'
import { initialCharacterDraft } from '../data/initial-character-draft'

import {
  buildStepValidationMap,
} from '../domain/step-validation'

import {
  loadCharacterDraftEditorState,
  messageForCharacterDraftPersistenceState,
  persistCharacterDraftEditorState,
  stateForCharacterDraftPersistenceError,
} from '../domain/character-draft-persistence'

import type {
  CharacterDraftPersistenceUiState,
} from '../domain/character-draft-persistence'

import {
  createCharacterDraftGateway,
} from '../infrastructure/character-draft.api'

import type {
  CharacterDraftGateway,
} from '../infrastructure/character-draft.api'

import {
  CharacterLifecycleApiError,
  createCharacterLifecycleGateway,
} from '../../character-sheet/infrastructure/character-lifecycle.api'

import type {
  CharacterLifecycleGateway,
} from '../../character-sheet/infrastructure/character-lifecycle.api'

import {
  CharacterValidationApiError,
  createCharacterValidationGateway,
} from '../../character-sheet/infrastructure/character-validation.api'

import type {
  CharacterValidationGateway,
} from '../../character-sheet/infrastructure/character-validation.api'

import type {
  CharacterValidationReport,
} from '../../character-sheet/types/character-validation.types'

import type {
  CharacterDraftApiEditorState,
} from '../domain/character-draft-api.mapper'

import {
  applyCharacterDraftUpdate,
} from '../domain/blood-sorcery-ritual-draft-rules'

import {
  normalizeCharacterDraftOblivionCeremonies,
} from '../domain/oblivion-ceremony-draft-rules'

import {
  removeInvalidSpecialties,
} from '../domain/skill-specialty-rules'

import {
  normalizeCharacterDraft,
} from '../domain/character-draft-normalization'

import {
  resolvePredatorTypeBonusSkillKey,
  resolvePredatorTypeCreationSkills,
  resolvePredatorTypeEffectiveSkills,
} from '../domain/predator-type-skill-grant-rules'


import type {
  CharacterDraft,
} from '../types/character-draft.types'

import type {
  CharacterSkillsDraft,
} from '../types/character-skills-draft.types'

import type {
  CreationStepId,
} from '../types/creation-step.types'

import { AttributesStep } from './AttributesStep'
import { CreationProgress } from './CreationProgress'
import { CreationStepPlaceholder } from './CreationStepPlaceholder'
import { IdentityStep } from './IdentityStep'
import { SkillsStep } from './SkillsStep'
import { BloodStep } from './BloodStep'
import { DisciplinesStep } from './DisciplinesStep'
import { AdvantagesStep } from './AdvantagesStep'
import { HumanityStep } from './HumanityStep'
import { ReviewStep } from './ReviewStep'

type ReviewUiState =
  | 'idle'
  | 'checking'
  | 'blocked'
  | 'ready'
  | 'finalizing'
  | 'finalized'
  | 'error'

interface CharacterCreationWizardProps {
  onBackToSheet: () => void
  characterId?: string | null
  onCharacterPersisted?: (
    characterId: string,
  ) => void
  gateway?: CharacterDraftGateway
  lifecycleGateway?: CharacterLifecycleGateway
  validationGateway?: CharacterValidationGateway
}

function reviewErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof CharacterLifecycleApiError ||
    error instanceof CharacterValidationApiError
  ) {
    if (error.status === 401) {
      return 'Necesitas una sesión válida para finalizar este personaje.'
    }

    if (error.status === 404) {
      return 'El personaje no existe o ya no está disponible.'
    }

    if (error.status === 409) {
      return 'El personaje cambió en otra sesión. Recarga el borrador antes de continuar.'
    }

    if (error.status === 422) {
      return 'La validación global rechazó la finalización del personaje.'
    }
  }

  return 'No se pudo completar la revisión final.'
}

export function CharacterCreationWizard({
  onBackToSheet,
  characterId = null,
  onCharacterPersisted,
  gateway: providedGateway,
  lifecycleGateway: providedLifecycleGateway,
  validationGateway: providedValidationGateway,
}: CharacterCreationWizardProps) {
  const gateway = useMemo(
    () =>
      providedGateway ??
      createCharacterDraftGateway(),
    [providedGateway],
  )

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

  const [
    editorState,
    setEditorState,
  ] = useState<CharacterDraftApiEditorState | null>(
    null,
  )

  const [
    persistenceState,
    setPersistenceState,
  ] = useState<CharacterDraftPersistenceUiState>(
    characterId === null
      ? 'ready'
      : 'loading',
  )

  const [
    reloadVersion,
    setReloadVersion,
  ] = useState(0)

  const [
    hasUnsavedChanges,
    setHasUnsavedChanges,
  ] = useState(false)

  const loadedCharacterIdRef =
    useRef<string | null>(null)
  const [currentStepId, setCurrentStepId] =
    useState<CreationStepId>('identity')

  const [draft, setDraft] =
    useState<CharacterDraft>(
      initialCharacterDraft,
    )

  const [showValidation, setShowValidation] =
    useState(false)

  const [
    reviewReport,
    setReviewReport,
  ] = useState<CharacterValidationReport | null>(
    null,
  )

  const [
    reviewRevision,
    setReviewRevision,
  ] = useState<number | null>(null)

  const [
    reviewState,
    setReviewState,
  ] = useState<ReviewUiState>('idle')

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState<string | null>(null)

  const currentIndex = creationSteps.findIndex(
    (step) => step.id === currentStepId,
  )

  const currentStep =
    creationSteps[currentIndex]

  const isFirst =
    currentIndex === 0

  const isLast =
    currentIndex === creationSteps.length - 1

  const validations = useMemo(
    () =>
      buildStepValidationMap(draft),
    [draft],
  )

  const currentValidation =
    validations[currentStepId]

  const persistenceBusy =
    persistenceState === 'loading' ||
    persistenceState === 'saving'

  const reviewBusy =
    reviewState === 'checking' ||
    reviewState === 'finalizing'

  const interactionBusy =
    persistenceBusy ||
    reviewBusy

  const persistenceMessage =
    messageForCharacterDraftPersistenceState(
      persistenceState,
    )

  const canRetryPersistence =
    ![
      'ready',
      'loading',
      'saving',
    ].includes(persistenceState)

  const persistenceViewState =
    persistenceBusy
      ? 'loading'
      : [
            'unauthorized',
            'not-found',
          ].includes(persistenceState)
        ? 'permission'
        : persistenceState === 'ready'
          ? 'content'
          : 'error'

  useEffect(() => {
    if (characterId === null) {
      setPersistenceState('ready')
      return
    }

    if (
      loadedCharacterIdRef.current ===
      characterId
    ) {
      return
    }

    let active = true
    setPersistenceState('loading')

    void loadCharacterDraftEditorState(
      gateway,
      characterId,
    )
      .then((loaded) => {
        if (!active) return

        const normalizedDraft =
          normalizeCharacterDraft(
            loaded.draft,
          )

        const normalizationChanged =
          JSON.stringify(
            normalizedDraft,
          ) !==
          JSON.stringify(
            loaded.draft,
          )

        const normalizedLoaded = {
          ...loaded,
          draft: normalizedDraft,
        }

        loadedCharacterIdRef.current =
          normalizedLoaded.characterId
        setEditorState(normalizedLoaded)
        setDraft(normalizedDraft)
        setCurrentStepId(
          normalizedLoaded.currentStepId,
        )
        setShowValidation(false)
        setReviewReport(null)
        setReviewRevision(null)
        setReviewState('idle')
        setReviewMessage(null)
        setHasUnsavedChanges(
          normalizationChanged,
        )
        setPersistenceState('ready')
        onCharacterPersisted?.(
          loaded.characterId,
        )
      })
      .catch((error: unknown) => {
        if (!active) return

        setPersistenceState(
          stateForCharacterDraftPersistenceError(
            error,
          ),
        )
      })

    return () => {
      active = false
    }
  }, [
    characterId,
    gateway,
    onCharacterPersisted,
    reloadVersion,
  ])

  async function persistDraft():
    Promise<CharacterDraftApiEditorState | null> {
    if (persistenceState !== 'ready') {
      return null
    }

    setPersistenceState('saving')

    try {
      const persisted =
        await persistCharacterDraftEditorState(
          gateway,
          draft,
          currentStepId,
          editorState,
        )

      loadedCharacterIdRef.current =
        persisted.characterId
      setEditorState(persisted)
      setDraft(persisted.draft)
      setCurrentStepId(
        persisted.currentStepId,
      )
      setShowValidation(false)
      setHasUnsavedChanges(false)
      setPersistenceState('ready')
      onCharacterPersisted?.(
        persisted.characterId,
      )

      return persisted
    } catch (error: unknown) {
      setPersistenceState(
        stateForCharacterDraftPersistenceError(
          error,
        ),
      )

      return null
    }
  }

  function invalidateReview() {
    setReviewReport(null)
    setReviewRevision(null)
    setReviewState('idle')
    setReviewMessage(null)
  }

  function retryPersistence() {
    invalidateReview()

    const persistedCharacterId =
      editorState?.characterId ??
      characterId

    if (persistedCharacterId === null) {
      setPersistenceState('ready')
      return
    }

    loadedCharacterIdRef.current = null
    setReloadVersion(
      (version) => version + 1,
    )
  }

  function changeCurrentStep(
    stepId: CreationStepId,
  ) {
    if (
      interactionBusy ||
      stepId === currentStepId
    ) {
      return
    }

    invalidateReview()
    setHasUnsavedChanges(true)
    setCurrentStepId(stepId)
  }

  function updateDraft(
    updater: (
      current: CharacterDraft,
    ) => CharacterDraft,
    creationSkills?: CharacterSkillsDraft,
  ) {
    if (interactionBusy) {
      return
    }

    invalidateReview()
    setHasUnsavedChanges(true)

    setDraft(
      (current) =>
        creationSkills === undefined
          ? applyCharacterDraftUpdate(
              current,
              updater,
            )
          : applyCharacterDraftUpdate(
              current,
              updater,
              {
                creationSkills,
              },
            ),
    )
  }

  function navigateTo(
    stepId: CreationStepId,
  ) {
    const targetIndex =
      creationSteps.findIndex(
        (step) => step.id === stepId,
      )

    if (targetIndex <= currentIndex) {
      setShowValidation(false)
      changeCurrentStep(stepId)
      return
    }

    for (
      let index = currentIndex;
      index < targetIndex;
      index += 1
    ) {
      const step =
        creationSteps[index]

      if (!validations[step.id].valid) {
        setShowValidation(true)
        changeCurrentStep(step.id)
        return
      }
    }

    setShowValidation(false)
    changeCurrentStep(stepId)
  }

  function canNavigateTo(
    stepId: CreationStepId,
  ): boolean {
    if (interactionBusy) {
      return stepId === currentStepId
    }

    const targetIndex =
      creationSteps.findIndex(
        (step) => step.id === stepId,
      )

    if (targetIndex <= currentIndex) {
      return true
    }

    for (
      let index = currentIndex;
      index < targetIndex;
      index += 1
    ) {
      const step =
        creationSteps[index]

      if (!validations[step.id].valid) {
        return false
      }
    }

    return true
  }

  function goPrevious() {
    if (isFirst) {
      return
    }

    setShowValidation(false)

    changeCurrentStep(
      creationSteps[
        currentIndex - 1
      ].id,
    )
  }

  function goNext() {
    if (isLast) {
      return
    }

    if (!currentValidation.valid) {
      setShowValidation(true)
      return
    }

    setShowValidation(false)

    changeCurrentStep(
      creationSteps[
        currentIndex + 1
      ].id,
    )
  }

  async function checkReview() {
    if (
      currentStepId !== 'review' ||
      interactionBusy
    ) {
      return
    }

    if (
      editorState !== null &&
      editorState.status !== 'draft'
    ) {
      setReviewState(
        editorState.status === 'active'
          ? 'finalized'
          : 'error',
      )
      setReviewMessage(
        editorState.status === 'active'
          ? 'El personaje ya está finalizado.'
          : 'Un personaje archivado no puede finalizarse desde el creador.',
      )
      return
    }

    setReviewReport(null)
    setReviewRevision(null)
    setReviewState('checking')
    setReviewMessage(
      'Guardando y comprobando el personaje...',
    )

    const persisted =
      await persistDraft()

    if (persisted === null) {
      setReviewState('error')
      setReviewMessage(
        'No se pudo guardar el borrador antes de la validación final.',
      )
      return
    }

    try {
      const report =
        await validationGateway.validate(
          persisted.characterId,
          'activation',
        )

      setReviewReport(report)
      setReviewRevision(
        persisted.revision,
      )

      if (report.canProceed) {
        setReviewState('ready')
        setReviewMessage(
          'La validación global permite finalizar el personaje.',
        )
      } else {
        setReviewState('blocked')
        setReviewMessage(
          'El personaje todavía tiene errores o decisiones pendientes.',
        )
      }
    } catch (error: unknown) {
      setReviewState('error')
      setReviewMessage(
        reviewErrorMessage(error),
      )
    }
  }

  async function finalizeReview() {
    if (
      reviewState !== 'ready' ||
      reviewReport?.canProceed !== true ||
      editorState === null ||
      editorState.status !== 'draft' ||
      hasUnsavedChanges ||
      reviewRevision !== editorState.revision ||
      interactionBusy
    ) {
      return
    }

    setReviewState('finalizing')
    setReviewMessage(
      'Finalizando personaje...',
    )

    try {
      const transitioned =
        await lifecycleGateway.transition(
          editorState.characterId,
          editorState.revision,
          'active',
          false,
        )

      setEditorState(
        (current) =>
          current === null
            ? current
            : {
                ...current,
                status:
                  transitioned.status,
                revision:
                  transitioned.revision,
              },
      )

      if (transitioned.validation !== null) {
        setReviewReport(
          transitioned.validation,
        )
      }

      setReviewRevision(
        transitioned.revision,
      )
      setHasUnsavedChanges(false)
      setReviewState('finalized')
      setReviewMessage(
        'Personaje finalizado correctamente.',
      )
      onCharacterPersisted?.(
        transitioned.characterId,
      )
    } catch (error: unknown) {
      setReviewState('error')
      setReviewMessage(
        reviewErrorMessage(error),
      )
    }
  }

  const canFinalizeReview =
    currentStepId === 'review' &&
    reviewState === 'ready' &&
    reviewReport?.canProceed === true &&
    editorState !== null &&
    editorState.status === 'draft' &&
    !hasUnsavedChanges &&
    reviewRevision === editorState.revision

  const persistenceSummary =
    editorState === null
      ? 'Borrador local sin guardar'
      : hasUnsavedChanges
        ? `Cambios pendientes · revisión ${editorState.revision}`
        : `Guardado · revisión ${editorState.revision}`

  return (
    <section
      className="creation-page"
      data-view-state={persistenceViewState}
      aria-busy={interactionBusy}
    >
      <header className="creation-header">
        <div>
          <p className="creation-header__eyebrow">
            Vampiro: La Mascarada V5
          </p>

          <h1>Crear personaje</h1>

          <p className="creation-header__description">
            Construye el personaje paso a paso.
            Cada fase completará una parte de su ficha.
          </p>
        </div>

        <div>
          <p aria-live="polite">
            <strong>
              {persistenceSummary}
            </strong>
          </p>

          {persistenceMessage !== null ? (
            <p
              role={
                persistenceViewState ===
                'loading'
                  ? 'status'
                  : 'alert'
              }
              aria-live={
                persistenceViewState ===
                'loading'
                  ? 'polite'
                  : 'assertive'
              }
            >
              {persistenceMessage}
            </p>
          ) : null}

          <div className="creation-actions">
            <button
              type="button"
              className="creation-button creation-button--primary"
              disabled={
                persistenceState !== 'ready' ||
                reviewBusy
              }
              onClick={() => {
                void persistDraft()
              }}
            >
              {persistenceState === 'saving'
                ? 'Guardando…'
                : editorState === null
                  ? 'Crear borrador'
                  : 'Guardar cambios'}
            </button>

            {canRetryPersistence ? (
              <button
                type="button"
                className="creation-button creation-button--secondary"
                onClick={retryPersistence}
              >
                Recargar borrador
              </button>
            ) : null}

            <button
              type="button"
              className="creation-header__back"
              onClick={onBackToSheet}
              disabled={interactionBusy}
            >
              Ver ficha
            </button>
          </div>
        </div>
      </header>

      <div className="creation-layout">
        <aside className="creation-sidebar">
          <div className="creation-sidebar__heading">
            <span>Progreso</span>

            <strong>
              {currentStep.number}
              {' / '}
              {creationSteps.length}
            </strong>
          </div>

          <CreationProgress
            steps={creationSteps}
            currentStepId={currentStepId}
            onSelect={navigateTo}
            canNavigateTo={
              canNavigateTo
            }
          />
        </aside>

        <section className="creation-workspace">
          {currentStepId === 'identity' ? (
            <IdentityStep
              value={draft.identity}
              choiceSelections={
                draft.predatorTypeChoices ?? {}
              }
              advantages={
                draft.advantages
              }
              onAdvantagesChange={(
                advantages,
              ) =>
                updateDraft(
                  current => ({
                    ...current,
                    advantages,
                  }),
                )
              }
              onChange={(
                identity,
              ) =>
                updateDraft(
                  (current) => {
                    const identityContextChanged =
                      current.identity.clan !==
                        identity.clan ||
                      current.identity
                        .predatorType !==
                        identity.predatorType

                    return {
                      ...current,
                      identity,
                      predatorTypeChoices:
                        identityContextChanged
                          ? {}
                          : current
                              .predatorTypeChoices ??
                            {},
                    }
                  },
                )
              }
              onChoiceSelectionsChange={(
                predatorTypeChoices,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    predatorTypeChoices,
                  }),
                )
              }
            />
          ) : currentStepId ===
            'attributes' ? (
            <AttributesStep
              value={draft.attributes}
              onChange={(attributes) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    attributes,
                  }),
                )
              }
            />
          ) : currentStepId ===
            'skills' ? (
            <SkillsStep
              value={
                resolvePredatorTypeCreationSkills(
                  draft,
                )
              }
              effectiveSkills={
                draft.skills
              }
              predatorTypeBonusSkillKey={
                resolvePredatorTypeBonusSkillKey(
                  draft,
                )
              }
              method={
                draft.skillDistributionMethod
              }
              specialties={
                draft.skillSpecialties
              }
              onChange={(skills) =>
                updateDraft(
                  (current) => {
                    const effectiveSkills =
                      resolvePredatorTypeEffectiveSkills(
                        current,
                        skills,
                      )

                    return {
                      ...current,
                      skills:
                        effectiveSkills,
                      skillSpecialties:
                        removeInvalidSpecialties(
                          current.skillSpecialties,
                          effectiveSkills,
                        ),
                    }
                  },
                  skills,
                )
              }
              onMethodChange={(
                skillDistributionMethod,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    skillDistributionMethod,
                  }),
                )
              }
              onSpecialtiesChange={(
                skillSpecialties,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    skillSpecialties,
                  }),
                )
              }
            />
          ) : currentStepId ===
            'blood' ? (
            <BloodStep
              value={draft.blood}
              attributes={
                draft.attributes
              }
              generation={
                draft.identity.generation ??
                13
              }
              onChange={(blood) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    blood,
                  }),
                )
              }
            />
          ) : currentStepId ===
            'disciplines' &&
            draft.identity.clan !==
              null ? (
            <DisciplinesStep
              clanKey={
                draft.identity.clan
              }
              value={
                draft.disciplines
              }
              onChange={(
                disciplines,
              ) =>
                updateDraft(
                  (current) =>
                    normalizeCharacterDraftOblivionCeremonies({
                      ...current,
                      disciplines,
                    }),
                )
              }
              rituals={
                draft.bloodSorceryRituals
              }
              onRitualsChange={(
                bloodSorceryRituals,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    bloodSorceryRituals,
                  }),
                )
              }
              ceremonies={
                draft.oblivionCeremonies
              }
              onCeremoniesChange={(
                oblivionCeremonies,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    oblivionCeremonies,
                  }),
                )
              }
            />
          ) : currentStepId ===
            'advantages' ? (
            <AdvantagesStep
              clanKey={
                draft.identity.clan
              }
              generation={
                draft.identity.generation
              }
              value={
                draft.advantages
              }
              thinBloodTraits={
                draft.thinBloodTraits
              }
              thinBloodAlchemy={
                draft.thinBloodAlchemy
              }
              onChange={(
                advantages,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    advantages,
                  }),
                )
              }
              onThinBloodTraitsChange={(
                thinBloodTraits,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    thinBloodTraits,
                  }),
                )
              }
              onThinBloodAlchemyChange={(
                thinBloodAlchemy,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    thinBloodAlchemy,
                  }),
                )
              }
            />
          ) : currentStepId ===
            'humanity' ? (
            <HumanityStep
              value={
                draft.humanity
              }
              onChange={(
                humanity,
              ) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    humanity,
                  }),
                )
              }
            />
          ) : currentStepId ===
            'review' ? (
            <ReviewStep
              draft={draft}
              validationReport={
                reviewReport
              }
              lifecycleStatus={
                editorState?.status ?? null
              }
              canFinalize={
                canFinalizeReview
              }
              busy={
                interactionBusy
              }
              message={
                reviewMessage
              }
              onCheck={() => {
                void checkReview()
              }}
              onFinalize={() => {
                void finalizeReview()
              }}
            />
          ) : (
            <CreationStepPlaceholder
              step={currentStep}
            />
          )}

          {showValidation &&
            !currentValidation.valid && (
              <div
                className="creation-step-errors"
                role="alert"
              >
                <strong>
                  Revisa esta fase antes
                  de continuar
                </strong>

                <ul>
                  {currentValidation.errors.map(
                    (error) => (
                      <li key={error}>
                        {error}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

          <footer className="creation-actions">
            <button
              type="button"
              className="creation-button creation-button--secondary"
              onClick={goPrevious}
              disabled={
                isFirst ||
                interactionBusy
              }
            >
              Anterior
            </button>

            <span className="creation-actions__position">
              Paso {currentStep.number}
              {' de '}
              {creationSteps.length}
            </span>

            <button
              type="button"
              className="creation-button creation-button--primary"
              onClick={goNext}
              disabled={
                isLast ||
                interactionBusy
              }
            >
              Siguiente
            </button>
          </footer>
        </section>
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'

import { creationSteps } from '../data/creation-steps'
import { initialCharacterDraft } from '../data/initial-character-draft'

import {
  buildStepValidationMap,
} from '../domain/step-validation'

import {
  removeInvalidSpecialties,
} from '../domain/skill-specialty-rules'

import type {
  CharacterDraft,
} from '../types/character-draft.types'

import type {
  CreationStepId,
} from '../types/creation-step.types'

import { AttributesStep } from './AttributesStep'
import { CreationProgress } from './CreationProgress'
import { CreationStepPlaceholder } from './CreationStepPlaceholder'
import { IdentityStep } from './IdentityStep'
import { SkillsStep } from './SkillsStep'

interface CharacterCreationWizardProps {
  onBackToSheet: () => void
}

export function CharacterCreationWizard({
  onBackToSheet,
}: CharacterCreationWizardProps) {
  const [currentStepId, setCurrentStepId] =
    useState<CreationStepId>('identity')

  const [draft, setDraft] =
    useState<CharacterDraft>(
      initialCharacterDraft,
    )

  const [showValidation, setShowValidation] =
    useState(false)

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

  function updateDraft(
    updater: (
      current: CharacterDraft,
    ) => CharacterDraft,
  ) {
    setDraft((current) =>
      updater(current),
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
      setCurrentStepId(stepId)
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
        setCurrentStepId(step.id)
        return
      }
    }

    setShowValidation(false)
    setCurrentStepId(stepId)
  }

  function canNavigateTo(
    stepId: CreationStepId,
  ): boolean {
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

    setCurrentStepId(
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

    setCurrentStepId(
      creationSteps[
        currentIndex + 1
      ].id,
    )
  }

  return (
    <main className="creation-page">
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

        <button
          type="button"
          className="creation-header__back"
          onClick={onBackToSheet}
        >
          Ver ficha
        </button>
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
              onChange={(identity) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    identity,
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
              value={draft.skills}
              method={
                draft.skillDistributionMethod
              }
              specialties={
                draft.skillSpecialties
              }
              onChange={(skills) =>
                updateDraft(
                  (current) => ({
                    ...current,
                    skills,
                    skillSpecialties:
                      removeInvalidSpecialties(
                        current.skillSpecialties,
                        skills,
                      ),
                  }),
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
              disabled={isFirst}
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
              disabled={isLast}
            >
              Siguiente
            </button>
          </footer>
        </section>
      </div>
    </main>
  )
}

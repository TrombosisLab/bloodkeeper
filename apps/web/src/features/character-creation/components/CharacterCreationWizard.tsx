import { useState } from 'react'

import { creationSteps } from '../data/creation-steps'

import type {
  CreationStepId,
} from '../types/creation-step.types'

import { CreationProgress } from './CreationProgress'
import { CreationStepPlaceholder } from './CreationStepPlaceholder'

interface CharacterCreationWizardProps {
  onBackToSheet: () => void
}

export function CharacterCreationWizard({
  onBackToSheet,
}: CharacterCreationWizardProps) {
  const [currentStepId, setCurrentStepId] =
    useState<CreationStepId>('identity')

  const currentIndex = creationSteps.findIndex(
    (step) => step.id === currentStepId,
  )

  const currentStep =
    creationSteps[currentIndex]

  const isFirst =
    currentIndex === 0

  const isLast =
    currentIndex === creationSteps.length - 1

  function goPrevious() {
    if (isFirst) {
      return
    }

    setCurrentStepId(
      creationSteps[currentIndex - 1].id,
    )
  }

  function goNext() {
    if (isLast) {
      return
    }

    setCurrentStepId(
      creationSteps[currentIndex + 1].id,
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
            onSelect={setCurrentStepId}
          />
        </aside>

        <section className="creation-workspace">
          <CreationStepPlaceholder
            step={currentStep}
          />

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

import type {
  CreationStep,
  CreationStepId,
} from '../types/creation-step.types'

interface CreationProgressProps {
  steps: CreationStep[]
  currentStepId: CreationStepId
  onSelect: (stepId: CreationStepId) => void
}

export function CreationProgress({
  steps,
  currentStepId,
  onSelect,
}: CreationProgressProps) {
  return (
    <nav
      className="creation-progress"
      aria-label="Fases de creación"
    >
      {steps.map((step) => {
        const active =
          step.id === currentStepId

        return (
          <button
            key={step.id}
            type="button"
            className={
              active
                ? 'creation-progress__step creation-progress__step--active'
                : 'creation-progress__step'
            }
            onClick={() => onSelect(step.id)}
            aria-current={
              active ? 'step' : undefined
            }
          >
            <span className="creation-progress__number">
              {String(step.number).padStart(2, '0')}
            </span>

            <span className="creation-progress__name">
              {step.shortTitle}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

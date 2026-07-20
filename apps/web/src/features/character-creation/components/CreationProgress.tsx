import type {
  CreationStep,
  CreationStepId,
} from '../types/creation-step.types'

interface CreationProgressProps {
  steps: CreationStep[]
  currentStepId: CreationStepId
  onSelect: (stepId: CreationStepId) => void
  canNavigateTo: (
    stepId: CreationStepId,
  ) => boolean
}

export function CreationProgress({
  steps,
  currentStepId,
  onSelect,
  canNavigateTo,
}: CreationProgressProps) {
  return (
    <nav
      className="creation-progress"
      aria-label="Fases de creación"
    >
      {steps.map((step) => {
        const active =
          step.id === currentStepId

        const allowed =
          canNavigateTo(step.id)

        return (
          <button
            key={step.id}
            type="button"
            className={[
              'creation-progress__step',

              active
                ? 'creation-progress__step--active'
                : '',

              !allowed
                ? 'creation-progress__step--locked'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (allowed) {
                onSelect(step.id)
              }
            }}
            aria-current={
              active ? 'step' : undefined
            }
            aria-disabled={!allowed}
          >
            <span className="creation-progress__number">
              {String(step.number).padStart(
                2,
                '0',
              )}
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

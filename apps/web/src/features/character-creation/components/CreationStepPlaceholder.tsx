import type {
  CreationStep,
} from '../types/creation-step.types'

interface CreationStepPlaceholderProps {
  step: CreationStep
}

export function CreationStepPlaceholder({
  step,
}: CreationStepPlaceholderProps) {
  return (
    <div className="creation-placeholder">
      <span className="creation-placeholder__eyebrow">
        Fase {step.number}
      </span>

      <h2>{step.title}</h2>

      <p>{step.description}</p>

      <div className="creation-placeholder__notice">
        <span>No se puede mostrar esta fase</span>

        <p>
          Revisa las decisiones anteriores. Puede que falte una opción
          necesaria para continuar.
        </p>
      </div>
    </div>
  )
}

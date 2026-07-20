import {
  deriveCharacterTraits,
  getBloodPotencyRange,
  updateBloodPotency,
  updateHunger,
  validateBloodDraft,
} from '../domain/blood-rules'

import type {
  CharacterAttributesDraft,
} from '../types/character-attributes-draft.types'

import type {
  CharacterBloodDraft,
} from '../types/character-blood-draft.types'

import type {
  CharacterGeneration,
} from '../types/character-generation.types'

interface BloodStepProps {
  value: CharacterBloodDraft
  attributes: CharacterAttributesDraft
  generation: CharacterGeneration

  onChange: (
    value: CharacterBloodDraft,
  ) => void
}

const generations: CharacterGeneration[] = [
  10,
  11,
  12,
  13,
  14,
  15,
  16,
]

export function BloodStep({
  value,
  attributes,
  generation,
  onChange,
}: BloodStepProps) {
  const range =
    getBloodPotencyRange(
      generation,
    )

  const derived =
    deriveCharacterTraits(
      attributes,
    )

  const validation =
    validateBloodDraft(
      value,
      generation,
    )

  return (
    <div className="blood-step">
      <div className="creation-step-heading">
        <span>Fase 4</span>

        <h2>Sangre</h2>

        <p>
          Define la generación y el estado
          inicial de la Sangre del personaje.
          Los valores derivados se calculan
          automáticamente desde sus atributos.
        </p>
      </div>

      <div className="blood-step__grid">
        <section className="blood-panel">
          <div className="blood-panel__heading">
            <span>Linaje</span>
            <h3>Generación</h3>
          </div>

          <div className="blood-generation-summary">
            <strong>
              {generation}ª
            </strong>

            <span>
              Definida en Identidad
            </span>
          </div>
        </section>

        <section className="blood-panel">
          <div className="blood-panel__heading">
            <span>Sangre vampírica</span>
            <h3>Potencia de Sangre</h3>
          </div>

          <div className="blood-rating-control">
            <button
              type="button"
              aria-label="Reducir Potencia de Sangre"
              disabled={
                value.bloodPotency <=
                range.min
              }
              onClick={() =>
                onChange(
                  updateBloodPotency(
                    value,
                    generation,
                    value.bloodPotency -
                      1,
                  ),
                )
              }
            >
              −
            </button>

            <div className="blood-rating-control__value">
              <strong>
                {value.bloodPotency}
              </strong>

              <span>
                Rango permitido:
                {' '}
                {range.min}
                {' – '}
                {range.max}
              </span>
            </div>

            <button
              type="button"
              aria-label="Aumentar Potencia de Sangre"
              disabled={
                value.bloodPotency >=
                range.max
              }
              onClick={() =>
                onChange(
                  updateBloodPotency(
                    value,
                    generation,
                    value.bloodPotency +
                      1,
                  ),
                )
              }
            >
              +
            </button>
          </div>
        </section>

        <section className="blood-panel">
          <div className="blood-panel__heading">
            <span>La Bestia</span>
            <h3>Hambre inicial</h3>
          </div>

          <div className="hunger-editor">
            <div className="hunger-editor__dots">
              {Array.from(
                { length: 5 },
                (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={
                      index <
                      value.hunger
                        ? 'hunger-editor__dot hunger-editor__dot--filled'
                        : 'hunger-editor__dot'
                    }
                    aria-label={
                      `Establecer Hambre en ${index + 1}`
                    }
                    onClick={() =>
                      onChange(
                        updateHunger(
                          value,
                          value.hunger ===
                            index + 1
                            ? index
                            : index + 1,
                        ),
                      )
                    }
                  />
                ),
              )}
            </div>

            <strong>
              Hambre {value.hunger}
            </strong>

            <span>
              De 0 a 5
            </span>
          </div>
        </section>
      </div>

      <section className="derived-traits">
        <div className="derived-traits__heading">
          <span>
            Calculados automáticamente
          </span>

          <h3>
            Valores derivados
          </h3>
        </div>

        <div className="derived-traits__grid">
          <div className="derived-trait-card">
            <span>Salud</span>

            <strong>
              {derived.health}
            </strong>

            <small>
              Resistencia
              {' '}
              {attributes.stamina}
              {' + 3'}
            </small>
          </div>

          <div className="derived-trait-card">
            <span>
              Fuerza de Voluntad
            </span>

            <strong>
              {derived.willpower}
            </strong>

            <small>
              Compostura
              {' '}
              {attributes.composure}
              {' + Resolución '}
              {attributes.resolve}
            </small>
          </div>
        </div>
      </section>

      <div
        className={
          validation.valid
            ? 'blood-validation blood-validation--valid'
            : 'blood-validation'
        }
      >
        {validation.valid ? (
          <p>
            Configuración de Sangre válida.
          </p>
        ) : (
          <ul>
            {validation.errors.map(
              (error) => (
                <li key={error}>
                  {error}
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

import { attributeDefinitions } from '../data/attribute-definitions'

import {
  randomizeAttributes,
  updateAttribute,
  validateAttributeDistribution,
} from '../domain/attribute-rules'

import type {
  AttributeKey,
  CharacterAttributesDraft,
} from '../types/character-attributes-draft.types'

import { AttributeEditorRow } from './AttributeEditorRow'

interface AttributesStepProps {
  value: CharacterAttributesDraft
  onChange: (
    value: CharacterAttributesDraft,
  ) => void
}

const categoryLabels = {
  physical: 'Físicos',
  social: 'Sociales',
  mental: 'Mentales',
} as const

export function AttributesStep({
  value,
  onChange,
}: AttributesStepProps) {
  const validation =
    validateAttributeDistribution(value)

  function changeAttribute(
    key: AttributeKey,
    nextValue: number,
  ) {
    onChange(
      updateAttribute(
        value,
        key,
        nextValue,
      ),
    )
  }

  function randomize() {
    onChange(
      randomizeAttributes(),
    )
  }

  const categories = [
    'physical',
    'social',
    'mental',
  ] as const

  return (
    <div className="attributes-step">
      <div className="creation-step-heading">
        <span>Fase 2</span>

        <h2>Atributos</h2>

        <p>
          Distribuye los nueve atributos respetando
          la combinación de creación válida.
        </p>
      </div>

      <div className="attributes-step__toolbar">
        <div className="attributes-step__distribution">
          <span>Distribución objetivo</span>

          <strong>
            1×4 · 3×3 · 4×2 · 1×1
          </strong>
        </div>

        <button
          type="button"
          className="creation-button creation-button--secondary creation-session-style-button"
          onClick={randomize}
        >
          Reparto aleatorio válido
        </button>
      </div>

      <div className="attributes-editor-grid">
        {categories.map((category) => (
          <section
            className="attributes-editor-category"
            key={category}
          >
            <h3>
              {categoryLabels[category]}
            </h3>

            <div>
              {attributeDefinitions
                .filter(
                  (attribute) =>
                    attribute.category ===
                    category,
                )
                .map((attribute) => (
                  <AttributeEditorRow
                    key={attribute.key}
                    attributeKey={
                      attribute.key
                    }
                    label={
                      attribute.label
                    }
                    value={
                      value[
                        attribute.key
                      ]
                    }
                    onChange={
                      changeAttribute
                    }
                  />
                ))}
            </div>
          </section>
        ))}
      </div>

      <div
        className={
          validation.valid
            ? 'attribute-validation attribute-validation--valid'
            : 'attribute-validation'
        }
      >
        <div className="attribute-validation__summary">
          <div>
            <span>Valor 4</span>
            <strong>
              {
                validation
                  .distribution
                  .rating4
              }
              /1
            </strong>
          </div>

          <div>
            <span>Valor 3</span>
            <strong>
              {
                validation
                  .distribution
                  .rating3
              }
              /3
            </strong>
          </div>

          <div>
            <span>Valor 2</span>
            <strong>
              {
                validation
                  .distribution
                  .rating2
              }
              /4
            </strong>
          </div>

          <div>
            <span>Valor 1</span>
            <strong>
              {
                validation
                  .distribution
                  .rating1
              }
              /1
            </strong>
          </div>
        </div>

        {validation.valid ? (
          <p className="attribute-validation__ok">
            Distribución válida.
          </p>
        ) : (
          <ul className="attribute-validation__errors">
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

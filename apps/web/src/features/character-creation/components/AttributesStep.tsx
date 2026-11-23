import { useState } from 'react'

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

type AttributeCategory = 'physical' | 'social' | 'mental'

const categories: AttributeCategory[] = [
  'physical',
  'social',
  'mental',
]

interface AttributesStepProps {
  guided?: boolean
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
  guided = false,
  value,
  onChange,
}: AttributesStepProps) {
  const [activeCategory, setActiveCategory] = useState<AttributeCategory>('physical')

  function moveCategory(direction: -1 | 1) {
    const nextCategory = categories[categories.indexOf(activeCategory) + direction]
    if (nextCategory) setActiveCategory(nextCategory)
  }

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

      {guided && (
        <div className="attributes-step__guided-navigation">
          <div className="attributes-step__guided-categories" role="group" aria-label="Grupo de Atributos">
            {categories.map((category, index) => (
              <button
                type="button"
                key={category}
                className="attributes-step__guided-category"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                <span>{categoryLabels[category]}</span>
                <small>{index + 1} de {categories.length}</small>
              </button>
            ))}
          </div>
          <div className="attributes-step__guided-controls">
            <button
              type="button"
              className="creation-button creation-button--secondary"
              disabled={activeCategory === categories[0]}
              onClick={() => moveCategory(-1)}
            >
              Grupo anterior
            </button>
            <span>{categoryLabels[activeCategory]} · {categories.indexOf(activeCategory) + 1} de {categories.length}</span>
            <button
              type="button"
              className="creation-button creation-button--secondary"
              disabled={activeCategory === categories[categories.length - 1]}
              onClick={() => moveCategory(1)}
            >
              Siguiente grupo
            </button>
          </div>
          <p>Los puntos se reparten entre los tres grupos y se validan en conjunto.</p>
        </div>
      )}

      <div className={\`attributes-editor-grid\${guided ? ' attributes-editor-grid--guided' : ''}\`}>
        {(guided ? [activeCategory] : categories).map((category) => (
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

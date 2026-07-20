import {
  skillDefinitions,
} from '../data/skill-definitions'

import {
  randomizeSkills,
  updateSkill,
  validateSkillDistribution,
} from '../domain/skill-rules'

import type {
  CharacterSkillsDraft,
  SkillDistributionMethod,
  SkillKey,
  SkillSpecialty,
} from '../types/character-skills-draft.types'

import { SkillEditorRow } from './SkillEditorRow'
import { SkillSpecialtiesEditor } from './SkillSpecialtiesEditor'

interface SkillsStepProps {
  value: CharacterSkillsDraft
  method: SkillDistributionMethod
  specialties: SkillSpecialty[]

  onChange: (
    value: CharacterSkillsDraft,
  ) => void

  onMethodChange: (
    method: SkillDistributionMethod,
  ) => void

  onSpecialtiesChange: (
    specialties: SkillSpecialty[],
  ) => void
}

const categories = [
  'physical',
  'social',
  'mental',
] as const

const categoryLabels = {
  physical: 'Físicas',
  social: 'Sociales',
  mental: 'Mentales',
} as const

const methods: {
  key: SkillDistributionMethod
  label: string
  description: string
}[] = [
  {
    key: 'generalist',
    label: 'Generalista',
    description:
      'Muchas capacidades a niveles bajos y medios.',
  },
  {
    key: 'balanced',
    label: 'Equilibrado',
    description:
      'Una distribución versátil y compensada.',
  },
  {
    key: 'specialist',
    label: 'Especialista',
    description:
      'Menos habilidades, pero mayor especialización.',
  },
]

export function SkillsStep({
  value,
  method,
  specialties,
  onChange,
  onMethodChange,
  onSpecialtiesChange,
}: SkillsStepProps) {
  const validation =
    validateSkillDistribution(
      value,
      method,
    )

  function changeSkill(
    key: SkillKey,
    nextValue: number,
  ) {
    onChange(
      updateSkill(
        value,
        key,
        nextValue,
      ),
    )
  }

  function changeMethod(
    nextMethod:
      SkillDistributionMethod,
  ) {
    onMethodChange(nextMethod)

    onChange(
      randomizeSkills(
        nextMethod,
      ),
    )
  }

  function randomize() {
    onChange(
      randomizeSkills(method),
    )
  }

  return (
    <div className="skills-step">
      <div className="creation-step-heading">
        <span>Fase 3</span>

        <h2>Habilidades</h2>

        <p>
          Elige un perfil de distribución
          y define las capacidades aprendidas
          de tu personaje.
        </p>
      </div>

      <div className="skill-method-selector">
        {methods.map((option) => (
          <button
            key={option.key}
            type="button"
            className={
              option.key === method
                ? 'skill-method-card skill-method-card--active'
                : 'skill-method-card'
            }
            onClick={() =>
              changeMethod(
                option.key,
              )
            }
          >
            <strong>
              {option.label}
            </strong>

            <span>
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <div className="skills-step__toolbar">
        <div>
          <span>
            Perfil seleccionado
          </span>

          <strong>
            {
              methods.find(
                (option) =>
                  option.key === method,
              )?.label
            }
          </strong>
        </div>

        <button
          type="button"
          className="creation-button creation-button--secondary"
          onClick={randomize}
        >
          Reparto aleatorio válido
        </button>
      </div>

      <div className="skills-editor-grid">
        {categories.map(
          (category) => (
            <section
              className="skills-editor-category"
              key={category}
            >
              <h3>
                {
                  categoryLabels[
                    category
                  ]
                }
              </h3>

              <div>
                {skillDefinitions
                  .filter(
                    (skill) =>
                      skill.category ===
                      category,
                  )
                  .map(
                    (skill) => (
                      <SkillEditorRow
                        key={
                          skill.key
                        }
                        skillKey={
                          skill.key
                        }
                        label={
                          skill.label
                        }
                        value={
                          value[
                            skill.key
                          ]
                        }
                        onChange={
                          changeSkill
                        }
                      />
                    ),
                  )}
              </div>
            </section>
          ),
        )}
      </div>

      <SkillSpecialtiesEditor
        skills={value}
        value={specialties}
        onChange={onSpecialtiesChange}
      />

      <div
        className={
          validation.valid
            ? 'skill-validation skill-validation--valid'
            : 'skill-validation'
        }
      >
        <div className="skill-validation__summary">
          <div>
            <span>Nivel 4</span>
            <strong>
              {
                validation
                  .distribution
                  .rating4
              }
            </strong>
          </div>

          <div>
            <span>Nivel 3</span>
            <strong>
              {
                validation
                  .distribution
                  .rating3
              }
            </strong>
          </div>

          <div>
            <span>Nivel 2</span>
            <strong>
              {
                validation
                  .distribution
                  .rating2
              }
            </strong>
          </div>

          <div>
            <span>Nivel 1</span>
            <strong>
              {
                validation
                  .distribution
                  .rating1
              }
            </strong>
          </div>

          <div>
            <span>Sin puntos</span>
            <strong>
              {
                validation
                  .distribution
                  .rating0
              }
            </strong>
          </div>
        </div>

        {validation.valid ? (
          <p className="skill-validation__ok">
            Distribución válida.
          </p>
        ) : (
          <ul className="skill-validation__errors">
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

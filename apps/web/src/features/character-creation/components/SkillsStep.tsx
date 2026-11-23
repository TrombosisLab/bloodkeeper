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
  effectiveSkills?: CharacterSkillsDraft
  predatorTypeBonusSkillKey?: SkillKey | null
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
  target: string
}[] = [
  {
    key: 'generalist',
    label: 'Generalista',
    description:
      'Amplia cobertura: la mayoría quedan en niveles básicos y medios, sin una habilidad de nivel 4.',
    target: '10 a nivel 1 · 8 a nivel 2 · 1 a nivel 3 · 8 sin puntos',
  },
  {
    key: 'balanced',
    label: 'Equilibrado',
    description:
      'Equilibra amplitud y profundidad, con varias capacidades destacadas.',
    target: '7 a nivel 1 · 5 a nivel 2 · 3 a nivel 3 · 12 sin puntos',
  },
  {
    key: 'specialist',
    label: 'Especialista',
    description:
      'Menos habilidades entrenadas, pero permite concentrar experiencia hasta nivel 4.',
    target: '3 a nivel 1 · 3 a nivel 2 · 3 a nivel 3 · 1 a nivel 4 · 17 sin puntos',
  },
]

export function SkillsStep({
  value,
  effectiveSkills = value,
  predatorTypeBonusSkillKey = null,
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

            <small>
              Reparto objetivo: {option.target}
            </small>
          </button>
        ))}
      </div>

      <p className="skills-step__method-guidance">
        El perfil define las cantidades objetivo, pero no mueve tus puntos.
        Usa “Reparto aleatorio válido” si quieres que se asignen automáticamente.
      </p>

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
          className="creation-button creation-button--secondary creation-session-style-button"
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

      {predatorTypeBonusSkillKey !== null ? (
        <p>
          Tipo de Depredador: +1 en{' '}
          {
            skillDefinitions.find(
              definition =>
                definition.key ===
                predatorTypeBonusSkillKey,
            )?.label ??
            predatorTypeBonusSkillKey
          }.
          {' '}
          Este punto no consume el reparto inicial.
        </p>
      ) : null}

      <SkillSpecialtiesEditor
        skills={effectiveSkills}
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

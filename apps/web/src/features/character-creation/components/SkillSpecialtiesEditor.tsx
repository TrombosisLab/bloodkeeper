import { useState } from 'react'

import {
  skillDefinitions,
} from '../data/skill-definitions'

import {
  addSpecialty,
  removeSpecialty,
} from '../domain/skill-specialty-rules'

import type {
  CharacterSkillsDraft,
  SkillKey,
  SkillSpecialty,
} from '../types/character-skills-draft.types'

interface SkillSpecialtiesEditorProps {
  skills: CharacterSkillsDraft
  value: SkillSpecialty[]

  onChange: (
    value: SkillSpecialty[],
  ) => void
}

export function SkillSpecialtiesEditor({
  skills,
  value,
  onChange,
}: SkillSpecialtiesEditorProps) {
  const availableSkills =
    skillDefinitions.filter(
      (skill) =>
        skills[skill.key] > 0,
    )

  const [requestedSkillKey, setRequestedSkillKey] =
    useState<SkillKey | null>(null)

  const [name, setName] =
    useState('')

  const [error, setError] =
    useState('')

  const selectedSkillKey =
    requestedSkillKey !== null &&
    availableSkills.some(
      (skill) =>
        skill.key === requestedSkillKey,
    )
      ? requestedSkillKey
      : availableSkills[0]?.key ?? null

  function submit() {
    setError('')

    if (!selectedSkillKey) {
      setError(
        'Necesitas una habilidad con al menos un punto.',
      )
      return
    }

    if (!name.trim()) {
      setError(
        'Escribe una especialidad.',
      )
      return
    }

    const next =
      addSpecialty(
        value,
        skills,
        selectedSkillKey,
        name,
        `specialty-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`,
      )

    if (next.length === value.length) {
      const duplicate =
        value.some(
          (specialty) =>
            specialty.skillKey ===
              selectedSkillKey &&
            specialty.name
              .trim()
              .toLocaleLowerCase() ===
              name
                .trim()
                .replace(/\s+/g, ' ')
                .toLocaleLowerCase(),
        )

      setError(
        duplicate
          ? 'Esa especialidad ya existe para esta habilidad.'
          : 'No se ha podido añadir la especialidad.',
      )

      return
    }

    onChange(next)
    setName('')
  }

  return (
    <section className="skill-specialties-editor">
      <div className="skill-specialties-editor__heading">
        <div>
          <span>Especialidades</span>

          <h3>
            Áreas de experiencia
          </h3>
        </div>

        <p>
          Añade especialidades a habilidades
          que tengan al menos un punto.
        </p>
      </div>

      <div className="skill-specialties-editor__form">
        <label>
          <span>Habilidad</span>

          <select
            value={
              selectedSkillKey ?? ''
            }
            disabled={
              availableSkills.length === 0
            }
            onChange={(event) => {
              setRequestedSkillKey(
                event.target
                  .value as SkillKey,
              )

              setError('')
            }}
          >
            {availableSkills.length === 0 && (
              <option value="">
                Sin habilidades disponibles
              </option>
            )}

            {availableSkills.map(
              (skill) => (
                <option
                  key={skill.key}
                  value={skill.key}
                >
                  {skill.label}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Especialidad</span>

          <input
            type="text"
            value={name}
            placeholder="Ej. Motocicletas"
            disabled={
              availableSkills.length === 0
            }
            onChange={(event) => {
              setName(
                event.target.value,
              )

              setError('')
            }}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                event.preventDefault()
                submit()
              }
            }}
          />
        </label>

        <button
          type="button"
          className="creation-button creation-button--secondary"
          disabled={
            !selectedSkillKey ||
            !name.trim()
          }
          onClick={submit}
        >
          Añadir especialidad
        </button>
      </div>

      {error && (
        <p
          className="skill-specialties-editor__error"
          role="alert"
        >
          {error}
        </p>
      )}

      {value.length === 0 ? (
        <p className="skill-specialties-editor__empty">
          Aún no hay especialidades añadidas.
        </p>
      ) : (
        <div className="skill-specialties-list">
          {value.map(
            (specialty) => {
              const skill =
                skillDefinitions.find(
                  (definition) =>
                    definition.key ===
                    specialty.skillKey,
                )

              return (
                <div
                  className="skill-specialty-chip"
                  key={specialty.id}
                >
                  <div>
                    <span>
                      {skill?.label}
                    </span>

                    <strong>
                      {specialty.name}
                    </strong>
                  </div>

                  <button
                    type="button"
                    aria-label={
                      `Eliminar especialidad ${specialty.name}`
                    }
                    onClick={() =>
                      onChange(
                        removeSpecialty(
                          value,
                          specialty.id,
                        ),
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}

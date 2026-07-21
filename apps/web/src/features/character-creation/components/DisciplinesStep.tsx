import {
  getClanDefinition,
} from '../data/clan-definitions'

import {
  disciplineDefinitions,
} from '../data/discipline-definitions'

import {
  getAvailableDisciplinesForClan,
  getDisciplineValue,
  randomizeCaitiffDisciplines,
  randomizeClanDisciplines,
  updateDiscipline,
  validateDisciplines,
} from '../domain/discipline-rules'

import type {
  ClanKey,
} from '../types/clan.types'

import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types'

import type {
  CharacterBloodSorceryRitualsDraft,
} from '../types/blood-sorcery-ritual.types'

import type {
  CharacterOblivionCeremoniesDraft,
} from '../types/oblivion-ceremony.types'

import { DisciplineEditorCard } from './DisciplineEditorCard'
import { DisciplinePowerSelector } from './DisciplinePowerSelector'
import { BloodSorceryRitualSelector } from './BloodSorceryRitualSelector'
import { OblivionCeremonySelector } from './OblivionCeremonySelector'

interface DisciplinesStepProps {
  clanKey: ClanKey

  value:
    CharacterDisciplinesDraft

  onChange: (
    value:
      CharacterDisciplinesDraft,
  ) => void

  rituals:
    CharacterBloodSorceryRitualsDraft

  onRitualsChange: (
    value:
      CharacterBloodSorceryRitualsDraft,
  ) => void

  ceremonies:
    CharacterOblivionCeremoniesDraft

  onCeremoniesChange: (
    value:
      CharacterOblivionCeremoniesDraft,
  ) => void
}

function getDisciplineName(
  key: DisciplineKey,
): string {
  return (
    disciplineDefinitions.find(
      (discipline) =>
        discipline.key === key,
    )?.name ?? key
  )
}

export function DisciplinesStep({
  clanKey,
  value,
  onChange,
  rituals,
  onRitualsChange,
  ceremonies,
  onCeremoniesChange,
}: DisciplinesStepProps) {
  const clan =
    getClanDefinition(
      clanKey,
    )

  const validation =
    validateDisciplines(
      value,
      clanKey,
    )

  function changeDiscipline(
    key: DisciplineKey,
    nextValue: number,
  ) {
    onChange(
      updateDiscipline(
        value,
        clanKey,
        key,
        nextValue,
      ),
    )
  }

  const availableDisciplines =
    getAvailableDisciplinesForClan(
      clanKey,
    )

  const isCaitiff =
    clan.kind === 'caitiff'

  function randomize() {
    onChange(
      isCaitiff
        ? randomizeCaitiffDisciplines()
        : randomizeClanDisciplines(
            clanKey,
          ),
    )
  }

  if (clan.kind === 'thinBlood') {
    return (
      <div className="disciplines-step">
        <div className="creation-step-heading">
          <span>Fase 5</span>

          <h2>Disciplinas</h2>

          <p>
            La Sangre Débil utiliza reglas
            diferentes para sus capacidades
            sobrenaturales.
          </p>
        </div>

        <section className="discipline-special-case">
          <span>
            Caso especial
          </span>

          <h3>Sangre Débil</h3>

          <p>
            Su tratamiento se implementará
            mediante sus reglas específicas,
            incluida Alquimia de Sangre Débil,
            sin simular tres Disciplinas de clan.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="disciplines-step">
      <div className="creation-step-heading">
        <span>Fase 5</span>

        <h2>Disciplinas</h2>

        <p>
          {isCaitiff
            ? 'Elige libremente dos Disciplinas vampíricas y distribuye 2 + 1 puntos.'
            : 'Distribuye tus puntos iniciales entre las Disciplinas propias de tu clan.'}
        </p>
      </div>

      <div className="disciplines-step__clan">
        <div>
          <span>
            {isCaitiff
              ? 'Tipo seleccionado'
              : 'Clan seleccionado'}
          </span>

          <strong>
            {clan.name}
          </strong>
        </div>

        <div className="disciplines-step__rule">
          <span>
            Distribución
          </span>

          <strong>
            {'2 + 1'}
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

      <div className="discipline-editor-grid">
        {availableDisciplines.map(
          (disciplineKey) => (
            <DisciplineEditorCard
              key={disciplineKey}
              disciplineKey={
                disciplineKey
              }
              name={
                getDisciplineName(
                  disciplineKey,
                )
              }
              value={
                getDisciplineValue(
                  value,
                  disciplineKey,
                )
              }
              onChange={
                changeDiscipline
              }
            />
          ),
        )}
      </div>

      <div className="discipline-power-selectors">
        {availableDisciplines.map(
          (disciplineKey) => (
            <DisciplinePowerSelector
              key={disciplineKey}
              disciplineKey={
                disciplineKey
              }
              disciplineName={
                getDisciplineName(
                  disciplineKey,
                )
              }
              disciplines={value}
              onChange={onChange}
            />
          ),
        )}
      </div>

      {getDisciplineValue(
        value,
        'bloodSorcery',
      ) >= 1 && (
        <BloodSorceryRitualSelector
          value={rituals}
          onChange={
            onRitualsChange
          }
        />
      )}

      <OblivionCeremonySelector
        disciplines={value}
        value={ceremonies}
        onChange={
          onCeremoniesChange
        }
      />

      <div
        className={
          validation.valid
            ? 'discipline-validation discipline-validation--valid'
            : 'discipline-validation'
        }
      >
        <div className="discipline-validation__summary">
          {availableDisciplines.map(
            (disciplineKey) => (
              <div
                key={
                  disciplineKey
                }
              >
                <span>
                  {
                    getDisciplineName(
                      disciplineKey,
                    )
                  }
                </span>

                <strong>
                  {
                    getDisciplineValue(
                      value,
                      disciplineKey,
                    )
                  }
                </strong>
              </div>
            ),
          )}
        </div>

        {validation.valid ? (
          <p className="discipline-validation__ok">
            Distribución de Disciplinas válida.
          </p>
        ) : (
          <ul className="discipline-validation__errors">
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

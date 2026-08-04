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

  const creationDisciplines =
    value.filter(
      discipline =>
        discipline.origin === undefined ||
        discipline.origin === 'creation',
    )

  const nonCreationDisciplines =
    value.filter(
      discipline =>
        discipline.origin !== undefined &&
        discipline.origin !== 'creation',
    )

  const validation =
    validateDisciplines(
      creationDisciplines,
      clanKey,
    )

  function changeDiscipline(
    key: DisciplineKey,
    nextValue: number,
  ) {
    const updatedCreationDisciplines =
      updateDiscipline(
        creationDisciplines,
        clanKey,
        key,
        nextValue,
      )

    onChange([
      ...updatedCreationDisciplines,
      ...nonCreationDisciplines,
    ])
  }

  const availableDisciplines =
    getAvailableDisciplinesForClan(
      clanKey,
    )

  const predatorDisciplines =
    value.filter(
      discipline =>
        discipline.origin ===
          'predatorType' &&
        discipline.value > 0,
    )

  const powerDisciplineKeys = [
    ...new Set<DisciplineKey>([
      ...availableDisciplines,
      ...predatorDisciplines.map(
        discipline =>
          discipline.key,
      ),
    ]),
  ]

  const isCaitiff =
    clan.kind === 'caitiff'

  function randomize() {
    const randomized =
      isCaitiff
        ? randomizeCaitiffDisciplines()
        : randomizeClanDisciplines(
            clanKey,
          )

    onChange([
      ...randomized.map(
        discipline => ({
          ...discipline,
          origin:
            'creation' as const,
        }),
      ),
      ...nonCreationDisciplines,
    ])
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
                  creationDisciplines,
                  disciplineKey,
                )
              }
              effectiveValue={
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

      {predatorDisciplines.length > 0 && (
        <section className="discipline-special-case">
          <span>
            Tipo de Depredador
          </span>

          <h3>
            Disciplina adicional
          </h3>

          <p>
            Esta concesión no consume el
            reparto inicial 2 + 1. Debes
            seleccionar también el Poder
            correspondiente.
          </p>

          {predatorDisciplines.map(
            discipline => (
              <p key={discipline.key}>
                <strong>
                  {
                    getDisciplineName(
                      discipline.key,
                    )
                  }
                </strong>
                {' · '}
                {discipline.value}
              </p>
            ),
          )}
        </section>
      )}

      <div className="discipline-power-selectors">
        {powerDisciplineKeys.map(
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

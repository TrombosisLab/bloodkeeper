import {
  disciplinePowerDefinitions,
} from '../data/discipline-power-definitions'

import {
  canLearnDisciplinePower,
  updateSelectedPower,
  validateSelectedPowers,
} from '../domain/discipline-power-rules'
import {
  getActiveDisciplinePowers,
} from '../domain/discipline-power-catalog-rules'

import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types'

interface DisciplinePowerSelectorProps {
  disciplineKey: DisciplineKey
  disciplineName: string

  disciplines:
    CharacterDisciplinesDraft

  onChange: (
    value:
      CharacterDisciplinesDraft,
  ) => void
}

export function DisciplinePowerSelector({
  disciplineKey,
  disciplineName,
  disciplines,
  onChange,
}: DisciplinePowerSelectorProps) {
  const discipline =
    disciplines.find(
      (candidate) =>
        candidate.key ===
        disciplineKey,
    )

  const level =
    discipline?.value ?? 0

  const selectedPowerKeys =
    discipline?.powerKeys ?? []

  const availablePowers =
    getActiveDisciplinePowers(
      disciplinePowerDefinitions,
      disciplineKey,
    )

  const validation =
    validateSelectedPowers(
      disciplinePowerDefinitions,
      disciplines,
      disciplineKey,
      selectedPowerKeys,
    )

  if (level <= 0) {
    return null
  }

  return (
    <section className="discipline-power-selector">
      <header className="discipline-power-selector__header">
        <div>
          <span>
            Poderes
          </span>

          <h4>
            {disciplineName}
          </h4>
        </div>

        <strong>
          {selectedPowerKeys.length}
          {' / '}
          {level}
        </strong>
      </header>

      <p className="discipline-power-selector__help">
        Selecciona {level === 1
          ? '1 poder'
          : `${level} poderes`}.
        El catálogo mostrado es temporal para
        validar el sistema de creación.
      </p>

      <div className="discipline-power-selector__options">
        {availablePowers.map(
          (power) => {
            const selected =
              selectedPowerKeys.includes(
                power.key,
              )

            const learnability =
              canLearnDisciplinePower(
                power,
                disciplines,
                selectedPowerKeys,
              )

            const limitReached =
              !selected &&
              selectedPowerKeys.length >=
                level

            const disabled =
              !selected &&
              (
                !learnability.valid ||
                limitReached
              )

            return (
              <button
                key={power.key}
                type="button"
                className={
                  selected
                    ? 'discipline-power-option discipline-power-option--selected'
                    : 'discipline-power-option'
                }
                disabled={disabled}
                onClick={() =>
                  onChange(
                    updateSelectedPower(
                      disciplines,
                      disciplineKey,
                      power.key,
                      !selected,
                    ),
                  )
                }
              >
                <span className="discipline-power-option__level">
                  Nivel {power.level}
                </span>

                <strong>
                  {power.name}
                </strong>

                <span className="discipline-power-option__state">
                  {selected
                    ? 'Seleccionado'
                    : disabled
                      ? 'No disponible'
                      : 'Seleccionar'}
                </span>
              </button>
            )
          },
        )}
      </div>

      <div
        className={
          validation.valid
            ? 'discipline-power-selector__validation discipline-power-selector__validation--valid'
            : 'discipline-power-selector__validation'
        }
      >
        {validation.valid ? (
          <span>
            Selección de poderes completa.
          </span>
        ) : (
          <span>
            Selecciona exactamente {level}
            {level === 1
              ? ' poder.'
              : ' poderes.'}
          </span>
        )}
      </div>
    </section>
  )
}

import { useState } from 'react'

import {
  disciplinePowerDefinitions,
} from '../data/discipline-power-definitions'

import {
  getCharacterDisciplineLevel,
  getSelectedDisciplinePowerKeys,
  updateSelectedPower,
  validateInitialDisciplinePowers,
} from '../domain/discipline-power-rules'
import {
  getActiveDisciplinePowers,
} from '../domain/discipline-power-catalog-rules'
import {
  validateDisciplinePowerAcquisition,
} from '../domain/discipline-power-acquisition-rules'

import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types'
import type {
  DisciplinePowerDefinition,
} from '../types/discipline-power.types'
import { DisciplineCatalogInfoDialog } from './DisciplineCatalogInfoDialog'

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
  const [infoPower, setInfoPower] =
    useState<DisciplinePowerDefinition | null>(null)

  const level =
    getCharacterDisciplineLevel(
      disciplines,
      disciplineKey,
    )

  const selectedPowerKeys =
    getSelectedDisciplinePowerKeys(
      disciplines,
      disciplineKey,
    )

  const availablePowers =
    getActiveDisciplinePowers(
      disciplinePowerDefinitions,
      disciplineKey,
    )

  const validation =
    validateInitialDisciplinePowers(
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

      <div className="discipline-power-selector__options">
        {availablePowers.map(
          (power) => {
            const selected =
              selectedPowerKeys.includes(
                power.key,
              )

            const learnability =
              validateDisciplinePowerAcquisition(
                disciplinePowerDefinitions,
                disciplines,
                disciplineKey,
                power.key,
                selectedPowerKeys,
                'characterCreation',
              )

            const disabled =
              !selected &&
              !learnability.valid

            return (
              <div
                key={power.key}
                className="discipline-power-option-card"
              >
                <button
                  type="button"
                  className={
                    selected
                      ? 'discipline-power-option discipline-power-option--selected'
                      : 'discipline-power-option'
                  }
                  disabled={disabled}
                  aria-pressed={selected}
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
                <button
                  type="button"
                  className="discipline-info-button discipline-power-info-button"
                  aria-label={`Información sobre ${power.name}`}
                  onClick={() => setInfoPower(power)}
                >
                  i
                </button>
              </div>
            )
          },
        )}
      </div>

      {infoPower && (
        <DisciplineCatalogInfoDialog
          title={infoPower.name}
          categoryLabel={`Poder · ${disciplineName}`}
          level={infoPower.level}
          summary={infoPower.summary ?? 'No hay un resumen disponible para este Poder.'}
          detail={infoPower.mechanics?.systemSummary}
          sourcePage={infoPower.sourcePage}
          onClose={() => setInfoPower(null)}
        />
      )}

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

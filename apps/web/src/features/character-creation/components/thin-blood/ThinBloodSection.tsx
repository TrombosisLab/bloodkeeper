import type {
  UseThinBloodTraitsResult,
} from '../../hooks/useThinBloodTraits'

import type {
  DisciplineKey,
} from '../../types/discipline.types'

import {
  disciplineDefinitions,
} from '../../data/discipline-definitions'

import {
  disciplinePowerDefinitions,
} from '../../data/discipline-power-definitions'

import {
  getThinBloodDisciplineAffinityKeys,
} from '../../domain/thin-blood-trait-rules'

import {
  ThinBloodValidationPanel,
} from './ThinBloodValidationPanel'

import {
  ThinBloodTraitSelector,
} from './ThinBloodTraitSelector'

import {
  DisciplineAffinityEditor,
} from './DisciplineAffinityEditor'

interface ThinBloodTraitOption {
  key: string
  name: string
}

interface ThinBloodSectionProps {
  thinBlood: UseThinBloodTraitsResult
  merits: readonly ThinBloodTraitOption[]
  flaws: readonly ThinBloodTraitOption[]
}

export function ThinBloodSection({
  thinBlood,
  merits,
  flaws,
}: ThinBloodSectionProps) {
  const disciplineAffinitySelected =
    thinBlood.isSelected(
      'discipline-affinity',
    )

  const disciplineAffinity =
    thinBlood.getDisciplineAffinityDetails()

  const allowedDisciplineKeys =
    getThinBloodDisciplineAffinityKeys()

  const disciplineOptions =
    disciplineDefinitions
      .filter(
        (definition) =>
          allowedDisciplineKeys.includes(
            definition.key,
          ),
      )
      .map(
        (definition) => ({
          key: definition.key,
          name: definition.name,
        }),
      )

  const powerOptions =
    disciplineAffinity
      ? disciplinePowerDefinitions
          .filter(
            (power) =>
              power.disciplineKey ===
                disciplineAffinity.disciplineKey &&
              power.level === 1,
          )
          .map(
            (power) => ({
              key: power.key,
              name: power.name,
            }),
          )
      : []

  function isAllowedDisciplineKey(
    value: string,
  ): value is DisciplineKey {
    return allowedDisciplineKeys.some(
      (key) => key === value,
    )
  }

  return (
    <section className="thin-blood-traits">
      <header className="advantages-category__heading">
        <div>
          <span>Sangre Débil</span>

          <h3>
            Méritos y Defectos específicos
          </h3>

          <p>
            Selecciona entre uno y tres
            Méritos y el mismo número
            de Defectos.
          </p>
        </div>

        <strong>
          {thinBlood.totalCount}
        </strong>
      </header>

      <ThinBloodValidationPanel
        valid={thinBlood.valid}
        errors={thinBlood.errors}
      />

      <div className="thin-blood-traits__columns">
        <ThinBloodTraitSelector
          title="Méritos"
          count={thinBlood.meritCount}
          traits={merits}
          thinBlood={thinBlood}
        />

        <ThinBloodTraitSelector
          title="Defectos"
          count={thinBlood.flawCount}
          traits={flaws}
          thinBlood={thinBlood}
        />
      </div>

      {disciplineAffinitySelected && (
        <DisciplineAffinityEditor
          discipline={
            disciplineAffinity?.disciplineKey ??
            null
          }
          power={
            disciplineAffinity?.powerKey ??
            null
          }
          disciplines={disciplineOptions}
          powers={powerOptions}
          onDisciplineChange={(value) => {
            if (
              value === '' ||
              !isAllowedDisciplineKey(value)
            ) {
              thinBlood.setDisciplineAffinityDetails(
                null,
              )

              return
            }

            thinBlood.setDisciplineAffinityDetails({
              disciplineKey: value,
              powerKey: '',
            })
          }}
          onPowerChange={(powerKey) => {
            if (!disciplineAffinity) {
              return
            }

            thinBlood.setDisciplineAffinityDetails({
              disciplineKey:
                disciplineAffinity.disciplineKey,
              powerKey,
            })
          }}
        />
      )}
    </section>
  )
}

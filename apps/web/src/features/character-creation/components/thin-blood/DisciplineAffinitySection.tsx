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
  DisciplineAffinityEditor,
} from './DisciplineAffinityEditor'

interface DisciplineAffinitySectionProps {
  thinBlood: UseThinBloodTraitsResult
}

export function DisciplineAffinitySection({
  thinBlood,
}: DisciplineAffinitySectionProps) {
  const disciplineAffinity =
    thinBlood.getDisciplineAffinityDetails()

  const allowedDisciplineKeys =
    getThinBloodDisciplineAffinityKeys()

  const disciplineOptions =
    disciplineDefinitions
      .filter(
        (definition) =>
          definition.active &&
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
  )
}

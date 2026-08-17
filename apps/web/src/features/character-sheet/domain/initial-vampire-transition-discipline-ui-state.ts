import {
  clanKeys,
} from '../../character-creation/data/clan-definitions.ts'

import {
  disciplineDefinitions,
} from '../../character-creation/data/discipline-definitions.ts'

import {
  disciplinePowerDefinitions,
} from '../../character-creation/data/discipline-power-definitions.ts'

import {
  getActiveDisciplinePowers,
} from '../../character-creation/domain/discipline-power-catalog-rules.ts'

import {
  validateDisciplinePowerAcquisition,
} from '../../character-creation/domain/discipline-power-acquisition-rules.ts'

import {
  getAvailableDisciplinesForClan,
  getDisciplineValue,
  updateDiscipline,
} from '../../character-creation/domain/discipline-rules.ts'

import {
  getCharacterDisciplineLevel,
  getSelectedDisciplinePowerKeys,
} from '../../character-creation/domain/discipline-power-rules.ts'

import type {
  ClanKey,
} from '../../character-creation/types/clan.types.ts'

import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../../character-creation/types/discipline.types.ts'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

export interface InitialVampireDisciplineChoice {
  readonly key: DisciplineKey
  readonly name: string
  readonly ratingOptions:
    readonly number[]
}

export interface InitialVampirePowerChoice {
  readonly key: string
  readonly name: string
  readonly level: number
}

export interface InitialVampirePowerDisciplineChoice {
  readonly key: DisciplineKey
  readonly name: string
  readonly rating: number
  readonly selectedPowerCount: number
  readonly powers:
    readonly InitialVampirePowerChoice[]
}

function canonicalClanKey(
  value: string | null,
): ClanKey | null {
  if (value === null) {
    return null
  }

  return (
    (
      clanKeys as readonly string[]
    ).includes(value)
      ? value as ClanKey
      : null
  )
}

function disciplineName(
  key: DisciplineKey,
): string {
  return (
    disciplineDefinitions.find(
      (definition) =>
        definition.key === key,
    )?.name ??
    key
  )
}

function creationDisciplines(
  transition:
    CharacterInitialVampireTransitionReadModel,
): CharacterDisciplinesDraft {
  return transition.disciplines
    .filter(
      ({ origin }) =>
        origin === 'creation',
    )
    .map(
      (discipline) => ({
        key:
          discipline.disciplineKey,
        value:
          discipline.rating,
        powerKeys: [
          ...discipline.powerKeys,
        ],
        origin:
          'creation' as const,
      }),
    )
}

/*
 * No replica el 2+1 ni el máximo inicial.
 * Pregunta al editor de creación ya existente qué
 * puntuaciones acepta para una Disciplina nueva.
 */
function ratingOptions(
  clanKey: ClanKey,
  disciplineKey: DisciplineKey,
): readonly number[] {
  return Array.from(
    { length: 5 },
    (_, index) => index + 1,
  ).filter(
    (rating) =>
      getDisciplineValue(
        updateDiscipline(
          [],
          clanKey,
          disciplineKey,
          rating,
        ),
        disciplineKey,
      ) === rating,
  )
}

export function initialVampireDisciplineChoices(
  transition:
    CharacterInitialVampireTransitionReadModel,
): readonly InitialVampireDisciplineChoice[] {
  const clanKey =
    canonicalClanKey(
      transition.identity.clanKey,
    )

  if (clanKey === null) {
    return []
  }

  const manifested =
    new Set(
      creationDisciplines(
        transition,
      ).map(
        ({ key }) => key,
      ),
    )

  return getAvailableDisciplinesForClan(
    clanKey,
  )
    .filter(
      (disciplineKey) =>
        !manifested.has(
          disciplineKey,
        ),
    )
    .map(
      (disciplineKey) => ({
        key:
          disciplineKey,
        name:
          disciplineName(
            disciplineKey,
          ),
        ratingOptions:
          ratingOptions(
            clanKey,
            disciplineKey,
          ),
      }),
    )
    .filter(
      ({ ratingOptions }) =>
        ratingOptions.length > 0,
    )
}

export function initialVampirePowerDisciplineChoices(
  transition:
    CharacterInitialVampireTransitionReadModel,
): readonly InitialVampirePowerDisciplineChoice[] {
  const disciplines =
    creationDisciplines(
      transition,
    )

  return [
    ...new Set(
      disciplines.map(
        ({ key }) => key,
      ),
    ),
  ]
    .map(
      (disciplineKey) => {
        const selectedPowerKeys =
          getSelectedDisciplinePowerKeys(
            disciplines,
            disciplineKey,
          )

        const rating =
          getCharacterDisciplineLevel(
            disciplines,
            disciplineKey,
          )

        const powers =
          getActiveDisciplinePowers(
            disciplinePowerDefinitions,
            disciplineKey,
          )
            .filter(
              (power) =>
                !selectedPowerKeys.includes(
                  power.key,
                ),
            )
            .filter(
              (power) =>
                validateDisciplinePowerAcquisition(
                  disciplinePowerDefinitions,
                  disciplines,
                  disciplineKey,
                  power.key,
                  selectedPowerKeys,
                  'characterCreation',
                ).valid,
            )
            .map(
              (power) => ({
                key:
                  power.key,
                name:
                  power.name,
                level:
                  power.level,
              }),
            )

        return {
          key:
            disciplineKey,
          name:
            disciplineName(
              disciplineKey,
            ),
          rating,
          selectedPowerCount:
            selectedPowerKeys.length,
          powers,
        }
      },
    )
    .filter(
      ({
        rating,
        selectedPowerCount,
      }) =>
        selectedPowerCount <
        rating,
    )
}

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
  getSelectedDisciplinePowerKeys,
} from '../../character-creation/domain/discipline-power-rules.ts'

import {
  applyPredatorTypeAdvantages,
  applyPredatorTypeDisciplines,
  getPredatorTypeOptions,
  normalizePredatorTypeForCharacter,
  validatePredatorTypeChoiceSelections,
} from '../../character-creation/domain/predator-type-rules.ts'

import {
  getPredatorTypePointDistributionSelections,
  restorePredatorTypePointDistributionSelections,
  validatePredatorTypePointDistributionDraft,
} from '../../character-creation/domain/predator-type-point-distribution-draft-rules.ts'

import type {
  CharacterAdvantagesDraft,
} from '../../character-creation/types/character-advantages-draft.types.ts'

import type {
  ClanKey,
} from '../../character-creation/types/clan.types.ts'

import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../../character-creation/types/discipline.types.ts'

import type {
  CharacterInitialVampireGateway,
} from '../infrastructure/character-initial-vampire.api.ts'

import type {
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types.ts'

export type InitialVampirePredatorAdoptionInput =
  Parameters<
    CharacterInitialVampireGateway[
      'adoptPredatorType'
    ]
  >[2]

export interface InitialVampirePredatorPowerChoice {
  readonly key: string
  readonly name: string
  readonly level: number
  readonly disciplineKey: DisciplineKey
  readonly disciplineName: string
}

export function initialVampirePredatorClanKey(
  transition:
    CharacterInitialVampireTransitionReadModel,
): ClanKey | null {
  const value =
    transition.identity.clanKey

  if (
    value === null ||
    !(
      clanKeys as readonly string[]
    ).includes(value)
  ) {
    return null
  }

  return value as ClanKey
}

function transitionDisciplines(
  transition:
    CharacterInitialVampireTransitionReadModel,
): CharacterDisciplinesDraft {
  return transition.disciplines.map(
    (discipline) => ({
      key:
        discipline.disciplineKey,
      value:
        discipline.rating,
      powerKeys: [
        ...discipline.powerKeys,
      ],
      ...(discipline.origin === null
        ? {}
        : {
            origin:
              discipline.origin,
          }),
    }),
  )
}

function disciplineName(
  key: DisciplineKey,
): string {
  return (
    disciplineDefinitions.find(
      (definition) =>
        definition.key === key,
    )?.name ?? key
  )
}

export function initialVampirePredatorTypeOptions(
  transition:
    CharacterInitialVampireTransitionReadModel,
) {
  const clanKey =
    initialVampirePredatorClanKey(transition)

  if (clanKey === null) {
    return []
  }

  return getPredatorTypeOptions().filter(
    (option) =>
      normalizePredatorTypeForCharacter(
        option.value,
        clanKey,
      ) === option.value,
  )
}

export function initialVampirePredatorAdvantages(
  transition:
    CharacterInitialVampireTransitionReadModel,
  predatorTypeKey: string,
  choiceSelections:
    Readonly<Record<string, number>>,
  current:
    CharacterAdvantagesDraft = {
      selections: [],
    },
): CharacterAdvantagesDraft {
  const clanKey =
    initialVampirePredatorClanKey(transition)

  if (
    clanKey === null ||
    normalizePredatorTypeForCharacter(
      predatorTypeKey,
      clanKey,
    ) !== predatorTypeKey
  ) {
    return {
      selections: [],
    }
  }

  const preservedPointSelections =
    getPredatorTypePointDistributionSelections(
      predatorTypeKey,
      current,
    )

  const applied =
    applyPredatorTypeAdvantages(
      predatorTypeKey,
      clanKey,
      current,
      {
        ...choiceSelections,
      },
    )

  return restorePredatorTypePointDistributionSelections(
    predatorTypeKey,
    {
      ...choiceSelections,
    },
    preservedPointSelections,
    applied,
  )
}

export function initialVampirePredatorPowerChoices(
  transition:
    CharacterInitialVampireTransitionReadModel,
  predatorTypeKey: string,
  choiceSelections:
    Readonly<Record<string, number>>,
): readonly InitialVampirePredatorPowerChoice[] {
  const clanKey =
    initialVampirePredatorClanKey(transition)

  if (
    clanKey === null ||
    normalizePredatorTypeForCharacter(
      predatorTypeKey,
      clanKey,
    ) !== predatorTypeKey
  ) {
    return []
  }

  const disciplines =
    applyPredatorTypeDisciplines(
      predatorTypeKey,
      clanKey,
      transitionDisciplines(
        transition,
      ),
      {
        ...choiceSelections,
      },
    )

  const granted =
    disciplines.find(
      (discipline) =>
        discipline.origin ===
          'predatorType',
    )

  if (granted === undefined) {
    return []
  }

  const selectedPowerKeys =
    getSelectedDisciplinePowerKeys(
      disciplines,
      granted.key,
    )

  return getActiveDisciplinePowers(
    disciplinePowerDefinitions,
    granted.key,
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
          granted.key,
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
        disciplineKey:
          granted.key,
        disciplineName:
          disciplineName(
            granted.key,
          ),
      }),
    )
}

export function initialVampirePredatorConfigurationValid(
  transition:
    CharacterInitialVampireTransitionReadModel,
  predatorTypeKey: string,
  choiceSelections:
    Readonly<Record<string, number>>,
  advantages:
    CharacterAdvantagesDraft,
  disciplinePowerKey: string,
): boolean {
  const clanKey =
    initialVampirePredatorClanKey(transition)

  if (
    clanKey === null ||
    normalizePredatorTypeForCharacter(
      predatorTypeKey,
      clanKey,
    ) !== predatorTypeKey
  ) {
    return false
  }

  if (
    !validatePredatorTypeChoiceSelections(
      predatorTypeKey,
      {
        clan: clanKey,
      },
      {
        ...choiceSelections,
      },
    ).valid
  ) {
    return false
  }

  if (
    !validatePredatorTypePointDistributionDraft(
      predatorTypeKey,
      {
        ...choiceSelections,
      },
      advantages,
    ).valid
  ) {
    return false
  }

  return initialVampirePredatorPowerChoices(
    transition,
    predatorTypeKey,
    choiceSelections,
  ).some(
    ({ key }) =>
      key === disciplinePowerKey,
  )
}

export function toInitialVampirePredatorApiAdvantages(
  advantages:
    CharacterAdvantagesDraft,
): InitialVampirePredatorAdoptionInput[
  'advantages'
] {
  return {
    selections:
      advantages.selections
        .filter(
          (selection) =>
            selection.origin ===
              'predatorType',
        )
        .map(
          (selection) => ({
            selectionId:
              selection.selectionId,
            definitionKey:
              selection.definitionKey,
            category:
              selection.category,
            rating:
              selection.rating,
            origin:
              selection.origin,
            parentSelectionId:
              selection.parentSelectionId ??
              null,
            details:
              selection.details ??
              null,
          }),
        ),
  }
}

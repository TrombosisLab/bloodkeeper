import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
  PersistedCharacterDraft,
  PersistedCharacterDiscipline,
} from './persisted-character.types'

export type InitialDisciplineViolation =
  | 'INITIAL_VAMPIRE_CLAN_PENDING'
  | 'INITIAL_DISCIPLINE_CLAN_AFFINITY_UNKNOWN'
  | 'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_CLAN'
  | 'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_THIN_BLOOD'
  | 'INITIAL_DISCIPLINE_DEFINITION_UNKNOWN'
  | 'INITIAL_DISCIPLINE_DEFINITION_INACTIVE'
  | 'INITIAL_DISCIPLINE_RATING_INVALID'
  | 'INITIAL_DISCIPLINE_ALREADY_MANIFESTED'
  | 'INITIAL_DISCIPLINE_BUDGET_EXCEEDED'
  | 'INITIAL_DISCIPLINE_NOT_MANIFESTED'
  | 'INITIAL_DISCIPLINE_POWER_CAPACITY_EXCEEDED'
  | 'INITIAL_DISCIPLINE_POWER_UNKNOWN'
  | 'INITIAL_DISCIPLINE_POWER_INACTIVE'
  | 'INITIAL_DISCIPLINE_POWER_WRONG_DISCIPLINE'
  | 'INITIAL_DISCIPLINE_POWER_DUPLICATE'
  | 'INITIAL_DISCIPLINE_POWER_LEVEL_UNMET'
  | 'INITIAL_DISCIPLINE_POWER_PREREQUISITE_MISSING'
  | 'INITIAL_DISCIPLINE_POWER_AMALGAM_UNMET'

export interface InitialDisciplineProgress {
  readonly disciplinesComplete: boolean
  readonly powersComplete: boolean
}

function creationContributions(
  character: PersistedCharacterDraft,
): readonly PersistedCharacterDiscipline[] {
  return character.disciplines.filter(
    ({ origin }) => origin === 'creation',
  )
}

function effectiveRating(
  character: PersistedCharacterDraft,
  disciplineKey: string,
): number {
  return character.disciplines
    .filter(
      (discipline) =>
        discipline.disciplineKey === disciplineKey,
    )
    .reduce(
      (total, discipline) =>
        total + discipline.rating,
      0,
    )
}

function learnedPowers(
  character: PersistedCharacterDraft,
): ReadonlySet<string> {
  return new Set(
    character.disciplines.flatMap(
      ({ powerKeys }) => powerKeys,
    ),
  )
}

export function deriveInitialDisciplineProgress(
  character: PersistedCharacterDraft,
): InitialDisciplineProgress {
  const clanKey = character.identity.clanKey

  if (clanKey === null) {
    return {
      disciplinesComplete: false,
      powersComplete: false,
    }
  }

  if (clanKey === 'thinBlood') {
    return {
      disciplinesComplete: true,
      powersComplete: true,
    }
  }

  const creation =
    creationContributions(character)

  const ratings = creation
    .map(({ rating }) => rating)
    .sort((left, right) => left - right)

  const disciplinesComplete =
    creation.length === 2 &&
    new Set(
      creation.map(
        ({ disciplineKey }) => disciplineKey,
      ),
    ).size === 2 &&
    ratings[0] === 1 &&
    ratings[1] === 2

  const powerCount =
    creation.reduce(
      (total, { powerKeys }) =>
        total + powerKeys.length,
      0,
    )

  const powersComplete =
    disciplinesComplete &&
    creation.every(
      ({ rating, powerKeys }) =>
        powerKeys.length === rating,
    ) &&
    new Set(
      creation.flatMap(
        ({ powerKeys }) => powerKeys,
      ),
    ).size === powerCount

  return {
    disciplinesComplete,
    powersComplete,
  }
}

export function validateInitialDisciplineManifestation(
  character: PersistedCharacterDraft,
  disciplineKey: string,
  rating: number,
  catalog: CharacterRulesCatalog,
): readonly InitialDisciplineViolation[] {
  const clanKey = character.identity.clanKey

  if (clanKey === null) {
    return ['INITIAL_VAMPIRE_CLAN_PENDING']
  }

  const affinity =
    catalog.disciplineCatalog.clanAffinities.find(
      (definition) =>
        definition.clanKey === clanKey,
    )

  if (affinity === undefined) {
    return [
      'INITIAL_DISCIPLINE_CLAN_AFFINITY_UNKNOWN',
    ]
  }

  if (affinity.kind === 'thinBlood') {
    return [
      'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_THIN_BLOOD',
    ]
  }

  const violations:
    InitialDisciplineViolation[] = []

  const definition =
    catalog.disciplineCatalog.disciplines.find(
      ({ key }) => key === disciplineKey,
    )

  if (definition === undefined) {
    violations.push(
      'INITIAL_DISCIPLINE_DEFINITION_UNKNOWN',
    )
  } else if (!definition.active) {
    violations.push(
      'INITIAL_DISCIPLINE_DEFINITION_INACTIVE',
    )
  }

  if (
    affinity.kind === 'clan' &&
    !affinity.disciplineKeys.includes(
      disciplineKey as never,
    )
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_CLAN',
    )
  }

  if (
    affinity.kind === 'caitiff' &&
    disciplineKey === 'thinBloodAlchemy'
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_CLAN',
    )
  }

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 2
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_RATING_INVALID',
    )
  }

  const current =
    creationContributions(character)

  if (
    current.some(
      (discipline) =>
        discipline.disciplineKey ===
          disciplineKey,
    )
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_ALREADY_MANIFESTED',
    )
  }

  const candidateRatings = [
    ...current.map(
      ({ rating: currentRating }) =>
        currentRating,
    ),
    rating,
  ]

  if (
    current.length >= 2 ||
    candidateRatings.reduce(
      (total, value) => total + value,
      0,
    ) > 3 ||
    candidateRatings.filter(
      (value) => value === 2,
    ).length > 1 ||
    candidateRatings.filter(
      (value) => value === 1,
    ).length > 1
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_BUDGET_EXCEEDED',
    )
  }

  return [...new Set(violations)]
}

export function validateInitialPowerManifestation(
  character: PersistedCharacterDraft,
  disciplineKey: string,
  powerKey: string,
  catalog: CharacterRulesCatalog,
): readonly InitialDisciplineViolation[] {
  if (character.identity.clanKey === null) {
    return ['INITIAL_VAMPIRE_CLAN_PENDING']
  }

  if (
    character.identity.clanKey ===
      'thinBlood'
  ) {
    return [
      'INITIAL_DISCIPLINE_NOT_AVAILABLE_FOR_THIN_BLOOD',
    ]
  }

  const contribution =
    creationContributions(character).find(
      (discipline) =>
        discipline.disciplineKey ===
          disciplineKey,
    )

  if (contribution === undefined) {
    return [
      'INITIAL_DISCIPLINE_NOT_MANIFESTED',
    ]
  }

  const violations:
    InitialDisciplineViolation[] = []

  if (
    contribution.powerKeys.length >=
    contribution.rating
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_POWER_CAPACITY_EXCEEDED',
    )
  }

  const learned = learnedPowers(character)

  if (learned.has(powerKey)) {
    violations.push(
      'INITIAL_DISCIPLINE_POWER_DUPLICATE',
    )
  }

  const power =
    catalog.disciplineCatalog.powers.find(
      ({ key }) => key === powerKey,
    )

  if (power === undefined) {
    violations.push(
      'INITIAL_DISCIPLINE_POWER_UNKNOWN',
    )
    return [...new Set(violations)]
  }

  if (!power.active) {
    violations.push(
      'INITIAL_DISCIPLINE_POWER_INACTIVE',
    )
  }

  if (
    power.disciplineKey !== disciplineKey
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_POWER_WRONG_DISCIPLINE',
    )
  }

  if (
    power.level >
    effectiveRating(
      character,
      disciplineKey,
    )
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_POWER_LEVEL_UNMET',
    )
  }

  for (
    const prerequisite of
      power.requirements
        ?.prerequisitePowerKeys ?? []
  ) {
    if (!learned.has(prerequisite)) {
      violations.push(
        'INITIAL_DISCIPLINE_POWER_PREREQUISITE_MISSING',
      )
    }
  }

  const amalgam =
    power.requirements?.amalgam

  if (
    amalgam !== undefined &&
    effectiveRating(
      character,
      amalgam.disciplineKey,
    ) < amalgam.minimumLevel
  ) {
    violations.push(
      'INITIAL_DISCIPLINE_POWER_AMALGAM_UNMET',
    )
  }

  return [...new Set(violations)]
}

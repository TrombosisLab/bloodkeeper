import type {
  CharacterRulesPredatorTypeChoiceGrant,
  CharacterRulesPredatorTypeDefinition,
} from '@v5r/character-rules'

import {
  characterRulesCatalog,
} from './character-rules-catalog'

import {
  CHARACTER_SKILL_KEYS,
} from './persisted-character.types'

import type {
  CharacterSkillKey,
  PersistedCharacterSkills,
  PersistedCharacterSkillSpecialty,
} from './persisted-character.types'

type PredatorTypeSpecialtyGrant =
  Extract<
    CharacterRulesPredatorTypeChoiceGrant,
    {
      readonly type: 'specialty'
    }
  >

export interface PredatorTypeSkillGrantCharacter {
  readonly identity: {
    readonly clanKey?: string | null
    readonly predatorTypeKey?: string | null
  }

  readonly skills: PersistedCharacterSkills

  readonly skillSpecialties:
    readonly PersistedCharacterSkillSpecialty[]

  readonly creation?: {
    readonly predatorTypeChoices?:
      Readonly<Record<string, number>>
  }
}

const skillKeySet =
  new Set<string>(
    CHARACTER_SKILL_KEYS,
  )

function asSkillKey(
  value: string,
): CharacterSkillKey | null {
  return skillKeySet.has(value)
    ? value as CharacterSkillKey
    : null
}

function selectedDefinition(
  character:
    PredatorTypeSkillGrantCharacter,
): CharacterRulesPredatorTypeDefinition | null {
  const predatorTypeKey =
    character.identity.predatorTypeKey

  if (
    predatorTypeKey === undefined ||
    predatorTypeKey === null ||
    predatorTypeKey.trim().length === 0
  ) {
    return null
  }

  return (
    characterRulesCatalog
      .dependencyCatalog
      .predatorTypes
      .find(
        definition =>
          definition.key ===
          predatorTypeKey,
      ) ?? null
  )
}

function optionMatches(
  option: {
    readonly when?: {
      readonly clan?: string
    }
  },
  clanKey: string | null,
): boolean {
  return (
    option.when?.clan === undefined ||
    option.when.clan === clanKey
  )
}

export function resolvePredatorTypeSpecialtyGrant(
  character:
    PredatorTypeSkillGrantCharacter,
  providedDefinition?:
    CharacterRulesPredatorTypeDefinition,
): PredatorTypeSpecialtyGrant | null {
  const definition =
    providedDefinition ??
    selectedDefinition(character)

  if (definition === null) {
    return null
  }

  const clanKey =
    character.identity.clanKey ??
    null

  const selections =
    character.creation
      ?.predatorTypeChoices ?? {}

  for (
    const choice of
      definition.choices ?? []
  ) {
    const available =
      choice.options
        .map(
          (option, index) => ({
            option,
            index,
          }),
        )
        .filter(
          ({ option }) =>
            optionMatches(
              option,
              clanKey,
            ),
        )

    if (available.length === 0) {
      continue
    }

    const selected =
      available.length === 1
        ? available[0]
        : available.find(
            candidate =>
              candidate.index ===
              selections[choice.id],
          )

    if (
      selected?.option.grant.type ===
      'specialty' &&
      asSkillKey(
        selected.option.grant
          .skillKey,
      ) !== null
    ) {
      return selected.option.grant
    }
  }

  return null
}

function matchingSpecialty(
  character:
    PredatorTypeSkillGrantCharacter,
  grant: PredatorTypeSpecialtyGrant,
): PersistedCharacterSkillSpecialty | null {
  const skillKey =
    asSkillKey(grant.skillKey)

  if (skillKey === null) {
    return null
  }

  return (
    character.skillSpecialties.find(
      specialty =>
        specialty.origin ===
          'predatorType' &&
        specialty.skillKey ===
          skillKey &&
        specialty.name.trim() ===
          grant.name.trim(),
    ) ?? null
  )
}

export function resolvePredatorTypeBonusSkillKey(
  character:
    PredatorTypeSkillGrantCharacter,
  providedDefinition?:
    CharacterRulesPredatorTypeDefinition,
): CharacterSkillKey | null {
  const grant =
    resolvePredatorTypeSpecialtyGrant(
      character,
      providedDefinition,
    )

  if (
    grant === null ||
    matchingSpecialty(
      character,
      grant,
    ) !== null
  ) {
    return null
  }

  const skillKey =
    asSkillKey(grant.skillKey)

  if (skillKey === null) {
    return null
  }

  return character.skills[
    skillKey
  ] === 1
    ? skillKey
    : null
}

export function resolvePredatorTypeCreationSkills(
  character:
    PredatorTypeSkillGrantCharacter,
  providedDefinition?:
    CharacterRulesPredatorTypeDefinition,
): PersistedCharacterSkills {
  const skills = {
    ...character.skills,
  }

  const bonusSkillKey =
    resolvePredatorTypeBonusSkillKey(
      character,
      providedDefinition,
    )

  if (bonusSkillKey !== null) {
    skills[bonusSkillKey] = 0
  }

  return skills
}

export function resolvePredatorTypeValidationSpecialties(
  character:
    PredatorTypeSkillGrantCharacter,
  definition:
    CharacterRulesPredatorTypeDefinition,
): readonly PersistedCharacterSkillSpecialty[] {
  const grant =
    resolvePredatorTypeSpecialtyGrant(
      character,
      definition,
    )

  if (
    grant === null ||
    matchingSpecialty(
      character,
      grant,
    ) !== null
  ) {
    return character.skillSpecialties
  }

  const skillKey =
    asSkillKey(grant.skillKey)

  if (
    skillKey === null ||
    character.skills[skillKey] !== 1
  ) {
    return character.skillSpecialties
  }

  return [
    ...character.skillSpecialties,
    {
      id: [
        'validation',
        'predatorType',
        definition.key,
        skillKey,
        grant.name,
      ].join(':'),
      skillKey,
      name: grant.name,
      origin: 'predatorType',
    },
  ]
}

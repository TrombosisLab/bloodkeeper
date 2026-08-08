import {
  resolveSelectedPredatorChoices,
} from './predator-type-rules.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CharacterSkillsDraft,
  SkillKey,
  SkillSpecialty,
} from '../types/character-skills-draft.types.ts'

import type {
  PredatorTypeChoiceGrant,
} from '../types/predator-type.types.ts'

export type PredatorTypeSpecialtyGrant =
  Extract<
    PredatorTypeChoiceGrant,
    {
      type: 'specialty'
    }
  >

export function resolveSelectedPredatorTypeSpecialtyGrant(
  draft: CharacterDraft,
): PredatorTypeSpecialtyGrant | null {
  if (
    draft.identity.predatorType === '' ||
    draft.identity.clan === null
  ) {
    return null
  }

  return (
    resolveSelectedPredatorChoices(
      draft.identity.predatorType,
      {
        clan: draft.identity.clan,
      },
      draft.predatorTypeChoices ?? {},
    ).find(
      (
        grant,
      ): grant is PredatorTypeSpecialtyGrant =>
        grant.type === 'specialty',
    ) ?? null
  )
}

function matchesPredatorSpecialty(
  specialty: SkillSpecialty,
  grant: PredatorTypeSpecialtyGrant,
): boolean {
  return (
    specialty.origin === 'predatorType' &&
    specialty.skillKey ===
      grant.skillKey &&
    specialty.name.trim() ===
      grant.name.trim()
  )
}

export function hasMatchingPredatorTypeSpecialty(
  draft: CharacterDraft,
  grant:
    PredatorTypeSpecialtyGrant | null =
      resolveSelectedPredatorTypeSpecialtyGrant(
        draft,
      ),
): boolean {
  if (grant === null) {
    return false
  }

  return draft.skillSpecialties.some(
    specialty =>
      matchesPredatorSpecialty(
        specialty,
        grant,
      ),
  )
}

export function resolvePredatorTypeBonusSkillKey(
  draft: CharacterDraft,
): SkillKey | null {
  const grant =
    resolveSelectedPredatorTypeSpecialtyGrant(
      draft,
    )

  if (
    grant === null ||
    hasMatchingPredatorTypeSpecialty(
      draft,
      grant,
    )
  ) {
    return null
  }

  return draft.skills[
    grant.skillKey
  ] === 1
    ? grant.skillKey
    : null
}

export function resolvePredatorTypeCreationSkills(
  draft: CharacterDraft,
): CharacterSkillsDraft {
  const skills = {
    ...draft.skills,
  }

  const bonusSkillKey =
    resolvePredatorTypeBonusSkillKey(
      draft,
    )

  if (bonusSkillKey !== null) {
    skills[bonusSkillKey] = 0
  }

  return skills
}

export function resolvePredatorTypeEffectiveSkills(
  draft: CharacterDraft,
  creationSkills: CharacterSkillsDraft,
): CharacterSkillsDraft {
  const skills = {
    ...creationSkills,
  }

  const grant =
    resolveSelectedPredatorTypeSpecialtyGrant(
      draft,
    )

  if (
    grant !== null &&
    creationSkills[grant.skillKey] === 0
  ) {
    skills[grant.skillKey] = 1
  }

  return skills
}

export function normalizePredatorTypeSkillGrant(
  draft: CharacterDraft,
  creationSkills: CharacterSkillsDraft,
): CharacterDraft {
  const grant =
    resolveSelectedPredatorTypeSpecialtyGrant(
      draft,
    )

  const skills =
    resolvePredatorTypeEffectiveSkills(
      draft,
      creationSkills,
    )

  if (grant === null) {
    return {
      ...draft,
      skills,
    }
  }

  const skillSpecialties =
    creationSkills[grant.skillKey] === 0
      ? draft.skillSpecialties.filter(
          specialty =>
            !matchesPredatorSpecialty(
              specialty,
              grant,
            ),
        )
      : draft.skillSpecialties

  return {
    ...draft,
    skills,
    skillSpecialties,
  }
}

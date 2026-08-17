import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
  PersistedCharacterDiscipline,
  PersistedCharacterDraft,
  PersistedCharacterThinBloodAlchemy,
  PersistedCharacterThinBloodTrait,
} from './persisted-character.types'

import {
  deriveThinBloodAffinityDiscipline,
  validateInitialThinBloodAlchemySelection,
  validateThinBloodTraitState,
} from './character-thin-blood.rules'

import type {
  CharacterThinBloodRuleIssue,
} from './character-thin-blood.rules'

export interface InitialThinBloodResolutionPlan {
  readonly thinBloodTraits:
    readonly PersistedCharacterThinBloodTrait[]
  readonly thinBloodAlchemy:
    PersistedCharacterThinBloodAlchemy
  readonly discipline:
    PersistedCharacterDiscipline | null
}

export interface InitialThinBloodResolutionAnalysis {
  readonly plan:
    InitialThinBloodResolutionPlan | null
  readonly issues:
    readonly CharacterThinBloodRuleIssue[]
}

export function analyzeInitialThinBloodResolution(
  character: PersistedCharacterDraft,
  thinBloodTraits:
    readonly PersistedCharacterThinBloodTrait[],
  thinBloodAlchemy:
    PersistedCharacterThinBloodAlchemy,
  catalog: CharacterRulesCatalog,
): InitialThinBloodResolutionAnalysis {
  if (
    character.identity.clanKey !==
      'thinBlood'
  ) {
    return {
      plan: null,
      issues: [
        {
          code:
            'INITIAL_THIN_BLOOD_CHARACTER_REQUIRED',
          message:
            'La resolución de Sangre Débil sólo corresponde a un personaje Sangre Débil.',
        },
      ],
    }
  }

  const issues = [
    ...validateThinBloodTraitState(
      thinBloodTraits,
      catalog,
    ),
    ...validateInitialThinBloodAlchemySelection(
      thinBloodTraits,
      thinBloodAlchemy,
      catalog,
    ),
  ]

  if (issues.length > 0) {
    return {
      plan: null,
      issues,
    }
  }

  const discipline =
    deriveThinBloodAffinityDiscipline(
      thinBloodTraits,
    )

  if (
    discipline !== null &&
    character.disciplines.some(
      ({ powerKeys }) =>
        powerKeys.includes(
          discipline.powerKeys[0],
        ),
    )
  ) {
    return {
      plan: null,
      issues: [
        {
          code:
            'INITIAL_THIN_BLOOD_DISCIPLINE_AFFINITY_POWER_DUPLICATE',
          message:
            'El Poder de Disciplina Afín ya está adquirido.',
        },
      ],
    }
  }

  return {
    plan: {
      thinBloodTraits:
        thinBloodTraits.map(
          (trait) => ({
            ...trait,
            clanCurseDetails:
              trait.clanCurseDetails === null
                ? null
                : {
                    ...trait.clanCurseDetails,
                  },
            disciplineAffinityDetails:
              trait.disciplineAffinityDetails ===
              null
                ? null
                : {
                    ...trait
                      .disciplineAffinityDetails,
                  },
          }),
        ),
      thinBloodAlchemy: {
        rating:
          thinBloodAlchemy.rating,
        method:
          thinBloodAlchemy.method,
        formulaKeys: [
          ...thinBloodAlchemy.formulaKeys,
        ],
      },
      discipline,
    },
    issues: [],
  }
}

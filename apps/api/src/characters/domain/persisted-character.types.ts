import {
  characterDisciplineCatalog,
  characterSkillCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesDisciplineKey,
  CharacterRulesSkillKey,
} from '@v5r/character-rules'

export type CharacterLifecycleStatus =
  | 'draft'
  | 'active'
  | 'archived'

export type CharacterCreationStep =
  | 'identity'
  | 'attributes'
  | 'skills'
  | 'blood'
  | 'disciplines'
  | 'advantages'
  | 'humanity'
  | 'review'

export type SkillDistributionMethod =
  | 'generalist'
  | 'balanced'
  | 'specialist'

export const CHARACTER_AGE_CATEGORIES = [
  'fledgling',
  'neonate',
  'ancilla',
  'elder',
] as const

export type CharacterAgeCategory =
  typeof CHARACTER_AGE_CATEGORIES[number]

export interface PersistedCharacterIdentity {
  name: string
  concept: string | null
  predatorTypeKey: string | null
  ambition: string | null
  clanKey: string | null
  sire: string | null
  desire: string | null
  generation: number | null
  ageCategory: CharacterAgeCategory | null
}

export interface PersistedCharacterCreationState {
  schemaVersion: number
  currentStep: CharacterCreationStep
  skillDistributionMethod: SkillDistributionMethod
  predatorTypeChoices: Record<string, number>
  updatedAt: Date
}

export const CHARACTER_ATTRIBUTE_KEYS = [
  'strength',
  'dexterity',
  'stamina',
  'charisma',
  'manipulation',
  'composure',
  'intelligence',
  'wits',
  'resolve',
] as const

export type CharacterAttributeKey =
  typeof CHARACTER_ATTRIBUTE_KEYS[number]

export type PersistedCharacterAttributes =
  Record<CharacterAttributeKey, number>

export interface PersistedCharacterBlood {
  bloodPotency: number
  hunger: number
}

export interface PersistedCharacterDamageTrack {
  superficial: number
  aggravated: number
}

export interface PersistedCharacterDamageState {
  health: PersistedCharacterDamageTrack
  willpower: PersistedCharacterDamageTrack
}

export const CHARACTER_SKILL_KEYS:
  readonly CharacterRulesSkillKey[] =
    characterSkillCatalog.definitions.map(
      (definition) => definition.key,
    )

export type CharacterSkillKey =
  CharacterRulesSkillKey

export type PersistedCharacterSkills =
  Record<CharacterSkillKey, number>

export type SkillSpecialtyOrigin =
  | 'creation'
  | 'predatorType'

export interface PersistedCharacterSkillSpecialty {
  id: string
  skillKey: CharacterSkillKey
  name: string
  origin: SkillSpecialtyOrigin | null
}

export const CHARACTER_DISCIPLINE_KEYS:
  readonly CharacterRulesDisciplineKey[] =
    characterDisciplineCatalog.disciplines.map(
      (definition) => definition.key,
    )

export type CharacterDisciplineKey =
  CharacterRulesDisciplineKey

export type CharacterDisciplineOrigin =
  | 'creation'
  | 'predatorType'
  | 'thinBlood'

export interface PersistedCharacterDiscipline {
  disciplineKey: CharacterDisciplineKey
  rating: number
  powerKeys: string[]
  origin: CharacterDisciplineOrigin | null
}

export interface PersistedCharacterBloodSorceryRituals {
  ritualKeys: string[]
}

export interface PersistedCharacterOblivionCeremonies {
  ceremonyKeys: string[]
}

export type ThinBloodAlchemyMethod =
  | 'athanorCorporis'
  | 'calcinatio'
  | 'fixatio'

export interface PersistedCharacterThinBloodAlchemy {
  rating: number
  method: ThinBloodAlchemyMethod | null
  formulaKeys: string[]
}

export interface PersistedCharacterThinBloodTrait {
  definitionKey: string
  clanCurseDetails: {
    clanKey: string
  } | null
  disciplineAffinityDetails: {
    disciplineKey: CharacterDisciplineKey
    powerKey: string
  } | null
}

export type CharacterAdvantageCategory =
  | 'merit'
  | 'background'
  | 'flaw'

export type CharacterAdvantageSelectionOrigin =
  | 'creation'
  | 'predatorType'
  | 'thinBlood'

export type AdvantageMaskBenefitKey =
  | 'erased'
  | 'tailor'

export type PersistedCharacterAdvantageDetails =
  | {
      kind: 'allies'
      effectiveness: number
      reliability: number
      identity?: string
    }
  | {
      kind: 'contact' | 'retainer' | 'mawla'
        | 'herd' | 'haven' | 'famousFace'
        | 'enemy' | 'stalker'
      identity?: string
    }
  | {
      kind: 'status' | 'fame' | 'influence'
      sphere?: string
    }
  | {
      kind: 'mask'
      identity?: string
      benefits: AdvantageMaskBenefitKey[]
    }
  | {
      kind: 'darkSecret'
      secret?: string
    }
  | {
      kind: 'resources'
      source?: string
    }
  | {
      kind: 'substanceUse'
      substance: string
      poolCategory?: string
    }
  | {
      kind: 'folkloricBane'
      source: string
    }
  | {
      kind: 'folkloricBlock'
      taboo: string
    }
  | {
      kind: 'preyExclusion'
      excludedPrey: string
    }
  | {
      kind: 'loresheet'
      loresheetKey: string
      benefitKey: string
    }
  | {
      kind: 'linguistics'
      languages: string[]
    }
  | {
      kind: 'methuselahVisage'
      resembles?: string
    }
  | {
      kind: 'childOfTheScene'
      subculture?: string
    }
  | {
      kind: 'infamy' | 'despised' | 'hatred'
        | 'exiled' | 'suspect' | 'shunned'
        | 'mortalPretender'
      description?: string
    }

export interface PersistedCharacterAdvantageSelection {
  selectionId: string
  definitionKey: string
  category: CharacterAdvantageCategory
  rating: number
  origin: CharacterAdvantageSelectionOrigin
  parentSelectionId: string | null
  details: PersistedCharacterAdvantageDetails | null
}

export interface PersistedCharacterAdvantages {
  selections: PersistedCharacterAdvantageSelection[]
}

export interface PersistedCharacterConviction {
  convictionId: string
  text: string
  touchstoneId: string | null
}

export interface PersistedCharacterTouchstone {
  touchstoneId: string
  name: string
  relationship: string
}

export interface PersistedCharacterHumanity {
  value: number
  stains: number
  convictions: PersistedCharacterConviction[]
  touchstones: PersistedCharacterTouchstone[]
}

export interface PersistedCharacterDraft {
  characterId: string
  ownerId: string
  chronicleId: string | null
  status: CharacterLifecycleStatus
  revision: number
  createdAt: Date
  updatedAt: Date
  identity: PersistedCharacterIdentity
  creation: PersistedCharacterCreationState
  attributes: PersistedCharacterAttributes
  blood: PersistedCharacterBlood
  damage: PersistedCharacterDamageState
  skills: PersistedCharacterSkills
  skillSpecialties:
    PersistedCharacterSkillSpecialty[]
  disciplines: PersistedCharacterDiscipline[]
  bloodSorceryRituals:
    PersistedCharacterBloodSorceryRituals
  oblivionCeremonies:
    PersistedCharacterOblivionCeremonies
  thinBloodAlchemy:
    PersistedCharacterThinBloodAlchemy
  thinBloodTraits:
    PersistedCharacterThinBloodTrait[]
  advantages: PersistedCharacterAdvantages
  humanity: PersistedCharacterHumanity
}

export interface CreateCharacterDraftData {
  ownerId: string
  chronicleId: string | null
  identity: Partial<PersistedCharacterIdentity>
  attributes: PersistedCharacterAttributes
  blood: PersistedCharacterBlood
  skills: PersistedCharacterSkills
  skillSpecialties:
    PersistedCharacterSkillSpecialty[]
  disciplines: PersistedCharacterDiscipline[]
  bloodSorceryRituals:
    PersistedCharacterBloodSorceryRituals
  oblivionCeremonies:
    PersistedCharacterOblivionCeremonies
  thinBloodAlchemy:
    PersistedCharacterThinBloodAlchemy
  thinBloodTraits:
    PersistedCharacterThinBloodTrait[]
  advantages: PersistedCharacterAdvantages
  humanity: PersistedCharacterHumanity
  creation: {
    currentStep: CharacterCreationStep
    skillDistributionMethod: SkillDistributionMethod
    predatorTypeChoices: Record<string, number>
  }
}

export interface TransitionCharacterLifecycleData {
  characterId: string
  expectedRevision: number
  expectedStatus: CharacterLifecycleStatus
  nextStatus: CharacterLifecycleStatus
}

export interface UpdateCharacterChronicleAssociationData {
  characterId: string
  expectedRevision: number
  chronicleId: string | null
}

export interface UpdateCharacterDraftData {
  characterId: string
  expectedRevision: number
  chronicleId?: string | null
  identity?: Partial<PersistedCharacterIdentity>
  attributes?: Partial<PersistedCharacterAttributes>
  blood?: Partial<PersistedCharacterBlood>
  damage?: PersistedCharacterDamageState
  skills?: Partial<PersistedCharacterSkills>
  skillSpecialties?:
    PersistedCharacterSkillSpecialty[]
  disciplines?: PersistedCharacterDiscipline[]
  bloodSorceryRituals?:
    PersistedCharacterBloodSorceryRituals
  oblivionCeremonies?:
    PersistedCharacterOblivionCeremonies
  thinBloodAlchemy?:
    PersistedCharacterThinBloodAlchemy
  thinBloodTraits?:
    PersistedCharacterThinBloodTrait[]
  advantages?: PersistedCharacterAdvantages
  humanityValue?: number
  humanityStains?: number
  humanityNarrative?: {
    convictions: PersistedCharacterConviction[]
    touchstones: PersistedCharacterTouchstone[]
  }
  creation?: Partial<
    Pick<
      PersistedCharacterCreationState,
      | 'currentStep'
      | 'skillDistributionMethod'
      | 'predatorTypeChoices'
    >
  >
}

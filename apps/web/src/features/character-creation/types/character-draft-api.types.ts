import type {
  CharacterAttributesDraft,
} from './character-attributes-draft.types.ts'

import type {
  CharacterBloodDraft,
} from './character-blood-draft.types.ts'

import type {
  CharacterSkillsDraft,
  SkillDistributionMethod,
  SkillKey,
  SkillSpecialtyOrigin,
} from './character-skills-draft.types.ts'

import type {
  CharacterDisciplineOrigin,
  DisciplineKey,
} from './discipline.types.ts'

import type {
  ThinBloodAlchemyMethod,
} from './thin-blood-alchemy.types.ts'

import type {
  CharacterAdvantageCategory,
  CharacterAdvantageInstanceDetails,
  CharacterAdvantageSelectionOrigin,
} from './character-advantages-draft.types.ts'

import type {
  CreationStepId,
} from './creation-step.types.ts'

export type CharacterDraftApiLifecycleStatus =
  | 'draft'
  | 'active'
  | 'archived'

export type CharacterDraftApiAgeCategory =
  | 'fledgling'
  | 'neonate'
  | 'ancilla'
  | 'elder'

export interface CharacterDraftApiIdentity {
  name: string
  concept: string | null
  predatorTypeKey: string | null
  ambition: string | null
  clanKey: string | null
  sire: string | null
  desire: string | null
  generation: number | null
  ageCategory:
    CharacterDraftApiAgeCategory | null
}

export interface CharacterDraftApiCreationState {
  schemaVersion: number
  currentStep: CreationStepId
  skillDistributionMethod:
    SkillDistributionMethod
  predatorTypeChoices:
    Record<string, number>
  updatedAt: string
}

export interface CharacterDraftApiBlood
  extends CharacterBloodDraft {}

export interface CharacterDraftApiDamageTrack {
  superficial: number
  aggravated: number
}

export interface CharacterDraftApiDamage {
  health: CharacterDraftApiDamageTrack
  willpower: CharacterDraftApiDamageTrack
}

export interface CharacterDraftApiSkillSpecialty {
  id: string
  skillKey: SkillKey
  name: string
  origin: SkillSpecialtyOrigin | null
}

export interface CharacterDraftApiDiscipline {
  disciplineKey: DisciplineKey
  rating: number
  powerKeys: string[]
  origin: CharacterDisciplineOrigin | null
}

export interface CharacterDraftApiThinBloodTrait {
  definitionKey: string
  clanCurseDetails: {
    clanKey: string
  } | null
  disciplineAffinityDetails: {
    disciplineKey: DisciplineKey
    powerKey: string
  } | null
}

export interface CharacterDraftApiAdvantageSelection {
  selectionId: string
  definitionKey: string
  category: CharacterAdvantageCategory
  rating: number
  origin: CharacterAdvantageSelectionOrigin
  parentSelectionId: string | null
  details: CharacterAdvantageInstanceDetails | null
}

export interface CharacterDraftApiHumanity {
  value: number
  stains: number
  convictions: {
    convictionId: string
    text: string
    touchstoneId: string | null
  }[]
  touchstones: {
    touchstoneId: string
    name: string
    relationship: string
  }[]
}

export interface CharacterDraftApiSnapshot {
  characterId: string
  ownerId: string
  chronicleId: string | null
  status: CharacterDraftApiLifecycleStatus
  revision: number
  createdAt: string
  updatedAt: string
  identity: CharacterDraftApiIdentity
  creation: CharacterDraftApiCreationState
  attributes: CharacterAttributesDraft
  blood: CharacterDraftApiBlood
  damage: CharacterDraftApiDamage
  skills: CharacterSkillsDraft
  skillSpecialties:
    CharacterDraftApiSkillSpecialty[]
  disciplines: CharacterDraftApiDiscipline[]
  bloodSorceryRituals: {
    ritualKeys: string[]
  }
  oblivionCeremonies: {
    ceremonyKeys: string[]
  }
  thinBloodAlchemy: {
    rating: number
    method: ThinBloodAlchemyMethod | null
    formulaKeys: string[]
  }
  thinBloodTraits:
    CharacterDraftApiThinBloodTrait[]
  advantages: {
    selections:
      CharacterDraftApiAdvantageSelection[]
  }
  humanity: CharacterDraftApiHumanity
}

export interface CreateCharacterDraftApiRequest {
  chronicleId: string | null
  identity: Partial<CharacterDraftApiIdentity>
  attributes: CharacterAttributesDraft
  blood: CharacterDraftApiBlood
  skills: CharacterSkillsDraft
  skillSpecialties:
    CharacterDraftApiSkillSpecialty[]
  disciplines: CharacterDraftApiDiscipline[]
  bloodSorceryRituals: {
    ritualKeys: string[]
  }
  oblivionCeremonies: {
    ceremonyKeys: string[]
  }
  thinBloodAlchemy: {
    rating: number
    method: ThinBloodAlchemyMethod | null
    formulaKeys: string[]
  }
  thinBloodTraits:
    CharacterDraftApiThinBloodTrait[]
  advantages: {
    selections:
      CharacterDraftApiAdvantageSelection[]
  }
  humanity: CharacterDraftApiHumanity
  creation: {
    currentStep: CreationStepId
    skillDistributionMethod:
      SkillDistributionMethod
    predatorTypeChoices:
      Record<string, number>
  }
}

export interface UpdateCharacterDraftApiRequest {
  expectedRevision: number
  chronicleId?: string | null
  identity?:
    Partial<CharacterDraftApiIdentity>
  attributes?:
    Partial<CharacterAttributesDraft>
  blood?: Partial<CharacterDraftApiBlood>
  damage?: CharacterDraftApiDamage
  skills?: Partial<CharacterSkillsDraft>
  skillSpecialties?:
    CharacterDraftApiSkillSpecialty[]
  disciplines?: CharacterDraftApiDiscipline[]
  bloodSorceryRituals?: {
    ritualKeys: string[]
  }
  oblivionCeremonies?: {
    ceremonyKeys: string[]
  }
  thinBloodAlchemy?: {
    rating: number
    method: ThinBloodAlchemyMethod | null
    formulaKeys: string[]
  }
  thinBloodTraits?:
    CharacterDraftApiThinBloodTrait[]
  advantages?: {
    selections:
      CharacterDraftApiAdvantageSelection[]
  }
  humanityValue?: number
  humanityStains?: number
  humanityNarrative?: {
    convictions:
      CharacterDraftApiHumanity['convictions']
    touchstones:
      CharacterDraftApiHumanity['touchstones']
  }
  creation?: Partial<{
    currentStep: CreationStepId
    skillDistributionMethod:
      SkillDistributionMethod
    predatorTypeChoices:
      Record<string, number>
  }>
}

export interface UpdateCharacterChronicleAssociationApiRequest {
  readonly expectedRevision: number
  readonly chronicleId: string | null
  readonly confirmChange: boolean
}

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

export interface PersistedCharacterIdentity {
  name: string
  concept: string | null
  predatorTypeKey: string | null
  ambition: string | null
  clanKey: string | null
  sire: string | null
  desire: string | null
  generation: number | null
}

export interface PersistedCharacterCreationState {
  schemaVersion: number
  currentStep: CharacterCreationStep
  skillDistributionMethod: SkillDistributionMethod
  updatedAt: Date
}

export interface PersistedCharacterAttributes {
  strength: number
  dexterity: number
  stamina: number
  charisma: number
  manipulation: number
  composure: number
  intelligence: number
  wits: number
  resolve: number
}

export interface PersistedCharacterBlood {
  bloodPotency: number
  hunger: number
}

export const CHARACTER_SKILL_KEYS = [
  'athletics',
  'brawl',
  'craft',
  'drive',
  'firearms',
  'larceny',
  'melee',
  'stealth',
  'survival',
  'animalKen',
  'etiquette',
  'insight',
  'intimidation',
  'leadership',
  'performance',
  'persuasion',
  'streetwise',
  'subterfuge',
  'academics',
  'awareness',
  'finance',
  'investigation',
  'medicine',
  'occult',
  'politics',
  'science',
  'technology',
] as const

export type CharacterSkillKey =
  typeof CHARACTER_SKILL_KEYS[number]

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

export const CHARACTER_DISCIPLINE_KEYS = [
  'animalism',
  'auspex',
  'bloodSorcery',
  'celerity',
  'dominate',
  'fortitude',
  'obfuscate',
  'oblivion',
  'potence',
  'presence',
  'protean',
  'thinBloodAlchemy',
] as const

export type CharacterDisciplineKey =
  typeof CHARACTER_DISCIPLINE_KEYS[number]

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
  humanity: PersistedCharacterHumanity
  creation: {
    currentStep: CharacterCreationStep
    skillDistributionMethod: SkillDistributionMethod
  }
}

export interface UpdateCharacterDraftData {
  characterId: string
  expectedRevision: number
  chronicleId?: string | null
  identity?: Partial<PersistedCharacterIdentity>
  attributes?: Partial<PersistedCharacterAttributes>
  blood?: Partial<PersistedCharacterBlood>
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
  humanityValue?: number
  humanityNarrative?: {
    convictions: PersistedCharacterConviction[]
    touchstones: PersistedCharacterTouchstone[]
  }
  creation?: Partial<
    Pick<
      PersistedCharacterCreationState,
      'currentStep' | 'skillDistributionMethod'
    >
  >
}

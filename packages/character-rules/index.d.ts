export type CharacterRulesCatalogDomain =
  | 'disciplines'
  | 'advantages'
  | 'dependencies'

export type CharacterRulesCatalogDomainState =
  | 'ready'
  | 'pending'

export interface CharacterRulesCatalogManifest {
  readonly schemaVersion: number
  readonly catalogVersion: string
  readonly domains: Readonly<
    Record<
      CharacterRulesCatalogDomain,
      CharacterRulesCatalogDomainState
    >
  >
}

export type CharacterRulesDisciplineKey =
  | 'animalism'
  | 'auspex'
  | 'bloodSorcery'
  | 'celerity'
  | 'dominate'
  | 'fortitude'
  | 'obfuscate'
  | 'oblivion'
  | 'potence'
  | 'presence'
  | 'protean'
  | 'thinBloodAlchemy'

export type CharacterRulesAttributeKey =
  | 'strength'
  | 'dexterity'
  | 'stamina'
  | 'charisma'
  | 'manipulation'
  | 'composure'
  | 'intelligence'
  | 'wits'
  | 'resolve'

export type CharacterRulesSkillKey =
  | 'athletics'
  | 'brawl'
  | 'craft'
  | 'drive'
  | 'firearms'
  | 'larceny'
  | 'melee'
  | 'stealth'
  | 'survival'
  | 'animalKen'
  | 'etiquette'
  | 'insight'
  | 'intimidation'
  | 'leadership'
  | 'performance'
  | 'persuasion'
  | 'streetwise'
  | 'subterfuge'
  | 'academics'
  | 'awareness'
  | 'finance'
  | 'investigation'
  | 'medicine'
  | 'occult'
  | 'politics'
  | 'science'
  | 'technology'

export interface CharacterRulesDisciplineDefinition {
  readonly key: CharacterRulesDisciplineKey
  readonly name: string
  readonly active: boolean
}

export interface CharacterRulesDisciplinePowerRequirements {
  readonly prerequisitePowerKeys?: readonly string[]
  readonly amalgam?: {
    readonly disciplineKey:
      CharacterRulesDisciplineKey
    readonly minimumLevel: number
  }
}

export type CharacterRulesDisciplinePowerDicePoolTerm =
  | {
      readonly kind: 'attribute'
      readonly key: CharacterRulesAttributeKey
    }
  | {
      readonly kind: 'skill'
      readonly key: CharacterRulesSkillKey
    }
  | {
      readonly kind: 'discipline'
      readonly key: CharacterRulesDisciplineKey
    }

export interface CharacterRulesDisciplinePowerDefinition {
  readonly key: string
  readonly disciplineKey:
    CharacterRulesDisciplineKey
  readonly name: string
  readonly level: number
  readonly active: boolean
  readonly summary?: string
  readonly sourceKey?: string
  readonly sourcePage?: number
  readonly requirements?:
    CharacterRulesDisciplinePowerRequirements
  readonly diceCheck?: {
    readonly pool:
      readonly CharacterRulesDisciplinePowerDicePoolTerm[]
  }
}

export interface CharacterRulesBloodSorceryRitualDefinition {
  readonly key: string
  readonly name: string
  readonly level: number
  readonly summary?: string
  readonly sourceKey?: string
  readonly sourcePage?: number
}

export interface CharacterRulesOblivionCeremonyDefinition {
  readonly key: string
  readonly name: string
  readonly level: number
  readonly summary?: string
  readonly sourceKey?: string
  readonly sourcePage?: number
  readonly requirements?: {
    readonly prerequisitePowerKeys?:
      readonly string[]
  }
}

export type CharacterRulesThinBloodAlchemyFormulaSource =
  | 'core'
  | 'playersGuide'
  | 'bloodSigils'

export type CharacterRulesThinBloodAlchemyFormulaKind =
  | 'named'
  | 'imitatedDisciplinePower'
  | 'custom'

export interface CharacterRulesThinBloodAlchemyFormulaDefinition {
  readonly key: string
  readonly name: string
  readonly level: 1 | 2 | 3 | 4 | 5
  readonly source:
    CharacterRulesThinBloodAlchemyFormulaSource
  readonly sourcePage?: number
  readonly kind:
    CharacterRulesThinBloodAlchemyFormulaKind
  readonly relatedFormulaKeys?: readonly string[]
  readonly tags?: readonly string[]
}

export interface CharacterRulesDisciplineCatalog {
  readonly disciplines:
    readonly CharacterRulesDisciplineDefinition[]
  readonly powers:
    readonly CharacterRulesDisciplinePowerDefinition[]
  readonly bloodSorceryRituals:
    readonly CharacterRulesBloodSorceryRitualDefinition[]
  readonly oblivionCeremonies:
    readonly CharacterRulesOblivionCeremonyDefinition[]
  readonly thinBloodAlchemyFormulas:
    readonly CharacterRulesThinBloodAlchemyFormulaDefinition[]
}


export type CharacterRulesAdvantageCategory =
  | 'merit'
  | 'background'
  | 'flaw'

export type CharacterRulesAdvantageSelectionOrigin =
  | 'creation'
  | 'predatorType'
  | 'thinBlood'

export type CharacterRulesAdvantageSource =
  | 'core'
  | 'playersGuide'
  | 'bloodSigils'
  | 'other'

export type CharacterRulesAdvantageFamily =
  | 'mythic-flaw'

export type CharacterRulesAdvantageCharacterKind =
  | 'standard'
  | 'caitiff'
  | 'thinBlood'

export type CharacterRulesAdvantageAgeCategory =
  | 'fledgling'
  | 'neonate'
  | 'ancilla'
  | 'elder'

export type CharacterRulesAdvantageInstanceDetailsKind =
  | 'allies'
  | 'contact'
  | 'retainer'
  | 'status'
  | 'fame'
  | 'influence'
  | 'mask'
  | 'mawla'
  | 'herd'
  | 'resources'
  | 'haven'
  | 'substanceUse'
  | 'preyExclusion'
  | 'folkloricBane'
  | 'folkloricBlock'
  | 'loresheet'
  | 'linguistics'
  | 'methuselahVisage'
  | 'famousFace'
  | 'childOfTheScene'
  | 'enemy'
  | 'stalker'
  | 'darkSecret'
  | 'infamy'
  | 'despised'
  | 'hatred'
  | 'exiled'
  | 'suspect'
  | 'shunned'
  | 'mortalPretender'

export interface CharacterRulesAdvantageLegacyRequirements {
  readonly characterKinds?:
    readonly CharacterRulesAdvantageCharacterKind[]
  readonly clanKeys?: readonly string[]
  readonly excludedClanKeys?: readonly string[]
  readonly requiredDefinitionKeys?: readonly string[]
  readonly minimumAgeCategory?:
    CharacterRulesAdvantageAgeCategory
}

export type CharacterRulesAdvantageRequirement =
  | {
      readonly type: 'advantage'
      readonly definitionKey: string
      readonly minRating?: number
    }
  | {
      readonly type: 'clan'
      readonly allowedClanKeys: readonly string[]
    }
  | {
      readonly type: 'predatorType'
      readonly allowedPredatorTypeKeys:
        readonly string[]
    }
  | {
      readonly type: 'thinBlood'
      readonly expected: boolean
    }
  | {
      readonly type: 'humanity'
      readonly min: number
    }
  | {
      readonly type: 'generation'
      readonly max: number
    }

export interface CharacterRulesAdvantageDefinition {
  readonly key: string
  readonly name: string
  readonly active: boolean
  readonly category:
    CharacterRulesAdvantageCategory
  readonly allowedRatings: readonly number[]
  readonly source: CharacterRulesAdvantageSource
  readonly sourcePage?: number
  readonly originRatingConstraints?: readonly {
    readonly origin:
      CharacterRulesAdvantageSelectionOrigin
    readonly allowedRatings: readonly number[]
  }[]
  readonly allowMultiple: boolean
  readonly requiresInstanceDetails: boolean
  readonly instanceDetailsKind?:
    CharacterRulesAdvantageInstanceDetailsKind
  readonly requiresParentSelection?: boolean
  readonly allowsOptionalParentSelection?: boolean
  readonly allowedParentDefinitionKeys?:
    readonly string[]
  readonly minimumParentRating?: number
  readonly parentRatingConstraints?: readonly {
    readonly parentRating: number
    readonly allowedRatings: readonly number[]
  }[]
  readonly requirementRules?:
    readonly CharacterRulesAdvantageRequirement[]
  readonly requirements?:
    CharacterRulesAdvantageLegacyRequirements
  readonly families?:
    readonly CharacterRulesAdvantageFamily[]
  readonly incompatibleDefinitionKeys?:
    readonly string[]
}

export interface CharacterRulesAdvantageCatalog {
  readonly definitions:
    readonly CharacterRulesAdvantageDefinition[]
}

export interface CharacterRulesPredatorTypeRestriction {
  readonly excludedClans?: readonly string[]
  readonly requiredClans?: readonly string[]
  readonly requiredMerits?: readonly string[]
  readonly forbiddenMerits?: readonly string[]
  readonly minimumHumanity?: number
  readonly maximumHumanity?: number
  readonly minimumBloodPotency?: number
  readonly maximumBloodPotency?: number
  readonly requiresStorytellerApproval?: boolean
}

export interface CharacterRulesPredatorTypeChoiceCondition {
  readonly clan?: string
}

export interface CharacterRulesPredatorTypeSpecialtyGrant {
  readonly type: 'specialty'
  readonly skillKey: CharacterRulesSkillKey
  readonly name: string
}

export interface CharacterRulesPredatorTypeDisciplineGrant {
  readonly type: 'discipline'
  readonly disciplineKey: CharacterRulesDisciplineKey
  readonly dots: number
}

export interface CharacterRulesPredatorTypeAdvantageGrant {
  readonly type: 'advantage'
  readonly definitionKey: string
  readonly category: CharacterRulesAdvantageCategory
  readonly rating: number
}

export interface CharacterRulesPredatorTypeHumanityGrant {
  readonly type: 'humanity'
  readonly modifier: number
}

export interface CharacterRulesPredatorTypeBloodPotencyGrant {
  readonly type: 'bloodPotency'
  readonly modifier: number
}

interface CharacterRulesPredatorTypePointDistributionOptionBase {
  readonly category: CharacterRulesAdvantageCategory
  readonly maximumRating?: number
}

export type CharacterRulesPredatorTypePointDistributionOption =
  | (
      CharacterRulesPredatorTypePointDistributionOptionBase & {
        readonly definitionKey: string
        readonly family?: never
      }
    )
  | (
      CharacterRulesPredatorTypePointDistributionOptionBase & {
        readonly definitionKey?: never
        readonly family: CharacterRulesAdvantageFamily
      }
    )

export interface CharacterRulesPredatorTypePointDistributionGrant {
  readonly type: 'pointDistribution'
  readonly points: number
  readonly options:
    readonly CharacterRulesPredatorTypePointDistributionOption[]
}

export type CharacterRulesPredatorTypeChoiceGrant =
  | CharacterRulesPredatorTypeSpecialtyGrant
  | CharacterRulesPredatorTypeDisciplineGrant
  | CharacterRulesPredatorTypeAdvantageGrant
  | CharacterRulesPredatorTypeHumanityGrant
  | CharacterRulesPredatorTypeBloodPotencyGrant
  | CharacterRulesPredatorTypePointDistributionGrant

export interface CharacterRulesPredatorTypeChoiceOption {
  readonly when?: CharacterRulesPredatorTypeChoiceCondition
  readonly grant: CharacterRulesPredatorTypeChoiceGrant
}

export interface CharacterRulesPredatorTypeChoice {
  readonly id: string
  readonly minimumSelections: number
  readonly maximumSelections: number
  readonly options:
    readonly CharacterRulesPredatorTypeChoiceOption[]
}

export interface CharacterRulesPredatorTypeFixedAdvantageGrant {
  readonly definitionKey: string
  readonly category: CharacterRulesAdvantageCategory
  readonly rating: number
}

export interface CharacterRulesPredatorTypeDefinition {
  readonly key: string
  readonly name: string
  readonly restrictions?: CharacterRulesPredatorTypeRestriction
  readonly fixedGrants?: {
    readonly advantages?:
      readonly CharacterRulesPredatorTypeFixedAdvantageGrant[]
    readonly humanityModifier?: number
    readonly bloodPotencyModifier?: number
    readonly pointDistributions?:
      readonly CharacterRulesPredatorTypePointDistributionGrant[]
  }
  readonly choices?: readonly CharacterRulesPredatorTypeChoice[]
  readonly pendingReferences?: readonly {
    readonly definitionKey: string
  }[]
  readonly storyEffects?: readonly string[]
  readonly notes?: readonly string[]
  readonly tags?: readonly string[]
}

export interface CharacterRulesDependencyCatalog {
  readonly predatorTypes:
    readonly CharacterRulesPredatorTypeDefinition[]
}

export const characterRulesCatalogManifest:
  CharacterRulesCatalogManifest

export const characterDisciplineCatalog:
  CharacterRulesDisciplineCatalog

export const characterAdvantageCatalog:
  CharacterRulesAdvantageCatalog

export const characterDependencyCatalog:
  CharacterRulesDependencyCatalog

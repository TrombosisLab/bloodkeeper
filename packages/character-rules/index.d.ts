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

export type CharacterRulesBloodResonanceKey =
  | 'choleric'
  | 'melancholy'
  | 'phlegmatic'
  | 'sanguine'

export type CharacterRulesBloodTemperament =
  | 'fleeting'
  | 'intense'
  | 'acute'

export type CharacterRulesBloodSourceKind =
  | 'human'
  | 'animal'

export type CharacterRulesBloodSpecialAffinityKey =
  | 'animalBlood'
  | 'resonanceFree'

export type CharacterRulesBloodResonanceSource =
  | 'core'
  | 'playersGuide'

export interface CharacterRulesBloodResonanceDefinition {
  readonly key: CharacterRulesBloodResonanceKey
  readonly name: string
  readonly disciplineKeys:
    readonly CharacterRulesDisciplineKey[]
  readonly source:
    CharacterRulesBloodResonanceSource
  readonly sourcePage: number
  readonly active: boolean
}

export interface CharacterRulesBloodTemperamentDefinition {
  readonly key: CharacterRulesBloodTemperament
  readonly name: string
  readonly baseDisciplineDiceBonus: 0 | 1
  readonly source:
    CharacterRulesBloodResonanceSource
  readonly sourcePage: number
  readonly active: boolean
}

export interface CharacterRulesBloodSpecialAffinityDefinition {
  readonly key:
    CharacterRulesBloodSpecialAffinityKey
  readonly name: string
  readonly disciplineKeys:
    readonly CharacterRulesDisciplineKey[]
  readonly usesTemperamentDiceBonus: boolean
  readonly source:
    CharacterRulesBloodResonanceSource
  readonly sourcePage: number
  readonly active: boolean
}

export interface CharacterRulesBloodResonanceCatalog {
  readonly resonances:
    readonly CharacterRulesBloodResonanceDefinition[]
  readonly temperaments:
    readonly CharacterRulesBloodTemperamentDefinition[]
  readonly specialAffinities:
    readonly CharacterRulesBloodSpecialAffinityDefinition[]
}

export function deriveCharacterBloodResonanceBaseDiceBonus(
  temperament: CharacterRulesBloodTemperament,
): 0 | 1

export type CharacterRulesBloodDyscrasiaKey =
  | 'aggressive'
  | 'cycleOfViolence'
  | 'energetic'
  | 'envy'
  | 'bully'
  | 'righteous'
  | 'vengeful'
  | 'lostLove'
  | 'grieving'
  | 'evocative'
  | 'colossalFailure'
  | 'nostalgic'
  | 'lostRelative'
  | 'comfortablyNumb'
  | 'eatingYourEmotions'
  | 'givenUp'
  | 'loneWolf'
  | 'procrastinate'
  | 'reflection'
  | 'relaxed'
  | 'trueLove'
  | 'manicHigh'
  | 'excited'
  | 'enthusiasticAboutLife'
  | 'contagiousEnthusiasm'
  | 'sniffingGame'

export type CharacterRulesBloodDyscrasiaDonorPersistence =
  'storytellerDefined'

export type CharacterRulesBloodDyscrasiaAcquisitionMode =
  | 'drainAndKill'
  | 'feedThreeNights'

export type CharacterRulesBloodDyscrasiaEffectDuration =
  | 'untilNextFeedingOrHungerFive'
  | 'nextFeeding'
  | 'scene'
  | 'consumedImmediately'

export type CharacterRulesBloodDyscrasiaEffectKind =
  | 'contextualReroll'
  | 'nextFeedingSatietyByResonance'
  | 'restrictedExperienceGrant'
  | 'conditionalDamageModifier'
  | 'contextualPoolModifier'
  | 'remorsePoolModifier'
  | 'nostalgiaPoolModifier'
  | 'relationshipFeedingSatietyModifier'
  | 'ignoreDamagePenalties'
  | 'foodTolerance'
  | 'soloTeamworkPoolModifier'
  | 'willpowerRecovery'
  | 'frenzyResistancePoolModifier'
  | 'trueLove'
  | 'poolShiftAfterFailure'
  | 'rouseCheckExemption'
  | 'contactPersuasionPoolModifier'
  | 'detectResonanceVesselsPoolModifier'

export interface CharacterRulesBloodDyscrasiaEffect {
  readonly kind:
    CharacterRulesBloodDyscrasiaEffectKind
  readonly [key: string]: unknown
}

export interface CharacterRulesBloodDyscrasiaDefinition {
  readonly key:
    CharacterRulesBloodDyscrasiaKey
  readonly name: string
  readonly resonanceKey:
    CharacterRulesBloodResonanceKey
  readonly summary: string
  readonly source: 'core'
  readonly sourcePage: 230 | 231
  readonly donorPersistence:
    CharacterRulesBloodDyscrasiaDonorPersistence
  readonly acquisitionModes:
    readonly CharacterRulesBloodDyscrasiaAcquisitionMode[]
  readonly drinkerEffectDuration:
    CharacterRulesBloodDyscrasiaEffectDuration
  readonly consumable: boolean
  readonly effect:
    CharacterRulesBloodDyscrasiaEffect
  readonly active: boolean
}

export interface CharacterRulesBloodDyscrasiaCatalog {
  readonly definitions:
    readonly CharacterRulesBloodDyscrasiaDefinition[]
}

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

export interface CharacterRulesDerivedAttributes {
  readonly stamina: number
  readonly composure: number
  readonly resolve: number
}

export function deriveCharacterHealthCapacity(
  attributes: CharacterRulesDerivedAttributes,
): number

export function deriveCharacterWillpowerCapacity(
  attributes: CharacterRulesDerivedAttributes,
): number

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

export type CharacterRulesSkillCategory =
  | 'physical'
  | 'social'
  | 'mental'

export interface CharacterRulesSkillDefinition {
  readonly key: CharacterRulesSkillKey
  readonly name: string
  readonly category: CharacterRulesSkillCategory
  readonly active: boolean
}

export interface CharacterRulesSkillCatalog {
  readonly definitions:
    readonly CharacterRulesSkillDefinition[]
}

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

export type CharacterRulesDisciplinePowerActivationKind =
  | 'standalone'
  | 'enhancement'
  | 'extension'

export type CharacterRulesDisciplinePowerRouseCostExemption =
  'targetIsFamulus'

export type CharacterRulesDisciplinePowerRouseCostUnit =
  | 'distinctNight'
  | 'animalType'

export type CharacterRulesDisciplinePowerRouseCost =
  | {
      readonly kind: 'none'
    }
  | {
      readonly kind: 'fixed'
      readonly checks: number
      readonly exemptions?:
        readonly CharacterRulesDisciplinePowerRouseCostExemption[]
    }
  | {
      readonly kind: 'perUnit'
      readonly checks: number
      readonly unit:
        CharacterRulesDisciplinePowerRouseCostUnit
      readonly requiredUnits?: number
      readonly exemptions?:
        readonly CharacterRulesDisciplinePowerRouseCostExemption[]
    }
  | {
      readonly kind: 'inheritedFromBasePower'
    }
  | {
      readonly kind: 'additionalToBasePower'
      readonly checks: number
      readonly scaling?: {
        readonly kind:
          'perAdditionalTargetBeyondAttribute'
        readonly attributeKey:
          CharacterRulesAttributeKey
        readonly checksPerTarget: number
      }
    }

export type CharacterRulesDisciplinePowerSceneEndCondition =
  | 'movement'
  | 'detected'
  | 'voluntaryEnd'
  | 'orderCompleted'

export type CharacterRulesDisciplinePowerUntilEvent =
  | 'targetDeath'
  | 'frenzyEnds'

export type CharacterRulesDisciplinePowerConditionalWhen =
  | 'targetIsMortal'
  | 'targetIsVampire'

export type CharacterRulesDisciplinePowerOutcome =
  | 'normalSuccess'
  | 'criticalSuccess'

export type CharacterRulesDisciplinePowerDuration =
  | {
      readonly kind: 'scene'
      readonly endConditions?:
        readonly CharacterRulesDisciplinePowerSceneEndCondition[]
    }
  | {
      readonly kind: 'passive'
    }
  | {
      readonly kind: 'feeding'
    }
  | {
      readonly kind: 'singleUse'
    }
  | {
      readonly kind: 'night'
    }
  | {
      readonly kind: 'nightWithEndConditions'
      readonly endConditions: readonly (
        | 'nextFeeding'
        | 'hungerFive'
      )[]
    }
  | {
      readonly kind: 'untilResisted'
    }
  | {
      readonly kind: 'turns'
      readonly count: number
    }
  | {
      readonly kind: 'turnsByMargin'
      readonly baseTurns: number
    }
  | {
      readonly kind: 'hoursByMargin'
      readonly baseHours: number
    }
  | {
      readonly kind: 'inheritedFromBasePower'
    }
  | {
      readonly kind: 'nightsByMargin'
      readonly baseNights: number
    }
  | {
      readonly kind: 'indefinite'
    }
  | {
      readonly kind: 'untilEvent'
      readonly event:
        CharacterRulesDisciplinePowerUntilEvent
    }
  | {
      readonly kind: 'conditional'
      readonly cases: readonly {
        readonly when:
          CharacterRulesDisciplinePowerConditionalWhen
        readonly duration:
          | {
              readonly kind: 'scene'
            }
          | {
              readonly kind: 'turnsByMargin'
              readonly baseTurns: number
            }
      }[]
    }
  | {
      readonly kind: 'outcomeBased'
      readonly cases: readonly {
        readonly outcome:
          CharacterRulesDisciplinePowerOutcome
        readonly duration:
          | {
              readonly kind: 'scene'
            }
          | {
              readonly kind: 'indefinite'
            }
      }[]
    }

export type CharacterRulesDisciplinePowerCheckResolution =
  | {
      readonly kind: 'fixedDifficulty'
      readonly value: number
    }
  | {
      readonly kind: 'contextualDifficulty'
      readonly min?: number
      readonly max?: number
    }
  | {
      readonly kind: 'opposed'
      readonly opposingPool:
        readonly CharacterRulesDisciplinePowerDicePoolTerm[]
    }

export interface CharacterRulesDisciplinePowerMechanicCheck {
  readonly key: string
  readonly role:
    | 'activation'
    | 'conditional'
    | 'detection'
  readonly visibility?: 'normal' | 'hidden'
  readonly pool:
    readonly CharacterRulesDisciplinePowerDicePoolTerm[]
  readonly resolution:
    CharacterRulesDisciplinePowerCheckResolution
}

export interface CharacterRulesDisciplinePowerModifier {
  readonly kind:
    | 'dicePool'
    | 'difficulty'
  readonly value: number
  readonly contextKey: string
}

export interface CharacterRulesDisciplinePowerUsageLimit {
  readonly kind: 'perScene'
  readonly count: number
}

export interface CharacterRulesDisciplinePowerMechanics {
  readonly systemSummary?: string
  readonly activation: {
    readonly kind:
      CharacterRulesDisciplinePowerActivationKind
  }
  readonly rouseCost:
    CharacterRulesDisciplinePowerRouseCost
  readonly duration:
    CharacterRulesDisciplinePowerDuration
  readonly checks?:
    readonly CharacterRulesDisciplinePowerMechanicCheck[]
  readonly modifiers?:
    readonly CharacterRulesDisciplinePowerModifier[]
  readonly limits?:
    readonly CharacterRulesDisciplinePowerUsageLimit[]
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
  readonly mechanics?:
    CharacterRulesDisciplinePowerMechanics
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

export type CharacterRulesClanKind =
  | 'clan'
  | 'caitiff'
  | 'thinBlood'

export interface CharacterRulesClanDisciplineAffinity {
  readonly clanKey: string
  readonly kind: CharacterRulesClanKind
  readonly disciplineKeys:
    readonly CharacterRulesDisciplineKey[]
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
  readonly clanAffinities:
    readonly CharacterRulesClanDisciplineAffinity[]
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

export type CharacterRulesLoresheetLevel =
  | 1
  | 2
  | 3
  | 4
  | 5

export interface CharacterRulesLoresheetRequirements {
  readonly characterKinds?:
    readonly CharacterRulesAdvantageCharacterKind[]
  readonly clanKeys?: readonly string[]
  readonly excludedClanKeys?: readonly string[]
}

export interface CharacterRulesLoresheetBenefitDefinition {
  readonly key: string
  readonly name: string
  readonly level: CharacterRulesLoresheetLevel
}

export interface CharacterRulesLoresheetDefinition {
  readonly key: string
  readonly name: string
  readonly source: CharacterRulesAdvantageSource
  readonly sourcePage?: number
  readonly requirements?:
    CharacterRulesLoresheetRequirements
  readonly benefits:
    readonly CharacterRulesLoresheetBenefitDefinition[]
}

export interface CharacterRulesAdvantageCatalog {
  readonly definitions:
    readonly CharacterRulesAdvantageDefinition[]
  readonly loresheets:
    readonly CharacterRulesLoresheetDefinition[]
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

export type CharacterRulesThinBloodTraitCategory =
  | 'merit'
  | 'flaw'

export type CharacterRulesThinBloodTraitSource =
  | 'core'

export interface CharacterRulesThinBloodTraitDefinition {
  readonly key: string
  readonly name: string
  readonly category:
    CharacterRulesThinBloodTraitCategory
  readonly source:
    CharacterRulesThinBloodTraitSource
  readonly incompatibleWithKeys?:
    readonly string[]
}

export interface CharacterRulesDependencyCatalog {
  readonly predatorTypes:
    readonly CharacterRulesPredatorTypeDefinition[]
  readonly thinBloodTraits:
    readonly CharacterRulesThinBloodTraitDefinition[]
}

export const characterRulesCatalogManifest:
  CharacterRulesCatalogManifest

export const characterDisciplineCatalog:
  CharacterRulesDisciplineCatalog

export const characterAdvantageCatalog:
  CharacterRulesAdvantageCatalog

export const characterDependencyCatalog:
  CharacterRulesDependencyCatalog

export const characterSkillCatalog:
  CharacterRulesSkillCatalog

export const characterBloodResonanceCatalog:
  CharacterRulesBloodResonanceCatalog

export const characterBloodDyscrasiaCatalog:
  CharacterRulesBloodDyscrasiaCatalog

export interface CharacterRulesMortalAdvantageExclusionCatalog {
  readonly feeding: readonly string[]
  readonly archaic: readonly string[]
  readonly domain: readonly string[]
  readonly status: readonly string[]
  readonly mythic: readonly string[]
  readonly herd: readonly string[]
  readonly thinBlood: readonly string[]
}

export const characterMortalAdvantageExclusionCatalog:
  CharacterRulesMortalAdvantageExclusionCatalog

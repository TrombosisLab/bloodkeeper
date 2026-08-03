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

export const characterRulesCatalogManifest:
  CharacterRulesCatalogManifest

export const characterDisciplineCatalog:
  CharacterRulesDisciplineCatalog

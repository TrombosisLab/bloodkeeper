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

export const characterRulesCatalogManifest:
  CharacterRulesCatalogManifest

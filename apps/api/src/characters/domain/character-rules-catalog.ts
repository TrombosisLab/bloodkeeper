import {
  characterRulesCatalogManifest,
} from '@v5r/character-rules'

import type {
  CharacterRulesCatalogDomain,
  CharacterRulesCatalogDomainState,
  CharacterRulesCatalogManifest,
} from '@v5r/character-rules'

export const CHARACTER_RULES_CATALOG = Symbol(
  'CHARACTER_RULES_CATALOG',
)

export interface CharacterRulesCatalog {
  readonly manifest: CharacterRulesCatalogManifest

  stateOf(
    domain: CharacterRulesCatalogDomain,
  ): CharacterRulesCatalogDomainState
}

export function createCharacterRulesCatalog(
  manifest: CharacterRulesCatalogManifest,
): CharacterRulesCatalog {
  if (!Number.isInteger(manifest.schemaVersion)) {
    throw new Error(
      'Character rules catalog schema version must be an integer',
    )
  }

  if (manifest.schemaVersion < 1) {
    throw new Error(
      'Character rules catalog schema version must be positive',
    )
  }

  if (manifest.catalogVersion.trim().length === 0) {
    throw new Error(
      'Character rules catalog version is required',
    )
  }

  for (const domain of [
    'disciplines',
    'advantages',
    'dependencies',
  ] as const) {
    const state = manifest.domains[domain]

    if (state !== 'ready' && state !== 'pending') {
      throw new Error(
        `Character rules catalog domain ${domain} has an invalid state`,
      )
    }
  }

  const snapshot: CharacterRulesCatalogManifest =
    Object.freeze({
      schemaVersion: manifest.schemaVersion,
      catalogVersion: manifest.catalogVersion,
      domains: Object.freeze({
        ...manifest.domains,
      }),
    })

  return Object.freeze({
    manifest: snapshot,

    stateOf(
      domain: CharacterRulesCatalogDomain,
    ) {
      return snapshot.domains[domain]
    },
  })
}

export const characterRulesCatalog =
  createCharacterRulesCatalog(
    characterRulesCatalogManifest,
  )

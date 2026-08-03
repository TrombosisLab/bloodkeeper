import {
  characterRulesCatalogManifest,
} from '@v5r/character-rules'

export function isCharacterRulesCatalogReady(
  domain:
    keyof typeof characterRulesCatalogManifest.domains,
): boolean {
  return (
    characterRulesCatalogManifest.domains[domain] ===
    'ready'
  )
}

export { characterRulesCatalogManifest }

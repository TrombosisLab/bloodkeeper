import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterRulesCatalogManifest,
  isCharacterRulesCatalogReady,
} from '../src/features/character-creation/domain/character-rules-catalog.ts'

test(
  '029-P la interfaz consume el manifiesto compartido',
  () => {
    assert.equal(
      characterRulesCatalogManifest.schemaVersion,
      1,
    )
    assert.equal(
      characterRulesCatalogManifest.catalogVersion,
      '2026.08.03-t',
    )
  },
)

test(
  '029-T publica Disciplinas Ventajas y Dependencias',
  () => {
    assert.equal(
      isCharacterRulesCatalogReady('disciplines'),
      true,
    )
    assert.equal(
      isCharacterRulesCatalogReady('advantages'),
      true,
    )
    assert.equal(
      isCharacterRulesCatalogReady('dependencies'),
      true,
    )
  },
)

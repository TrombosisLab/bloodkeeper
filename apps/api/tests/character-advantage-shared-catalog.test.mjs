import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageCatalog,
  characterRulesCatalogManifest,
} from '@v5r/character-rules'

function duplicateValues(values) {
  const seen = new Set()
  const duplicates = new Set()

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }

  return [...duplicates]
}

test(
  '029-T conserva Ventajas al completar Dependencias',
  () => {
    const definitions =
      characterAdvantageCatalog.definitions

    assert.equal(definitions.length, 108)
    assert.equal(
      definitions.filter(
        ({ category }) => category === 'background',
      ).length,
      12,
    )
    assert.equal(
      definitions.filter(
        ({ category }) => category === 'merit',
      ).length,
      52,
    )
    assert.equal(
      definitions.filter(
        ({ category }) => category === 'flaw',
      ).length,
      44,
    )
    assert.equal(
      characterRulesCatalogManifest.domains.advantages,
      'ready',
    )
    assert.equal(
      characterRulesCatalogManifest.domains.dependencies,
      'ready',
    )
  },
)

test(
  '029-S conserva identidades y contratos internos coherentes',
  () => {
    const definitions =
      characterAdvantageCatalog.definitions
    const keys = new Set(
      definitions.map(({ key }) => key),
    )

    assert.deepEqual(
      duplicateValues([...keys]),
      [],
    )
    assert.equal(keys.size, definitions.length)

    for (const definition of definitions) {
      assert.equal(
        definition.key.trim().length > 0,
        true,
      )
      assert.equal(
        definition.name.trim().length > 0,
        true,
      )
      assert.equal(
        ['background', 'merit', 'flaw'].includes(
          definition.category,
        ),
        true,
      )
      assert.equal(
        typeof definition.active,
        'boolean',
      )
      assert.equal(
        definition.allowedRatings.length > 0,
        true,
      )
      assert.deepEqual(
        duplicateValues(
          definition.allowedRatings.map(String),
        ),
        [],
      )

      for (const rating of definition.allowedRatings) {
        assert.equal(Number.isInteger(rating), true)
        assert.equal(rating >= 1 && rating <= 7, true)
      }

      if (definition.requiresInstanceDetails) {
        assert.equal(
          typeof definition.instanceDetailsKind,
          'string',
        )
      }

      for (
        const parentKey of
          definition.allowedParentDefinitionKeys ?? []
      ) {
        assert.equal(keys.has(parentKey), true)
        assert.notEqual(parentKey, definition.key)
      }

      for (
        const incompatibleKey of
          definition.incompatibleDefinitionKeys ?? []
      ) {
        assert.equal(keys.has(incompatibleKey), true)
        assert.notEqual(incompatibleKey, definition.key)
      }
    }
  },
)

test(
  '029-S expone una instantanea compartida inmutable',
  () => {
    assert.equal(
      Object.isFrozen(characterAdvantageCatalog),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterAdvantageCatalog.definitions,
      ),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterAdvantageCatalog.definitions[0],
      ),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterAdvantageCatalog.definitions[0]
          .allowedRatings,
      ),
      true,
    )
  },
)

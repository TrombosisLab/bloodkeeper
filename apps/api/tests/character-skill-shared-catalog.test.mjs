import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterSkillCatalog,
} from '@v5r/character-rules'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const expectedCategories =
  new Set(['physical', 'social', 'mental'])

test(
  'SPEC-023 publica un catálogo canónico compartido de 27 Habilidades',
  () => {
    assert.equal(
      characterSkillCatalog.definitions.length,
      27,
    )

    assert.equal(
      new Set(
        characterSkillCatalog.definitions.map(
          (definition) => definition.key,
        ),
      ).size,
      27,
    )

    for (
      const definition of
        characterSkillCatalog.definitions
    ) {
      assert.equal(
        typeof definition.key,
        'string',
      )
      assert.equal(
        definition.key.length > 0,
        true,
      )
      assert.equal(
        typeof definition.name,
        'string',
      )
      assert.equal(
        definition.name.trim().length > 0,
        true,
      )
      assert.equal(
        expectedCategories.has(
          definition.category,
        ),
        true,
      )
      assert.equal(
        typeof definition.active,
        'boolean',
      )
    }
  },
)

test(
  'SPEC-023 API obtiene las claves desde el catálogo compartido',
  () => {
    assert.deepEqual(
      [...CHARACTER_SKILL_KEYS],
      characterSkillCatalog.definitions.map(
        (definition) => definition.key,
      ),
    )

    assert.deepEqual(
      characterRulesCatalog.skillCatalog,
      characterSkillCatalog,
    )
  },
)

test(
  'SPEC-023 el catálogo compartido es inmutable',
  () => {
    assert.equal(
      Object.isFrozen(characterSkillCatalog),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterSkillCatalog.definitions,
      ),
      true,
    )
    assert.equal(
      Object.isFrozen(
        characterSkillCatalog.definitions[0],
      ),
      true,
    )
  },
)

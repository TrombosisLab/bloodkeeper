import assert from 'node:assert/strict'
import test from 'node:test'

import { readFile } from 'node:fs/promises'

import {
  characterRulesCatalog,
  createCharacterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

test(
  '029-P carga un manifiesto canonico compartido',
  () => {
    assert.equal(
      characterRulesCatalog.manifest.schemaVersion,
      1,
    )
    assert.equal(
      characterRulesCatalog.stateOf('disciplines'),
      'pending',
    )
    assert.equal(
      characterRulesCatalog.stateOf('advantages'),
      'pending',
    )
    assert.equal(
      characterRulesCatalog.stateOf('dependencies'),
      'pending',
    )
  },
)

test(
  '029-P copia y congela el manifiesto recibido',
  () => {
    const domains = {
      disciplines: 'ready',
      advantages: 'pending',
      dependencies: 'pending',
    }
    const catalog = createCharacterRulesCatalog({
      schemaVersion: 1,
      catalogVersion: 'test',
      domains,
    })

    domains.disciplines = 'pending'

    assert.equal(
      catalog.stateOf('disciplines'),
      'ready',
    )
    assert.equal(Object.isFrozen(catalog), true)
    assert.equal(
      Object.isFrozen(catalog.manifest),
      true,
    )
    assert.equal(
      Object.isFrozen(catalog.manifest.domains),
      true,
    )
  },
)

test(
  '029-P rechaza versiones de catalogo invalidas',
  () => {
    assert.throws(
      () =>
        createCharacterRulesCatalog({
          schemaVersion: 0,
          catalogVersion: 'test',
          domains: {
            disciplines: 'pending',
            advantages: 'pending',
            dependencies: 'pending',
          },
        }),
      /schema version must be positive/,
    )

    assert.throws(
      () =>
        createCharacterRulesCatalog({
          schemaVersion: 1,
          catalogVersion: ' ',
          domains: {
            disciplines: 'pending',
            advantages: 'pending',
            dependencies: 'pending',
          },
        }),
      /catalog version is required/,
    )

    assert.throws(
      () =>
        createCharacterRulesCatalog({
          schemaVersion: 1,
          catalogVersion: 'test',
          domains: {
            disciplines: 'unknown',
            advantages: 'pending',
            dependencies: 'pending',
          },
        }),
      /disciplines has an invalid state/,
    )
  },
)

test(
  '029-P registra una unica fuente de catalogo en CharactersModule',
  async () => {
    const source = await readFile(
      new URL(
        '../src/characters/characters.module.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /provide:\s*CHARACTER_RULES_CATALOG/,
    )
    assert.match(
      source,
      /useValue:\s*characterRulesCatalog/,
    )
  },
)

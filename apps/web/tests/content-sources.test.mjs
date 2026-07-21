import assert from 'node:assert/strict'
import test from 'node:test'

import {
  contentSources,
  getContentSource,
} from '../src/features/character-creation/data/content-sources.ts'

test(
  'las claves de fuentes son únicas',
  () => {
    const keys =
      contentSources.map(
        (source) =>
          source.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'el Libro Básico está registrado como fuente core',
  () => {
    const source =
      getContentSource(
        'core-v5-es',
      )

    assert.ok(source)

    assert.equal(
      source.category,
      'core',
    )
  },
)

test(
  'la Guía del Jugador V5 está registrada como suplemento',
  () => {
    const source =
      getContentSource(
        'players-guide-v5-es',
      )

    assert.ok(source)

    assert.equal(
      source.edition,
      'V5',
    )

    assert.equal(
      source.category,
      'supplement',
    )
  },
)

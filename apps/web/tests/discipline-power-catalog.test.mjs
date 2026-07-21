import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

import {
  contentSources,
  getContentSource,
} from '../src/features/character-creation/data/content-sources.ts'

test(
  'las claves de poderes son únicas',
  () => {
    const keys =
      disciplinePowerDefinitions.map(
        (power) => power.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'todos los poderes tienen nivel válido',
  () => {
    for (
      const power of
      disciplinePowerDefinitions
    ) {
      assert.equal(
        Number.isInteger(
          power.level,
        ),
        true,
      )

      assert.equal(
        power.level >= 1 &&
          power.level <= 5,
        true,
      )
    }
  },
)

test(
  'todos los poderes tienen nombre y clave',
  () => {
    for (
      const power of
      disciplinePowerDefinitions
    ) {
      assert.equal(
        power.key.trim().length > 0,
        true,
      )

      assert.equal(
        power.name.trim().length > 0,
        true,
      )
    }
  },
)

test(
  'toda fuente declarada por un poder existe',
  () => {
    for (
      const power of
      disciplinePowerDefinitions
    ) {
      if (!power.sourceKey) {
        continue
      }

      assert.notEqual(
        getContentSource(
          power.sourceKey,
        ),
        undefined,
      )
    }
  },
)

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
  'los poderes temporales restantes están identificados como desarrollo',
  () => {
    const temporaryPowers =
      disciplinePowerDefinitions.filter(
        (power) =>
          power.disciplineKey !==
            'celerity' &&
          power.disciplineKey !==
            'potence' &&
          power.disciplineKey !==
            'presence' &&
          power.disciplineKey !==
            'animalism' &&
          power.disciplineKey !==
            'fortitude' &&
          power.disciplineKey !==
            'protean',
      )

    assert.equal(
      temporaryPowers.every(
        (power) =>
          power.sourceKey ===
          'development',
      ),
      true,
    )
  },
)

test(
  'Celeridad y Potencia ya no usan contenido de desarrollo',
  () => {
    const realPowers =
      disciplinePowerDefinitions.filter(
        (power) =>
          power.disciplineKey ===
            'celerity' ||
          power.disciplineKey ===
            'potence' ||
          power.disciplineKey ===
            'presence' ||
          power.disciplineKey ===
            'animalism' ||
          power.disciplineKey ===
            'fortitude' ||
          power.disciplineKey ===
            'protean',
      )

    assert.equal(
      realPowers.every(
        (power) =>
          power.sourceKey ===
          'core-v5-es',
      ),
      true,
    )
  },
)

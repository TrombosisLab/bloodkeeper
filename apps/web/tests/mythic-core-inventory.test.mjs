import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

const MYTHIC_CORE = [
  {
    key: 'stake-bait',
    name: 'Carne de Estaca',
    category: 'flaw',
    ratings: [2],
  },
  {
    key: 'folkloric-bane',
    name: 'Daño Folclórico',
    category: 'flaw',
    ratings: [1],
  },
  {
    key: 'folkloric-block',
    name: 'Tabú Folclórico',
    category: 'flaw',
    ratings: [1],
  },
  {
    key: 'stigmata',
    name: 'Estigmas',
    category: 'flaw',
    ratings: [1],
  },
  {
    key: 'eat-food',
    name: 'Comer Comida',
    category: 'merit',
    ratings: [2],
  },
]

test(
  'el inventario confirmado de Míticos Core contiene las cinco entradas normativas',
  () => {
    for (const expected of MYTHIC_CORE) {
      const definition =
        getCharacterAdvantageDefinition(
          expected.key,
        )

      assert.ok(
        definition,
        `Falta ${expected.name}`,
      )

      assert.equal(
        definition.name,
        expected.name,
      )

      assert.equal(
        definition.category,
        expected.category,
      )

      assert.deepEqual(
        definition.allowedRatings,
        expected.ratings,
      )

      assert.equal(
        definition.source,
        'core',
      )
    }
  },
)

test(
  'Repulsión de Cruces no existe como definición independiente',
  () => {
    assert.equal(
      getCharacterAdvantageDefinition(
        'cross-repulsion',
      ),
      null,
    )
  },
)

test(
  'Sin Reflejo no existe en el inventario Mítico confirmado',
  () => {
    assert.equal(
      getCharacterAdvantageDefinition(
        'no-reflection',
      ),
      null,
    )
  },
)

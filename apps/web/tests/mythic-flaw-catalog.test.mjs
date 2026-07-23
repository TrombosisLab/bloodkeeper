import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

test(
  'Míticos I registra Carne de Estaca, Daño Folclórico y Tabú Folclórico',
  () => {
    const expected = [
      {
        key: 'stake-bait',
        name: 'Carne de Estaca',
        ratings: [2],
      },
      {
        key: 'folkloric-bane',
        name: 'Daño Folclórico',
        ratings: [1],
      },
      {
        key: 'folkloric-block',
        name: 'Tabú Folclórico',
        ratings: [1],
      },
    ]

    for (const item of expected) {
      const definition =
        getCharacterAdvantageDefinition(
          item.key,
        )

      assert.ok(definition)

      assert.equal(
        definition.name,
        item.name,
      )

      assert.equal(
        definition.category,
        'flaw',
      )

      assert.deepEqual(
        definition.allowedRatings,
        item.ratings,
      )

      assert.equal(
        definition.source,
        'core',
      )

      assert.equal(
        definition.sourcePage,
        182,
      )
    }
  },
)

test(
  'Carne de Estaca es un Defecto fijo sin datos de instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'stake-bait',
      )

    assert.ok(definition)

    assert.equal(
      definition.allowMultiple,
      false,
    )

    assert.equal(
      definition.requiresInstanceDetails,
      false,
    )
  },
)

test(
  'Daño Folclórico requiere una fuente concreta',
  () => {
    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'bane-empty',
              definitionKey:
                'folkloric-bane',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBane',
                source: '   ',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      invalid.valid,
      false,
    )

    const valid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'bane-uv',
              definitionKey:
                'folkloric-bane',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBane',
                source: 'Luz ultravioleta',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      valid.valid,
      true,
    )
  },
)

test(
  'Tabú Folclórico requiere identificar el tabú concreto',
  () => {
    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'taboo-empty',
              definitionKey:
                'folkloric-block',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBlock',
                taboo: '',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      invalid.valid,
      false,
    )

    const valid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'taboo-water',
              definitionKey:
                'folkloric-block',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBlock',
                taboo:
                  'Cruzar una corriente visible de agua',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      valid.valid,
      true,
    )
  },
)

test(
  'cada Tabú Folclórico puede existir como instancia independiente',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'folkloric-block',
      )

    assert.ok(definition)

    assert.equal(
      definition.allowMultiple,
      true,
    )

    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'taboo-garlic',
              definitionKey:
                'folkloric-block',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBlock',
                taboo: 'Ajo',
              },
            },
            {
              selectionId: 'taboo-water',
              definitionKey:
                'folkloric-block',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBlock',
                taboo:
                  'Cruzar una corriente visible de agua',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'Daño Folclórico admite varias fuentes como instancias independientes',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'folkloric-bane',
      )

    assert.ok(definition)

    assert.equal(
      definition.allowMultiple,
      true,
    )

    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'bane-silver',
              definitionKey:
                'folkloric-bane',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBane',
                source: 'Plata',
              },
            },
            {
              selectionId: 'bane-holy-water',
              definitionKey:
                'folkloric-bane',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'folkloricBane',
                source: 'Agua bendita',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

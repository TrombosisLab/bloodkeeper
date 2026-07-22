import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
  getCharacterAdvantageDefinition,
  getCharacterAdvantageDefinitionsByCategory,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageDefinitions,
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

test(
  '003-H.3B.1 contiene exactamente Aliados, Contactos y Criados',
  () => {
    assert.deepEqual(
      characterAdvantageDefinitions.map(
        (definition) =>
          definition.key,
      ),
      [
        'allies',
        'contacts',
        'retainers',
      ],
    )
  },
)

test(
  'el catálogo parcial Core es estructuralmente válido',
  () => {
    const result =
      validateCharacterAdvantageDefinitions(
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'las claves del catálogo parcial Core son únicas',
  () => {
    const keys =
      characterAdvantageDefinitions.map(
        (definition) =>
          definition.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)

test(
  'las tres definiciones pertenecen a Trasfondos Core',
  () => {
    for (
      const definition of
        characterAdvantageDefinitions
    ) {
      assert.equal(
        definition.category,
        'background',
      )

      assert.equal(
        definition.source,
        'core',
      )
    }
  },
)

test(
  'Aliados usa puntuaciones totales 2 a 6',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'allies',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        2,
        3,
        4,
        5,
        6,
      ],
    )

    assert.equal(
      definition.allowMultiple,
      true,
    )

    assert.equal(
      definition.requiresInstanceDetails,
      true,
    )

    assert.equal(
      definition.instanceDetailsKind,
      'allies',
    )
  },
)

test(
  'Contactos usa puntuaciones 1 a 3',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'contacts',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
      ],
    )

    assert.equal(
      definition.allowMultiple,
      true,
    )

    assert.equal(
      definition.requiresInstanceDetails,
      true,
    )

    assert.equal(
      definition.instanceDetailsKind,
      'contact',
    )
  },
)

test(
  'Criados usa puntuaciones 1 a 3',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'retainers',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
      ],
    )

    assert.equal(
      definition.allowMultiple,
      true,
    )

    assert.equal(
      definition.requiresInstanceDetails,
      true,
    )

    assert.equal(
      definition.instanceDetailsKind,
      'retainer',
    )
  },
)

test(
  'la consulta por categoría devuelve los tres Trasfondos',
  () => {
    assert.deepEqual(
      getCharacterAdvantageDefinitionsByCategory(
        'background',
      ).map(
        (definition) =>
          definition.key,
      ),
      [
        'allies',
        'contacts',
        'retainers',
      ],
    )

    assert.deepEqual(
      getCharacterAdvantageDefinitionsByCategory(
        'merit',
      ),
      [],
    )

    assert.deepEqual(
      getCharacterAdvantageDefinitionsByCategory(
        'flaw',
      ),
      [],
    )
  },
)

test(
  'una instancia real de Aliados valida contra el catálogo Core',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'allies-example',
              definitionKey:
                'allies',
              category:
                'background',
              rating: 6,
              origin:
                'creation',
              details: {
                kind:
                  'allies',
                effectiveness: 3,
                reliability: 3,
                identity:
                  'Grupo aliado',
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
  'Contactos admite múltiples instancias independientes',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'contact-one',
              definitionKey:
                'contacts',
              category:
                'background',
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'contact',
                identity:
                  'Contacto uno',
              },
            },
            {
              selectionId:
                'contact-two',
              definitionKey:
                'contacts',
              category:
                'background',
              rating: 3,
              origin:
                'creation',
              details: {
                kind:
                  'contact',
                identity:
                  'Contacto dos',
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
  'Criados admite múltiples instancias independientes',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'retainer-one',
              definitionKey:
                'retainers',
              category:
                'background',
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'retainer',
                identity:
                  'Criado uno',
              },
            },
            {
              selectionId:
                'retainer-two',
              definitionKey:
                'retainers',
              category:
                'background',
              rating: 3,
              origin:
                'creation',
              details: {
                kind:
                  'retainer',
                identity:
                  'Criado dos',
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
  'Contactos rechaza puntuación 4',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'invalid-contact',
              definitionKey:
                'contacts',
              category:
                'background',
              rating: 4,
              origin:
                'creation',
              details: {
                kind:
                  'contact',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'Criados rechaza puntuación 4',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'invalid-retainer',
              definitionKey:
                'retainers',
              category:
                'background',
              rating: 4,
              origin:
                'creation',
              details: {
                kind:
                  'retainer',
              },
            },
          ],
        },
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

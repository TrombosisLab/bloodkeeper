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

const definitions = [
  {
    key: 'example-merit',
    name: 'Mérito de ejemplo',
    category: 'merit',
    allowedRatings: [1, 2],
    source: 'core',
    sourcePage: 100,
    allowMultiple: false,
    requiresInstanceDetails: false,
  },
  {
    key: 'example-background',
    name: 'Trasfondo de ejemplo',
    category: 'background',
    allowedRatings: [1, 2, 3, 4, 5],
    source: 'core',
    allowMultiple: true,
    requiresInstanceDetails: true,
    instanceDetailsKind: 'contact',
  },
  {
    key: 'example-flaw',
    name: 'Defecto de ejemplo',
    category: 'flaw',
    allowedRatings: [2],
    source: 'core',
    allowMultiple: false,
    requiresInstanceDetails: false,
  },
]

test(
  'el catálogo real expone las primeras definiciones Core de Trasfondos',
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

    assert.equal(
      getCharacterAdvantageDefinition(
        'missing',
      ),
      null,
    )

    assert.equal(
      getCharacterAdvantageDefinitionsByCategory(
        'background',
      ).length,
      3,
    )
  },
)

test(
  'un catálogo estructuralmente correcto es válido',
  () => {
    const result =
      validateCharacterAdvantageDefinitions(
        definitions,
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'el catálogo rechaza claves duplicadas',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        definitions[0],
        {
          ...definitions[0],
          name: 'Duplicado',
        },
      ])

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'claves únicas',
          ),
      ),
      true,
    )
  },
)

test(
  'el catálogo rechaza allowedRatings vacío',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        {
          ...definitions[0],
          allowedRatings: [],
        },
      ])

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'el catálogo rechaza puntuaciones fuera de 1 a 5',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        {
          ...definitions[0],
          allowedRatings: [
            0,
            6,
          ],
        },
      ])

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'el catálogo rechaza puntuaciones permitidas duplicadas',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        {
          ...definitions[0],
          allowedRatings: [
            1,
            1,
          ],
        },
      ])

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'una selección válida coincide con su definición',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'one',
              definitionKey:
                'example-merit',
              category: 'merit',
              rating: 2,
              origin: 'creation',
            },
          ],
        },
        definitions,
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'una selección rechaza definición inexistente',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'one',
              definitionKey: 'missing',
              category: 'merit',
              rating: 1,
              origin: 'creation',
            },
          ],
        },
        definitions,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'una selección rechaza categoría distinta de la definición',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'one',
              definitionKey:
                'example-merit',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
            },
          ],
        },
        definitions,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'una selección rechaza una puntuación no permitida',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'one',
              definitionKey:
                'example-flaw',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
            },
          ],
        },
        definitions,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'una definición no repetible rechaza múltiples instancias',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'one',
              definitionKey:
                'example-merit',
              category: 'merit',
              rating: 1,
              origin: 'creation',
            },
            {
              selectionId: 'two',
              definitionKey:
                'example-merit',
              category: 'merit',
              rating: 2,
              origin: 'creation',
            },
          ],
        },
        definitions,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'una definición repetible admite múltiples instancias independientes',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'background-one',
              definitionKey:
                'example-background',
              category: 'background',
              rating: 2,
              origin: 'creation',
              details: {
                kind: 'contact',
                identity: 'Uno',
              },
            },
            {
              selectionId:
                'background-two',
              definitionKey:
                'example-background',
              category: 'background',
              rating: 3,
              origin: 'creation',
              details: {
                kind: 'contact',
                identity: 'Dos',
              },
            },
          ],
        },
        definitions,
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

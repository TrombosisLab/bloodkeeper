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
  'el catálogo Core parcial contiene los seis Trasfondos implementados',
  () => {
    assert.deepEqual(
      characterAdvantageDefinitions
        .filter(
          (definition) =>
            definition.category ===
            'background',
        )
        .map(
          (definition) =>
            definition.key,
        ),
      [
        'allies',
        'contacts',
        'retainers',
        'status',
        'fame',
        'influence',
        'mask',
        'mawla',
        'herd',
        'resources',
        'haven',
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
        characterAdvantageDefinitions.filter(
          (definition) =>
            definition.category ===
            'background',
        )
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
  'Aliados usa puntuaciones totales 2 a 7',
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
        7,
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
        'status',
        'fame',
        'influence',
        'mask',
        'mawla',
        'herd',
        'resources',
        'haven',
      ],
    )

    assert.equal(
      getCharacterAdvantageDefinitionsByCategory(
        'merit',
      ).every(
        (definition) =>
          definition.category ===
          'merit',
      ),
      true,
    )

    assert.equal(
      getCharacterAdvantageDefinitionsByCategory(
        'flaw',
      ).every(
        (definition) =>
          definition.category ===
          'flaw',
      ),
      true,
    )

    assert.equal(
      getCharacterAdvantageDefinitionsByCategory(
        'merit',
      ).length > 0,
      true,
    )

    assert.equal(
      getCharacterAdvantageDefinitionsByCategory(
        'flaw',
      ).length > 0,
      true,
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

test(
  'Estatus usa puntuaciones 1 a 5 y ámbito por instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'status',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
        4,
        5,
      ],
    )

    assert.equal(
      definition.category,
      'background',
    )

    assert.equal(
      definition.source,
      'core',
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
      'status',
    )
  },
)

test(
  'Fama usa puntuaciones 1 a 5 y ámbito por instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'fame',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
        4,
        5,
      ],
    )

    assert.equal(
      definition.category,
      'background',
    )

    assert.equal(
      definition.source,
      'core',
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
      'fame',
    )
  },
)

test(
  'Influencia usa puntuaciones 1 a 5 y ámbito por instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'influence',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
        4,
        5,
      ],
    )

    assert.equal(
      definition.category,
      'background',
    )

    assert.equal(
      definition.source,
      'core',
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
      'influence',
    )
  },
)

test(
  'Estatus valida una instancia con ámbito vampírico',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'status-camarilla',
              definitionKey:
                'status',
              category:
                'background',
              rating: 3,
              origin:
                'creation',
              details: {
                kind:
                  'status',
                sphere:
                  'Camarilla',
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
  'Fama valida una instancia con ámbito concreto',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'fame-music',
              definitionKey:
                'fame',
              category:
                'background',
              rating: 4,
              origin:
                'creation',
              details: {
                kind:
                  'fame',
                sphere:
                  'Escena musical',
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
  'Influencia valida una instancia con ámbito mortal',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'influence-politics',
              definitionKey:
                'influence',
              category:
                'background',
              rating: 5,
              origin:
                'creation',
              details: {
                kind:
                  'influence',
                sphere:
                  'Política municipal',
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
  'Estatus rechaza puntuación 6',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'invalid-status',
              definitionKey:
                'status',
              category:
                'background',
              rating: 6,
              origin:
                'creation',
              details: {
                kind:
                  'status',
                sphere:
                  'Camarilla',
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
  'Fama rechaza puntuación 6',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'invalid-fame',
              definitionKey:
                'fame',
              category:
                'background',
              rating: 6,
              origin:
                'creation',
              details: {
                kind:
                  'fame',
                sphere:
                  'Medios',
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
  'Influencia rechaza puntuación 6',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'invalid-influence',
              definitionKey:
                'influence',
              category:
                'background',
              rating: 6,
              origin:
                'creation',
              details: {
                kind:
                  'influence',
                sphere:
                  'Política',
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
  'Estatus puede mantener instancias independientes por ámbito',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'status-one',
              definitionKey:
                'status',
              category:
                'background',
              rating: 2,
              origin:
                'creation',
              details: {
                kind:
                  'status',
                sphere:
                  'Camarilla',
              },
            },
            {
              selectionId:
                'status-two',
              definitionKey:
                'status',
              category:
                'background',
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'status',
                sphere:
                  'Otro ámbito',
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
  'Máscara usa puntuaciones 1 a 2 y una identidad por instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'mask',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
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
      'mask',
    )
  },
)

test(
  'Mawla usa puntuaciones 1 a 5 y datos por instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'mawla',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
        4,
        5,
      ],
    )

    assert.equal(
      definition.allowMultiple,
      true,
    )

    assert.equal(
      definition.instanceDetailsKind,
      'mawla',
    )
  },
)

test(
  'Rebaño usa puntuaciones 1 a 5 y datos por instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'herd',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
        4,
        5,
      ],
    )

    assert.equal(
      definition.allowMultiple,
      true,
    )

    assert.equal(
      definition.instanceDetailsKind,
      'herd',
    )
  },
)

test(
  'Recursos usa puntuaciones 1 a 5 y datos por instancia',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'resources',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [
        1,
        2,
        3,
        4,
        5,
      ],
    )

    assert.equal(
      definition.allowMultiple,
      true,
    )

    assert.equal(
      definition.instanceDetailsKind,
      'resources',
    )
  },
)

test(
  'Máscara valida una identidad falsa concreta',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'mask-one',
              definitionKey:
                'mask',
              category:
                'background',
              rating: 2,
              origin:
                'creation',
              details: {
                kind:
                  'mask',
                identity:
                  'Identidad alternativa',
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
  'Máscara admite múltiples identidades independientes',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'mask-one',
              definitionKey:
                'mask',
              category:
                'background',
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'mask',
                identity:
                  'Identidad uno',
              },
            },
            {
              selectionId:
                'mask-two',
              definitionKey:
                'mask',
              category:
                'background',
              rating: 2,
              origin:
                'creation',
              details: {
                kind:
                  'mask',
                identity:
                  'Identidad dos',
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
  'Mawla valida una instancia concreta',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'mawla-one',
              definitionKey:
                'mawla',
              category:
                'background',
              rating: 4,
              origin:
                'creation',
              details: {
                kind:
                  'mawla',
                identity:
                  'Mawla de ejemplo',
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
  'Rebaño valida un grupo concreto',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'herd-one',
              definitionKey:
                'herd',
              category:
                'background',
              rating: 3,
              origin:
                'creation',
              details: {
                kind:
                  'herd',
                identity:
                  'Grupo de ejemplo',
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
  'Recursos valida una fuente patrimonial concreta',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'resources-one',
              definitionKey:
                'resources',
              category:
                'background',
              rating: 5,
              origin:
                'creation',
              details: {
                kind:
                  'resources',
                source:
                  'Patrimonio de ejemplo',
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
  'Máscara rechaza puntuación 3',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'invalid-mask',
              definitionKey:
                'mask',
              category:
                'background',
              rating: 3,
              origin:
                'creation',
              details: {
                kind:
                  'mask',
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
  'Mawla rechaza puntuación 6',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'invalid-mawla',
              definitionKey:
                'mawla',
              category:
                'background',
              rating: 6,
              origin:
                'creation',
              details: {
                kind:
                  'mawla',
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
  'Rebaño y Recursos rechazan puntuaciones superiores a 5',
  () => {
    for (
      const [
        definitionKey,
        details,
      ] of [
        [
          'herd',
          {
            kind: 'herd',
          },
        ],
        [
          'resources',
          {
            kind: 'resources',
          },
        ],
      ]
    ) {
      const result =
        validateCharacterAdvantageSelectionsAgainstDefinitions(
          {
            selections: [
              {
                selectionId:
                  `invalid-${definitionKey}`,
                definitionKey,
                category:
                  'background',
                rating: 6,
                origin:
                  'creation',
                details,
              },
            ],
          },
          characterAdvantageDefinitions,
        )

      assert.equal(
        result.valid,
        false,
      )
    }
  },
)

test(
  'Refugio base usa exclusivamente puntuaciones 1 a 3',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'haven',
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
      definition.category,
      'background',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      192,
    )
  },
)

test(
  'Refugio admite múltiples instancias independientes',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'haven',
      )

    assert.ok(definition)

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
      'haven',
    )
  },
)

test(
  'una instancia de Refugio 1 es válida',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'haven-small',
              definitionKey:
                'haven',
              category:
                'background',
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'haven',
                identity:
                  'Refugio pequeño',
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
  'una instancia de Refugio 3 es válida',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'haven-large',
              definitionKey:
                'haven',
              category:
                'background',
              rating: 3,
              origin:
                'creation',
              details: {
                kind:
                  'haven',
                identity:
                  'Refugio principal',
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
  'Refugio base rechaza puntuación 4',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'haven-invalid',
              definitionKey:
                'haven',
              category:
                'background',
              rating: 4,
              origin:
                'creation',
              details: {
                kind:
                  'haven',
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
  'dos Refugios pueden conservar identidades independientes',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'haven-one',
              definitionKey:
                'haven',
              category:
                'background',
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'haven',
                identity:
                  'Refugio uno',
              },
            },
            {
              selectionId:
                'haven-two',
              definitionKey:
                'haven',
              category:
                'background',
              rating: 2,
              origin:
                'creation',
              details: {
                kind:
                  'haven',
                identity:
                  'Refugio dos',
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

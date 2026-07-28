import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageDefinitions,
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

const meritKeys = [
  'haven-hidden-armory',
  'haven-library',
  'haven-cell',
  'haven-laboratory',
  'haven-location',
  'haven-luxury',
  'haven-protection',
  'haven-backdoor',
  'haven-operating-room',
  'haven-security-system',
  'haven-watchmen',
]

const flawKeys = [
  'haven-compromised',
  'haven-creepy',
  'haven-haunted',
]

function haven(
  rating,
  selectionId = 'haven-one',
) {
  return {
    selectionId,
    definitionKey: 'haven',
    category: 'background',
    rating,
    origin: 'creation',
    details: {
      kind: 'haven',
      identity: 'Refugio de prueba',
    },
  }
}

function child(
  definitionKey,
  rating,
  parentSelectionId = 'haven-one',
) {
  const definition =
    getCharacterAdvantageDefinition(
      definitionKey,
    )

  assert.ok(definition)

  return {
    selectionId:
      `${definitionKey}-selection`,
    definitionKey,
    category:
      definition.category,
    rating,
    origin: 'creation',
    parentSelectionId,
  }
}

test(
  'el catálogo completo sigue siendo estructuralmente válido',
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
  'el catálogo contiene 11 Méritos Core de Refugio',
  () => {
    assert.equal(
      meritKeys.length,
      11,
    )

    for (const key of meritKeys) {
      const definition =
        getCharacterAdvantageDefinition(
          key,
        )

      assert.ok(definition)

      assert.equal(
        definition.category,
        'merit',
      )

      assert.equal(
        definition.source,
        'core',
      )
    }
  },
)

test(
  'el catálogo contiene 3 Defectos Core asociados a Refugio',
  () => {
    assert.equal(
      flawKeys.length,
      3,
    )

    for (const key of flawKeys) {
      const definition =
        getCharacterAdvantageDefinition(
          key,
        )

      assert.ok(definition)

      assert.equal(
        definition.category,
        'flaw',
      )

      assert.equal(
        definition.source,
        'core',
      )
    }
  },
)

test(
  'todos los Méritos Core de Refugio requieren una instancia padre haven',
  () => {
    for (const key of meritKeys) {
      const definition =
        getCharacterAdvantageDefinition(
          key,
        )

      assert.ok(definition)

      assert.equal(
        definition.requiresParentSelection,
        true,
      )

      assert.deepEqual(
        definition.allowedParentDefinitionKeys,
        ['haven'],
      )
    }
  },
)

test(
  'Comprometido tiene exactamente 2 puntos',
  () => {
    assert.deepEqual(
      getCharacterAdvantageDefinition(
        'haven-compromised',
      )?.allowedRatings,
      [2],
    )
  },
)

test(
  'Espeluznante tiene exactamente 1 punto',
  () => {
    assert.deepEqual(
      getCharacterAdvantageDefinition(
        'haven-creepy',
      )?.allowedRatings,
      [1],
    )
  },
)

test(
  'Embrujado usa un único punto',
  () => {
    assert.deepEqual(
      getCharacterAdvantageDefinition(
        'haven-haunted',
      )?.allowedRatings,
      [1],
    )
  },
)

test(
  'un Defecto de Refugio puede existir sin puntos en Refugio',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'creepy-standalone',
              definitionKey:
                'haven-creepy',
              category:
                'flaw',
              rating: 1,
              origin:
                'creation',
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
  'un Defecto de Refugio puede vincularse a un Refugio concreto',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            haven(1),
            child(
              'haven-compromised',
              2,
            ),
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
  'un Defecto de Refugio rechaza un padre que no sea haven',
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
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'resources',
              },
            },
            child(
              'haven-creepy',
              1,
              'resources-one',
            ),
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
  'Biblioteca queda limitada a 1 punto con Refugio 1',
  () => {
    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            haven(1),
            child(
              'haven-library',
              2,
            ),
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
            haven(1),
            child(
              'haven-library',
              1,
            ),
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
  'Biblioteca puede superar 1 punto con un Refugio mayor',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            haven(2),
            child(
              'haven-library',
              3,
            ),
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
  'Celda requiere Refugio padre',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            haven(1),
            child(
              'haven-cell',
              1,
            ),
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
  'Laboratorio requiere Refugio padre',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            haven(1),
            child(
              'haven-laboratory',
              1,
            ),
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
  'Quirófano requiere Refugio padre',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            haven(1),
            child(
              'haven-operating-room',
              1,
            ),
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
  'Localización, Lujo y Quirófano son opciones de 1 punto',
  () => {
    for (
      const key of [
        'haven-location',
        'haven-luxury',
        'haven-operating-room',
      ]
    ) {
      assert.deepEqual(
        getCharacterAdvantageDefinition(
          key,
        )?.allowedRatings,
        [1],
      )
    }
  },
)

test(
  'los Méritos escalables Core de Refugio aceptan puntuaciones 1 a 5',
  () => {
    for (
      const key of [
        'haven-hidden-armory',
        'haven-library',
        'haven-cell',
        'haven-laboratory',
        'haven-protection',
        'haven-backdoor',
        'haven-security-system',
        'haven-watchmen',
      ]
    ) {
      assert.deepEqual(
        getCharacterAdvantageDefinition(
          key,
        )?.allowedRatings,
        [1, 2, 3, 4, 5],
      )
    }
  },
)

test(
  'un Mérito de Refugio no puede existir sin padre',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'security-no-haven',
              definitionKey:
                'haven-security-system',
              category:
                'merit',
              rating: 1,
              origin:
                'creation',
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
  'un Mérito de Refugio rechaza un padre no permitido',
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
              rating: 1,
              origin:
                'creation',
              details: {
                kind:
                  'resources',
              },
            },
            child(
              'haven-security-system',
              1,
              'resources-one',
            ),
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
  'Méritos de dos Refugios distintos conservan relaciones independientes',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            haven(
              1,
              'haven-one',
            ),
            haven(
              3,
              'haven-two',
            ),
            {
              ...child(
                'haven-library',
                1,
                'haven-one',
              ),
              selectionId:
                'library-one',
            },
            {
              ...child(
                'haven-library',
                4,
                'haven-two',
              ),
              selectionId:
                'library-two',
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

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterAdvantageDefinitions,
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

const definitions = [
  {
    key: 'allies',
    name: 'Aliados',
    category: 'background',
    allowedRatings: [
      2,
      3,
      4,
      5,
      6,
    ],
    source: 'core',
    allowMultiple: true,
    requiresInstanceDetails: true,
    instanceDetailsKind: 'allies',
  },
  {
    key: 'haven',
    name: 'Refugio',
    category: 'background',
    allowedRatings: [
      1,
      2,
      3,
    ],
    source: 'core',
    allowMultiple: true,
    requiresInstanceDetails: true,
    instanceDetailsKind: 'haven',
  },
  {
    key: 'haven-security',
    name: 'Seguridad de Refugio',
    category: 'merit',
    allowedRatings: [
      1,
      2,
    ],
    source: 'core',
    allowMultiple: true,
    requiresInstanceDetails: false,
    requiresParentSelection: true,
    allowedParentDefinitionKeys: [
      'haven',
    ],
  },
]

test(
  'el contrato admite una definición con rating 6 para un Trasfondo compuesto',
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
  'Aliados conserva Efectividad y Fiabilidad como componentes tipados',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'allies-one',
              definitionKey: 'allies',
              category: 'background',
              rating: 5,
              origin: 'creation',
              details: {
                kind: 'allies',
                effectiveness: 3,
                reliability: 2,
                identity: 'Grupo aliado',
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

test(
  'Aliados exige que rating coincida con Efectividad más Fiabilidad',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'allies-one',
              definitionKey: 'allies',
              category: 'background',
              rating: 4,
              origin: 'creation',
              details: {
                kind: 'allies',
                effectiveness: 3,
                reliability: 2,
              },
            },
          ],
        },
        definitions,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Efectividad + Fiabilidad',
          ),
      ),
      true,
    )
  },
)

test(
  'Aliados valida los límites internos de sus componentes',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'allies-one',
              definitionKey: 'allies',
              category: 'background',
              rating: 6,
              origin: 'creation',
              details: {
                kind: 'allies',
                effectiveness: 5,
                reliability: 1,
              },
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
  'una definición que requiere detalles rechaza una instancia sin ellos',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'haven-one',
              definitionKey: 'haven',
              category: 'background',
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
  'el tipo de detalles debe coincidir con la definición',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'haven-one',
              definitionKey: 'haven',
              category: 'background',
              rating: 2,
              origin: 'creation',
              details: {
                kind: 'contact',
                identity: 'Incorrecto',
              },
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
  'un Mérito asociado puede vincularse a una instancia concreta de Refugio',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'haven-one',
              definitionKey: 'haven',
              category: 'background',
              rating: 2,
              origin: 'creation',
              details: {
                kind: 'haven',
                identity: 'Refugio principal',
              },
            },
            {
              selectionId:
                'haven-security-one',
              definitionKey:
                'haven-security',
              category: 'merit',
              rating: 1,
              origin: 'creation',
              parentSelectionId:
                'haven-one',
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
  'una selección asociada exige padre cuando la definición lo requiere',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'haven-security-one',
              definitionKey:
                'haven-security',
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
  'una selección asociada rechaza un padre inexistente',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId:
                'haven-security-one',
              definitionKey:
                'haven-security',
              category: 'merit',
              rating: 1,
              origin: 'creation',
              parentSelectionId:
                'missing-haven',
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
  'una selección no puede ser su propio padre',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'self',
              definitionKey:
                'haven-security',
              category: 'merit',
              rating: 1,
              origin: 'creation',
              parentSelectionId: 'self',
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
  'una selección asociada rechaza un tipo de padre no permitido',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'allies-one',
              definitionKey: 'allies',
              category: 'background',
              rating: 3,
              origin: 'creation',
              details: {
                kind: 'allies',
                effectiveness: 2,
                reliability: 1,
              },
            },
            {
              selectionId:
                'haven-security-one',
              definitionKey:
                'haven-security',
              category: 'merit',
              rating: 1,
              origin: 'creation',
              parentSelectionId:
                'allies-one',
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
  'el catálogo rechaza requiresInstanceDetails sin tipo declarado',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        {
          key: 'broken',
          name: 'Broken',
          category: 'background',
          allowedRatings: [1],
          source: 'core',
          allowMultiple: true,
          requiresInstanceDetails: true,
        },
      ])

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'el catálogo rechaza padres permitidos inexistentes',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        {
          key: 'child',
          name: 'Child',
          category: 'merit',
          allowedRatings: [1],
          source: 'core',
          allowMultiple: true,
          requiresInstanceDetails: false,
          requiresParentSelection: true,
          allowedParentDefinitionKeys: [
            'missing-parent',
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
  'Aliados admite Fiabilidad 3 cuando el total no supera 6',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'allies-reliable',
              definitionKey: 'allies',
              category: 'background',
              rating: 6,
              origin: 'creation',
              details: {
                kind: 'allies',
                effectiveness: 3,
                reliability: 3,
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

test(
  'Aliados rechaza una combinación superior al máximo total de 6',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'allies-too-high',
              definitionKey: 'allies',
              category: 'background',
              rating: 7,
              origin: 'creation',
              details: {
                kind: 'allies',
                effectiveness: 4,
                reliability: 3,
              },
            },
          ],
        },
        [
          {
            ...definitions[0],
            allowedRatings: [
              2,
              3,
              4,
              5,
              6,
              7,
            ],
          },
        ],
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'no puede superar 6',
          ),
      ),
      true,
    )
  },
)

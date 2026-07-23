import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

test(
  'Consumo de Sustancias Core registra sus tres definiciones normativas',
  () => {
    const hopeless =
      getCharacterAdvantageDefinition(
        'hopeless-addiction',
      )

    const addiction =
      getCharacterAdvantageDefinition(
        'addiction',
      )

    const functional =
      getCharacterAdvantageDefinition(
        'functional-addict',
      )

    assert.ok(hopeless)
    assert.ok(addiction)
    assert.ok(functional)

    assert.deepEqual(
      {
        name: hopeless.name,
        category: hopeless.category,
        ratings: hopeless.allowedRatings,
      },
      {
        name: 'Caso Perdido de Adicción',
        category: 'flaw',
        ratings: [2],
      },
    )

    assert.deepEqual(
      {
        name: addiction.name,
        category: addiction.category,
        ratings: addiction.allowedRatings,
      },
      {
        name: 'Adicción',
        category: 'flaw',
        ratings: [1],
      },
    )

    assert.deepEqual(
      {
        name: functional.name,
        category: functional.category,
        ratings: functional.allowedRatings,
      },
      {
        name: 'Adicto Funcional',
        category: 'merit',
        ratings: [1],
      },
    )
  },
)

test(
  'las tres opciones de Consumo de Sustancias requieren datos tipados de instancia',
  () => {
    for (
      const key of [
        'hopeless-addiction',
        'addiction',
        'functional-addict',
      ]
    ) {
      const definition =
        getCharacterAdvantageDefinition(key)

      assert.ok(definition)

      assert.equal(
        definition.requiresInstanceDetails,
        true,
      )

      assert.equal(
        definition.instanceDetailsKind,
        'substanceUse',
      )
    }
  },
)

test(
  'una Adicción válida requiere identificar la sustancia',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'addiction-1',
              definitionKey: 'addiction',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'substanceUse',
                substance: 'Alcohol',
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

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'Consumo de Sustancias rechaza una sustancia vacía',
  () => {
    const result =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'addiction-empty',
              definitionKey: 'addiction',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'substanceUse',
                substance: '   ',
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

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'debe especificar una sustancia',
          ),
      ),
    )
  },
)

test(
  'Adicto Funcional requiere sustancia y categoría de reserva',
  () => {
    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'functional-invalid',
              definitionKey: 'functional-addict',
              category: 'merit',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'substanceUse',
                substance: 'Cocaína',
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

    assert.ok(
      invalid.errors.some(
        (error) =>
          error.includes(
            'debe especificar una categoría de reserva',
          ),
      ),
    )

    const valid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'functional-valid',
              definitionKey: 'functional-addict',
              category: 'merit',
              rating: 1,
              origin: 'creation',
              details: {
                kind: 'substanceUse',
                substance: 'Cocaína',
                poolCategory: 'Social',
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

    assert.deepEqual(
      valid.errors,
      [],
    )
  },
)

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterAdvantageDefinitions,
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

const definition = {
  key: 'origin-rating-test',
  name: 'Prueba de Origen',
  category: 'flaw',
  allowedRatings: [1],
  source: 'core',
  allowMultiple: false,
  requiresInstanceDetails: false,
  originRatingConstraints: [
    {
      origin: 'predatorType',
      allowedRatings: [2],
    },
  ],
}

test(
  'la adquisición ordinaria usa allowedRatings',
  () => {
    const valid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'normal-1',
              definitionKey:
                'origin-rating-test',
              category: 'flaw',
              rating: 1,
              origin: 'creation',
            },
          ],
        },
        [definition],
      )

    assert.equal(valid.valid, true)

    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'normal-2',
              definitionKey:
                'origin-rating-test',
              category: 'flaw',
              rating: 2,
              origin: 'creation',
            },
          ],
        },
        [definition],
      )

    assert.equal(invalid.valid, false)
  },
)

test(
  'un origen específico puede usar una puntuación diferente',
  () => {
    const valid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'predator-2',
              definitionKey:
                'origin-rating-test',
              category: 'flaw',
              rating: 2,
              origin: 'predatorType',
            },
          ],
        },
        [definition],
      )

    assert.equal(valid.valid, true)

    const invalid =
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        {
          selections: [
            {
              selectionId: 'predator-1',
              definitionKey:
                'origin-rating-test',
              category: 'flaw',
              rating: 1,
              origin: 'predatorType',
            },
          ],
        },
        [definition],
      )

    assert.equal(invalid.valid, false)
  },
)

test(
  'una definición rechaza dos restricciones para el mismo origen',
  () => {
    const result =
      validateCharacterAdvantageDefinitions([
        {
          ...definition,
          originRatingConstraints: [
            {
              origin: 'predatorType',
              allowedRatings: [1],
            },
            {
              origin: 'predatorType',
              allowedRatings: [2],
            },
          ],
        },
      ])

    assert.equal(result.valid, false)

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'restricciones de puntuación duplicadas',
          ),
      ),
    )
  },
)

test(
  'una restricción de origen debe contener puntuaciones válidas',
  () => {
    const empty =
      validateCharacterAdvantageDefinitions([
        {
          ...definition,
          originRatingConstraints: [
            {
              origin: 'predatorType',
              allowedRatings: [],
            },
          ],
        },
      ])

    assert.equal(empty.valid, false)

    const invalid =
      validateCharacterAdvantageDefinitions([
        {
          ...definition,
          originRatingConstraints: [
            {
              origin: 'predatorType',
              allowedRatings: [0],
            },
          ],
        },
      ])

    assert.equal(invalid.valid, false)
  },
)

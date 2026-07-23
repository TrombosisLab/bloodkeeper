import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCharacterLoresheetSelections,
} from '../src/features/character-creation/domain/loresheet-selection-rules.ts'

const loresheet = {
  key: 'test-loresheet',
  name: 'Ficha de prueba',
  source: 'core',
  benefits: [
    {
      key: 'benefit-1',
      name: 'Ventaja I',
      level: 1,
    },
    {
      key: 'benefit-2',
      name: 'Ventaja II',
      level: 2,
    },
    {
      key: 'benefit-3',
      name: 'Ventaja III',
      level: 3,
    },
    {
      key: 'benefit-4',
      name: 'Ventaja IV',
      level: 4,
    },
    {
      key: 'benefit-5',
      name: 'Ventaja V',
      level: 5,
    },
  ],
}

function createSelection({
  selectionId = 'selection-1',
  loresheetKey = 'test-loresheet',
  benefitKey = 'benefit-3',
  rating = 3,
} = {}) {
  return {
    selectionId,
    definitionKey:
      'loresheet-benefit',
    category: 'merit',
    rating,
    origin: 'creation',
    details: {
      kind: 'loresheet',
      loresheetKey,
      benefitKey,
    },
  }
}

test(
  'una ventaja válida de Ficha de Conocimientos pasa la validación',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection(),
        ],
        [
          loresheet,
        ],
      )

    assert.equal(result.valid, true)
    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'rechaza una Ficha de Conocimientos inexistente',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            loresheetKey: 'missing',
          }),
        ],
        [
          loresheet,
        ],
      )

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'Ficha de Conocimientos inexistente',
          ),
      ),
    )
  },
)

test(
  'rechaza una ventaja que no pertenece a la ficha indicada',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            benefitKey: 'missing-benefit',
          }),
        ],
        [
          loresheet,
        ],
      )

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'ventaja inexistente',
          ),
      ),
    )
  },
)

test(
  'la puntuación debe coincidir con el nivel de la ventaja',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            benefitKey: 'benefit-4',
            rating: 3,
          }),
        ],
        [
          loresheet,
        ],
      )

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'debe coincidir con el nivel 4',
          ),
      ),
    )
  },
)

test(
  'rechaza seleccionar dos veces la misma ventaja de la misma ficha',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId: 'first',
          }),
          createSelection({
            selectionId: 'second',
          }),
        ],
        [
          loresheet,
        ],
      )

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'está seleccionada más de una vez',
          ),
      ),
    )
  },
)

test(
  'permite seleccionar ventajas distintas de la misma ficha',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId: 'first',
            benefitKey: 'benefit-1',
            rating: 1,
          }),
          createSelection({
            selectionId: 'second',
            benefitKey: 'benefit-5',
            rating: 5,
          }),
        ],
        [
          loresheet,
        ],
      )

    assert.equal(result.valid, true)
    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'ignora selecciones que no pertenecen a Fichas de Conocimientos',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          {
            selectionId:
              'background-1',
            definitionKey:
              'resources',
            category:
              'background',
            rating: 2,
            origin: 'creation',
            details: {
              kind: 'resources',
              identity:
                'Ingresos regulares',
            },
          },
        ],
        [],
      )

    assert.equal(result.valid, true)
    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'la misma clave de ventaja en fichas distintas se trata como selección independiente',
  () => {
    const secondLoresheet = {
      ...loresheet,
      key: 'second-loresheet',
    }

    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId: 'first',
          }),
          createSelection({
            selectionId: 'second',
            loresheetKey:
              'second-loresheet',
          }),
        ],
        [
          loresheet,
          secondLoresheet,
        ],
      )

    assert.equal(result.valid, true)
    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

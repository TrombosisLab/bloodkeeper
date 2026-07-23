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
  'la misma clave de ventaja puede existir en definiciones de Fichas distintas',
  () => {
    const secondLoresheet = {
      ...loresheet,
      key: 'second-loresheet',
    }

    const firstResult =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId: 'first',
            loresheetKey:
              'test-loresheet',
          }),
        ],
        [
          loresheet,
          secondLoresheet,
        ],
      )

    const secondResult =
      validateCharacterLoresheetSelections(
        [
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

    assert.equal(
      firstResult.valid,
      true,
    )

    assert.equal(
      secondResult.valid,
      true,
    )

    assert.deepEqual(
      firstResult.errors,
      [],
    )

    assert.deepEqual(
      secondResult.errors,
      [],
    )
  },
)

test(
  'permite adquirir varias Ventajas independientes de la misma Ficha de Conocimientos',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId:
              'level-one',
            benefitKey:
              'benefit-1',
            rating: 1,
          }),
          createSelection({
            selectionId:
              'level-three',
            benefitKey:
              'benefit-3',
            rating: 3,
          }),
          createSelection({
            selectionId:
              'level-five',
            benefitKey:
              'benefit-5',
            rating: 5,
          }),
        ],
        [
          loresheet,
        ],
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
  'una Ventaja de nivel alto no exige seleccionar los niveles inferiores',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId:
              'only-level-five',
            benefitKey:
              'benefit-5',
            rating: 5,
          }),
        ],
        [
          loresheet,
        ],
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
  'rechaza adquirir Ventajas de dos Fichas de Conocimientos distintas',
  () => {
    const secondLoresheet = {
      ...loresheet,
      key:
        'second-loresheet',
      benefits:
        loresheet.benefits.map(
          (benefit) => ({
            ...benefit,
            key:
              `second-${benefit.key}`,
          }),
        ),
    }

    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId:
              'first-sheet-benefit',
            loresheetKey:
              'test-loresheet',
            benefitKey:
              'benefit-1',
            rating: 1,
          }),
          createSelection({
            selectionId:
              'second-sheet-benefit',
            loresheetKey:
              'second-loresheet',
            benefitKey:
              'second-benefit-2',
            rating: 2,
          }),
        ],
        [
          loresheet,
          secondLoresheet,
        ],
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'una única Ficha de Conocimientos',
          ),
      ),
    )
  },
)

test(
  'la restricción de una sola ficha ignora Ventajas que no son Loresheet',
  () => {
    const result =
      validateCharacterLoresheetSelections(
        [
          createSelection({
            selectionId:
              'loresheet-benefit',
            benefitKey:
              'benefit-2',
            rating: 2,
          }),
          {
            selectionId:
              'resources-one',
            definitionKey:
              'resources',
            category:
              'background',
            rating: 3,
            origin:
              'creation',
            details: {
              kind:
                'resources',
              source:
                'Trabajo e inversiones',
            },
          },
        ],
        [
          loresheet,
        ],
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

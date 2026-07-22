import assert from 'node:assert/strict'
import test from 'node:test'

import {
  INITIAL_ADVANTAGE_POINTS,
  INITIAL_FLAW_POINTS,
  createEmptyCharacterAdvantages,
  getCharacterAdvantagesBudget,
  validateCharacterAdvantagesStructure,
  validateInitialCharacterAdvantagesBudget,
} from '../src/features/character-creation/domain/advantage-rules.ts'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

test(
  'CharacterDraft inicial contiene Ventajas vacías',
  () => {
    assert.deepEqual(
      initialCharacterDraft.advantages,
      {
        selections: [],
      },
    )
  },
)

test(
  'el estado vacío de Ventajas es estable',
  () => {
    assert.deepEqual(
      createEmptyCharacterAdvantages(),
      {
        selections: [],
      },
    )
  },
)

test(
  'los presupuestos iniciales son 7 puntos de Ventajas y 2 de Defectos',
  () => {
    assert.equal(
      INITIAL_ADVANTAGE_POINTS,
      7,
    )

    assert.equal(
      INITIAL_FLAW_POINTS,
      2,
    )
  },
)

test(
  'Méritos y Trasfondos normales comparten el presupuesto de 7 puntos',
  () => {
    assert.deepEqual(
      getCharacterAdvantagesBudget({
        selections: [
          {
            selectionId: 'a',
            definitionKey: 'merit-a',
            category: 'merit',
            rating: 3,
            origin: 'creation',
          },
          {
            selectionId: 'b',
            definitionKey: 'background-b',
            category: 'background',
            rating: 4,
            origin: 'creation',
          },
        ],
      }),
      {
        advantagePoints: 7,
        flawPoints: 0,
      },
    )
  },
)

test(
  'los Defectos normales se contabilizan separadamente',
  () => {
    assert.deepEqual(
      getCharacterAdvantagesBudget({
        selections: [
          {
            selectionId: 'f',
            definitionKey: 'flaw-a',
            category: 'flaw',
            rating: 2,
            origin: 'creation',
          },
        ],
      }),
      {
        advantagePoints: 0,
        flawPoints: 2,
      },
    )
  },
)

test(
  'las concesiones del Tipo de Depredador no consumen el presupuesto normal',
  () => {
    assert.deepEqual(
      getCharacterAdvantagesBudget({
        selections: [
          {
            selectionId: 'predator-merit',
            definitionKey: 'predator-merit',
            category: 'merit',
            rating: 3,
            origin: 'predatorType',
          },
          {
            selectionId: 'predator-flaw',
            definitionKey: 'predator-flaw',
            category: 'flaw',
            rating: 2,
            origin: 'predatorType',
          },
        ],
      }),
      {
        advantagePoints: 0,
        flawPoints: 0,
      },
    )
  },
)

test(
  'Méritos y Defectos de Sangre Débil no alteran el presupuesto normal',
  () => {
    assert.deepEqual(
      getCharacterAdvantagesBudget({
        selections: [
          {
            selectionId: 'tb-merit',
            definitionKey: 'thin-blood-merit',
            category: 'merit',
            rating: 1,
            origin: 'thinBlood',
          },
          {
            selectionId: 'tb-flaw',
            definitionKey: 'thin-blood-flaw',
            category: 'flaw',
            rating: 1,
            origin: 'thinBlood',
          },
        ],
      }),
      {
        advantagePoints: 0,
        flawPoints: 0,
      },
    )
  },
)

test(
  'una distribución normal 7 más 2 es válida',
  () => {
    const result =
      validateInitialCharacterAdvantagesBudget({
        selections: [
          {
            selectionId: 'merit',
            definitionKey: 'merit-a',
            category: 'merit',
            rating: 3,
            origin: 'creation',
          },
          {
            selectionId: 'background',
            definitionKey: 'background-a',
            category: 'background',
            rating: 4,
            origin: 'creation',
          },
          {
            selectionId: 'flaw',
            definitionKey: 'flaw-a',
            category: 'flaw',
            rating: 2,
            origin: 'creation',
          },
        ],
      })

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'el presupuesto normal rechaza una distribución distinta de 7 más 2',
  () => {
    const result =
      validateInitialCharacterAdvantagesBudget({
        selections: [
          {
            selectionId: 'merit',
            definitionKey: 'merit-a',
            category: 'merit',
            rating: 3,
            origin: 'creation',
          },
          {
            selectionId: 'flaw',
            definitionKey: 'flaw-a',
            category: 'flaw',
            rating: 1,
            origin: 'creation',
          },
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.length >= 2,
      true,
    )
  },
)

test(
  'la validación estructural rechaza ids duplicados y puntuaciones inválidas',
  () => {
    const result =
      validateCharacterAdvantagesStructure({
        selections: [
          {
            selectionId: 'same',
            definitionKey: 'merit-a',
            category: 'merit',
            rating: 0,
            origin: 'creation',
          },
          {
            selectionId: 'same',
            definitionKey: 'background-a',
            category: 'background',
            rating: 6,
            origin: 'creation',
          },
        ],
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'identificadores únicos',
          ),
      ),
      true,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'entero entre 1 y 5',
          ),
      ),
      true,
    )
  },
)

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterLoresheetDefinition,
  validateCharacterLoresheetDefinitions,
} from '../src/features/character-creation/domain/loresheet-definition-rules.ts'

const validLoresheet = {
  key: 'test-loresheet',
  name: 'Ficha de prueba',
  source: 'core',
  benefits: [
    {
      key: 'test-loresheet-1',
      name: 'Ventaja I',
      level: 1,
    },
    {
      key: 'test-loresheet-2',
      name: 'Ventaja II',
      level: 2,
    },
    {
      key: 'test-loresheet-3',
      name: 'Ventaja III',
      level: 3,
    },
    {
      key: 'test-loresheet-4',
      name: 'Ventaja IV',
      level: 4,
    },
    {
      key: 'test-loresheet-5',
      name: 'Ventaja V',
      level: 5,
    },
  ],
}

test(
  'una Ficha de Conocimientos con niveles 1 a 5 es estructuralmente válida',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        validLoresheet,
      ])

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  'una Ficha de Conocimientos debe contener exactamente cinco ventajas',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        {
          ...validLoresheet,
          benefits:
            validLoresheet.benefits.slice(
              0,
              4,
            ),
        },
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'exactamente cinco ventajas',
          ),
      ),
    )
  },
)

test(
  'una Ficha de Conocimientos no puede repetir niveles',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        {
          ...validLoresheet,
          benefits: [
            ...validLoresheet.benefits.slice(
              0,
              4,
            ),
            {
              key: 'duplicate-level',
              name: 'Nivel duplicado',
              level: 4,
            },
          ],
        },
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'repite el nivel 4',
          ),
      ),
    )
  },
)

test(
  'una Ficha de Conocimientos debe cubrir todos los niveles 1 a 5',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        {
          ...validLoresheet,
          benefits: [
            ...validLoresheet.benefits.slice(
              0,
              4,
            ),
            {
              key: 'second-level-four',
              name: 'Otro nivel cuatro',
              level: 4,
            },
          ],
        },
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'no contiene una ventaja de nivel 5',
          ),
      ),
    )
  },
)

test(
  'rechaza claves duplicadas de Fichas de Conocimientos',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        validLoresheet,
        {
          ...validLoresheet,
        },
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'Ficha de Conocimientos duplicada',
          ),
      ),
    )
  },
)

test(
  'rechaza claves de ventaja duplicadas dentro de la misma ficha',
  () => {
    const result =
      validateCharacterLoresheetDefinitions([
        {
          ...validLoresheet,
          benefits:
            validLoresheet.benefits.map(
              (benefit, index) =>
                index === 4
                  ? {
                      ...benefit,
                      key:
                        validLoresheet
                          .benefits[0]
                          .key,
                    }
                  : benefit,
            ),
        },
      ])

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'contiene una ventaja duplicada',
          ),
      ),
    )
  },
)

test(
  'permite localizar una Ficha de Conocimientos por clave',
  () => {
    assert.equal(
      getCharacterLoresheetDefinition(
        [validLoresheet],
        'test-loresheet',
      )?.name,
      'Ficha de prueba',
    )

    assert.equal(
      getCharacterLoresheetDefinition(
        [validLoresheet],
        'missing',
      ),
      null,
    )
  },
)

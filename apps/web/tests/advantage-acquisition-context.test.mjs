import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ADVANTAGE_ADVANCEMENT_RULES_REQUIRED,
  validateCharacterAdvantagesForContext,
} from '../src/features/character-creation/domain/advantage-acquisition-context-rules.ts'

const stepValidation = await readFile(
  new URL(
    '../src/features/character-creation/domain/step-validation.ts',
    import.meta.url,
  ),
  'utf8',
)

const creationDraft = {
  selections: [
    {
      selectionId: 'merit-1',
      definitionKey: 'test-merit',
      category: 'merit',
      rating: 4,
      origin: 'creation',
    },
    {
      selectionId: 'background-1',
      definitionKey: 'test-background',
      category: 'background',
      rating: 3,
      origin: 'creation',
    },
    {
      selectionId: 'flaw-1',
      definitionKey: 'test-flaw',
      category: 'flaw',
      rating: 2,
      origin: 'creation',
    },
  ],
}

test(
  '026-B valida el presupuesto 7/2 sólo durante la creación',
  () => {
    const result =
      validateCharacterAdvantagesForContext(
        creationDraft,
        'characterCreation',
      )

    assert.equal(result.context, 'characterCreation')
    assert.equal(result.structurallyValid, true)
    assert.equal(result.valid, true)
  },
)

test(
  '026-B mantiene el presupuesto inicial obligatorio en creación',
  () => {
    const result =
      validateCharacterAdvantagesForContext(
        {
          selections:
            creationDraft.selections.slice(1),
        },
        'characterCreation',
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /exactamente 7 puntos/,
    )
  },
)

test(
  '026-B no reutiliza 7/2 como regla de evolución',
  () => {
    const result =
      validateCharacterAdvantagesForContext(
        { selections: [] },
        'characterAdvancement',
      )

    assert.equal(result.context, 'characterAdvancement')
    assert.equal(result.structurallyValid, true)
    assert.equal(result.valid, false)
    assert.deepEqual(
      result.errors,
      [ADVANTAGE_ADVANCEMENT_RULES_REQUIRED],
    )
  },
)

test(
  '026-B conserva la validación estructural durante la evolución',
  () => {
    const result =
      validateCharacterAdvantagesForContext(
        {
          selections: [
            {
              ...creationDraft.selections[0],
              rating: 0,
            },
          ],
        },
        'characterAdvancement',
      )

    assert.equal(result.structurallyValid, false)
    assert.match(
      result.errors.join(' '),
      /entero entre 1 y 6/,
    )
    assert.ok(
      result.errors.includes(
        ADVANTAGE_ADVANCEMENT_RULES_REQUIRED,
      ),
    )
  },
)

test(
  '026-B el creador declara explícitamente su contexto',
  () => {
    assert.match(
      stepValidation,
      /validateCharacterAdvantagesForContext\([\s\S]*?'characterCreation'/,
    )
  },
)

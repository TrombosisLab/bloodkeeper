import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  deriveCharacterHealthCapacity,
  deriveCharacterWillpowerCapacity,
} from '@v5r/character-rules'

import {
  deriveCharacterTraits,
} from '../src/features/character-creation/domain/blood-rules.ts'

const attributes = {
  strength: 1,
  dexterity: 1,
  stamina: 3,
  charisma: 1,
  manipulation: 1,
  composure: 2,
  intelligence: 1,
  wits: 1,
  resolve: 3,
}

test(
  'SPEC-024 Web reutiliza los derivados compartidos',
  () => {
    assert.deepEqual(
      deriveCharacterTraits(attributes),
      {
        health:
          deriveCharacterHealthCapacity(attributes),
        willpower:
          deriveCharacterWillpowerCapacity(attributes),
      },
    )
  },
)

test(
  'SPEC-024 evita mantener fórmulas derivadas locales en blood-rules',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/domain/blood-rules.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /deriveCharacterHealthCapacity/,
    )
    assert.match(
      source,
      /deriveCharacterWillpowerCapacity/,
    )
    assert.doesNotMatch(
      source,
      /attributes\.stamina\s*\+\s*3/,
    )
    assert.doesNotMatch(
      source,
      /attributes\.composure\s*\+\s*attributes\.resolve/,
    )
  },
)

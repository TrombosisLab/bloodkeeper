import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deriveCharacterProfilePhase,
} from '../dist/characters/domain/character-transition.rules.js'

const c = (nature, creationMode) => ({
  nature,
  creation: { creationMode },
})

test('057-E3C2 deriva HUMAN', () => {
  assert.equal(
    deriveCharacterProfilePhase(
      c('human', 'sessionZero'),
      false,
    ),
    'HUMAN',
  )
})

test('057-E3C2 deriva transición y establecido Session Zero', () => {
  assert.equal(
    deriveCharacterProfilePhase(
      c('vampire', 'sessionZero'),
      false,
    ),
    'TRANSITIONAL_VAMPIRE',
  )
  assert.equal(
    deriveCharacterProfilePhase(
      c('vampire', 'sessionZero'),
      true,
    ),
    'ESTABLISHED_VAMPIRE',
  )
})

test('057-E3C2 STANDARD válido sigue establecido y STANDARD inválido no se maquilla', () => {
  assert.equal(
    deriveCharacterProfilePhase(
      c('vampire', 'standard'),
      true,
    ),
    'ESTABLISHED_VAMPIRE',
  )
  assert.throws(
    () => deriveCharacterProfilePhase(
      c('vampire', 'standard'),
      false,
    ),
    /STANDARD_VAMPIRE_PROFILE_INVALID/,
  )
})

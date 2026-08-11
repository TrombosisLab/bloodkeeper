import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  InvalidCharacterAdvancementRequestError,
  parseCharacterAdvancementRequest,
} from '../dist/characters/presentation/character-advancement.dto.js'

const controller = readFileSync(new URL('../src/characters/presentation/character-advancement.controller.ts', import.meta.url), 'utf8')
const moduleSource = readFileSync(new URL('../src/characters/characters.module.ts', import.meta.url), 'utf8')

test('056-C publica preview POST sin compra ni mutacion', () => {
  assert.match(controller, /@Post\('preview'\)/)
  assert.doesNotMatch(controller, /appendGrant|appendCorrection|SPEND|updateCharacter/)
  assert.match(moduleSource, /PreviewCharacterAdvancementUseCase/)
})

test('056-C DTO acepta union cerrada y rechaza formulas de UI', () => {
  assert.deepEqual(parseCharacterAdvancementRequest({ kind: 'attribute', key: 'strength' }), { kind: 'attribute', key: 'strength' })
  assert.throws(
    () => parseCharacterAdvancementRequest({ kind: 'attribute', key: 'strength', cost: 15 }),
    InvalidCharacterAdvancementRequestError,
  )
})

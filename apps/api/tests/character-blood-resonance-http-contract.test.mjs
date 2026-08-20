import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const controllerUrl = new URL(
  '../src/characters/presentation/character-blood-resonance.controller.ts',
  import.meta.url,
)
const moduleUrl = new URL(
  '../src/characters/characters.module.ts',
  import.meta.url,
)

test('058-B publica acción dedicada sin usar PATCH genérico', async () => {
  const controller =
    await readFile(controllerUrl, 'utf8')

  assert.match(
    controller,
    /@Post\(':characterId\/blood\/resonance'\)/,
  )
  assert.match(
    controller,
    /ApplyCharacterBloodResonanceUseCase/,
  )
  assert.doesNotMatch(
    controller,
    /diceBonus|DicePoolModifier/,
  )
})

test('058-B registra controller y use case con participante contextual', async () => {
  const module =
    await readFile(moduleUrl, 'utf8')

  assert.match(
    module,
    /CharacterBloodResonanceController/,
  )
  assert.match(
    module,
    /ApplyCharacterBloodResonanceUseCase/,
  )
  assert.match(
    module,
    /CHRONICLE_PARTICIPANT_REPOSITORY/,
  )
})

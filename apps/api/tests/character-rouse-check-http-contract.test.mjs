import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const controller =
  fs.readFileSync(
    'src/characters/presentation/character-rouse-check.controller.ts',
    'utf8',
  )

const moduleSource =
  fs.readFileSync(
    'src/characters/characters.module.ts',
    'utf8',
  )

test(
  '059-B publica POST dedicado y no reutiliza PATCH de estado',
  () => {
    assert.match(
      controller,
      /@Post\(':characterId\/blood\/rouse-check'\)/,
    )
    assert.doesNotMatch(
      controller,
      /@Patch/,
    )
    assert.match(
      controller,
      /parseExecuteCharacterRouseCheckRequest/,
    )
  },
)

test(
  '059-B registra controller repositorio y use case en CharactersModule',
  () => {
    for (const token of [
      'CharacterRouseCheckController',
      'PrismaCharacterRouseCheckRepository',
      'CHARACTER_ROUSE_CHECK_REPOSITORY',
      'ExecuteCharacterRouseCheckUseCase',
    ]) {
      assert.match(
        moduleSource,
        new RegExp(token),
      )
    }
  },
)

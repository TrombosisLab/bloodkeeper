import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const controller =
  fs.readFileSync(
    'src/characters/presentation/character-blush-of-life.controller.ts',
    'utf8',
  )

const moduleSource =
  fs.readFileSync(
    'src/characters/characters.module.ts',
    'utf8',
  )

const useCase =
  fs.readFileSync(
    'src/characters/application/use-character-blush-of-life.use-case.ts',
    'utf8',
  )

test(
  '059-D1A publica endpoint contextual propio',
  () => {
    assert.match(
      controller,
      /@Post\([\s\S]*':characterId\/blood\/blush-of-life'/,
    )
  },
)

test(
  '059-D1A registra repository use case y controller',
  () => {
    for (const token of [
      'CharacterBlushOfLifeController',
      'PrismaCharacterBlushOfLifeRepository',
      'CHARACTER_BLUSH_OF_LIFE_REPOSITORY',
      'UseCharacterBlushOfLifeUseCase',
    ]) {
      assert.match(
        moduleSource,
        new RegExp(token),
      )
    }
  },
)

test(
  '059-D1A no usa servicio de consumo de Discrasia',
  () => {
    assert.doesNotMatch(
      useCase,
      /ConsumeCharacterBloodDyscrasiaUseCase/,
    )
    assert.match(
      useCase,
      /isCharacterBlushOfLifeRouseExemption/,
    )
    assert.match(
      useCase,
      /reason:\s*'blushOfLife'/,
    )
  },
)

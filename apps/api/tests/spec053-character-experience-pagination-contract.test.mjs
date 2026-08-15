import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

async function source(relative) {
  return readFile(
    new URL(
      `../${relative}`,
      import.meta.url,
    ),
    'utf8',
  )
}

test('SPEC-053 Experience separa ledger full y lectura publica paginada', async () => {
  const contract =
    await source(
      'src/characters/application/character-experience.repository.ts',
    )
  const usecases =
    await source(
      'src/characters/application/character-experience.use-cases.ts',
    )

  assert.match(
    contract,
    /loadLedger\([\s\S]*Promise<CharacterExperienceLedger>/,
  )
  assert.match(
    contract,
    /loadLedgerPage\([\s\S]*OffsetPaginationQuery[\s\S]*Promise<CharacterExperienceLedgerPage>/,
  )

  const loadStart =
    usecases.indexOf(
      'export class LoadCharacterExperienceUseCase',
    )
  const grantStart =
    usecases.indexOf(
      'export class GrantCharacterExperienceUseCase',
      loadStart,
    )
  const publicLoad =
    usecases.slice(
      loadStart,
      grantStart,
    )

  assert.match(
    publicLoad,
    /query:\s*OffsetPaginationQuery/,
  )
  assert.match(
    publicLoad,
    /loadLedgerPage\(/,
  )
  assert.doesNotMatch(
    publicLoad,
    /\.loadLedger\(/,
  )

  const rest =
    usecases.slice(
      grantStart,
    )

  assert.match(
    rest,
    /\.loadLedger\(/,
  )
})

test('SPEC-053 GET Experience expone nextOffset sin cambiar writes', async () => {
  const controller =
    await source(
      'src/characters/presentation/character-experience.controller.ts',
    )
  const dto =
    await source(
      'src/characters/presentation/character-experience.dto.ts',
    )

  assert.match(
    controller,
    /@Get\(\)[\s\S]*@Query\(\)[\s\S]*parseOffsetPaginationQuery/,
  )
  assert.match(
    controller,
    /INVALID_PAGINATION_QUERY/,
  )
  assert.match(
    controller,
    /toCharacterExperiencePageResponse/,
  )

  assert.match(
    dto,
    /CharacterExperiencePageResponseDto[\s\S]*nextOffset:\s*number \| null/,
  )
  assert.match(
    dto,
    /toCharacterExperiencePageResponse/,
  )
  assert.match(
    dto,
    /toCharacterExperienceResponse/,
  )
})

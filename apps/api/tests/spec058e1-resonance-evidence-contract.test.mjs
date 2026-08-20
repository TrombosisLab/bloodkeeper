import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repositoryInterfaceUrl =
  new URL(
    '../src/characters/application/character-draft.repository.ts',
    import.meta.url,
  )

const repositoryUrl =
  new URL(
    '../src/characters/infrastructure/prisma-character-draft.repository.ts',
    import.meta.url,
  )

const previewUrl =
  new URL(
    '../src/characters/application/preview-character-advancement.use-case.ts',
    import.meta.url,
  )

const purchaseUrl =
  new URL(
    '../src/characters/application/purchase-character-advancement.use-case.ts',
    import.meta.url,
  )

const dtoUrl =
  new URL(
    '../src/characters/presentation/character-advancement.dto.ts',
    import.meta.url,
  )

test('058-E1 repositorio expone el ledger histórico de Resonancia ordenado', async () => {
  const [contract, repository] =
    await Promise.all([
      readFile(
        repositoryInterfaceUrl,
        'utf8',
      ),
      readFile(
        repositoryUrl,
        'utf8',
      ),
    ])

  assert.match(
    contract,
    /listBloodResonanceOperations\(/,
  )
  assert.match(
    repository,
    /characterBloodResonanceOperation[\s\S]*findMany\(/,
  )
  assert.match(
    repository,
    /orderBy:[\s\S]*createdAt:[\s\S]*'desc'/,
  )
})

test('058-E1 preview y purchase consultan y aplican la misma evidencia backend', async () => {
  const [preview, purchase] =
    await Promise.all([
      readFile(previewUrl, 'utf8'),
      readFile(purchaseUrl, 'utf8'),
    ])

  for (const source of [
    preview,
    purchase,
  ]) {
    assert.match(
      source,
      /listBloodResonanceOperations/,
    )
    assert.match(
      source,
      /applyCharacterDisciplineResonanceEvidence/,
    )
  }
})

test('058-E1 el cliente no puede declarar resonanceEvidence', async () => {
  const dto =
    await readFile(dtoUrl, 'utf8')

  assert.equal(
    dto.includes('resonanceEvidence'),
    false,
  )
  assert.equal(
    dto.includes(
      'resonanceOperationId',
    ),
    false,
  )
})

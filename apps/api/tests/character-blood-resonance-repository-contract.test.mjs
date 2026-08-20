import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repositoryUrl = new URL(
  '../src/characters/infrastructure/prisma-character-draft.repository.ts',
  import.meta.url,
)
const stateUseCaseUrl = new URL(
  '../src/characters/application/update-character-state.use-case.ts',
  import.meta.url,
)

test('058-B aplica operación, revisión y hambre en una transacción', async () => {
  const repository =
    await readFile(repositoryUrl, 'utf8')

  assert.match(
    repository,
    /async applyBloodResonance[\s\S]*this\.database\.\$transaction/,
  )
  assert.match(
    repository,
    /revision:\s*data\.expectedRevision[\s\S]*revision:\s*\{\s*increment:\s*1/,
  )
  assert.match(
    repository,
    /characterBloodState[\s\S]*hunger:\s*data\.hungerAfter/,
  )
  assert.match(
    repository,
    /characterBloodResonanceOperation[\s\S]*operationId:\s*data\.operationId/,
  )
})

test('058-B descenso de Hambre y Hambre 5 limpian estado activo', async () => {
  const [repository, useCase] =
    await Promise.all([
      readFile(repositoryUrl, 'utf8'),
      readFile(stateUseCaseUrl, 'utf8'),
    ])

  assert.match(
    useCase,
    /data\.hunger < current\.blood\.hunger[\s\S]*data\.hunger === 5/,
  )
  assert.match(
    repository,
    /clearBloodResonance[\s\S]*resonanceSourceKind:\s*null[\s\S]*resonanceKey:\s*null[\s\S]*resonanceTemperament:\s*null/,
  )
})

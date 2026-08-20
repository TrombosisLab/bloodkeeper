import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repositoryUrl = new URL(
  '../src/characters/infrastructure/prisma-character-draft.repository.ts',
  import.meta.url,
)

const useCaseUrl = new URL(
  '../src/characters/application/consume-character-blood-dyscrasia.use-case.ts',
  import.meta.url,
)

const moduleUrl = new URL(
  '../src/characters/characters.module.ts',
  import.meta.url,
)

test('058-D3 nueva alimentación identifica internamente la instancia adquirida', async () => {
  const repository =
    await readFile(repositoryUrl, 'utf8')

  assert.match(
    repository,
    /dyscrasiaSourceOperationId:[\s\S]*data\.dyscrasiaKey === null[\s\S]*data\.operationId/,
  )
})

test('058-D3 consumo limpia sólo Discrasia y conserva Resonancia', async () => {
  const repository =
    await readFile(repositoryUrl, 'utf8')

  assert.match(
    repository,
    /consumeBloodDyscrasia\([\s\S]*dyscrasiaKey:\s*null,[\s\S]*dyscrasiaAcquisitionMode:[\s\S]*null,[\s\S]*dyscrasiaSourceOperationId:[\s\S]*null/,
  )

  const consumeBlock =
    repository.slice(
      repository.indexOf(
        'async consumeBloodDyscrasia(',
      ),
      repository.indexOf(
        'async updateState(',
      ),
    )

  assert.equal(
    consumeBlock.includes(
      'resonanceKey: null',
    ),
    false,
  )
  assert.equal(
    consumeBlock.includes(
      'resonanceTemperament: null',
    ),
    false,
  )
})

test('058-D3 tiene ledger por operationId y unicidad por sourceBloodOperationId', async () => {
  const repository =
    await readFile(repositoryUrl, 'utf8')

  assert.match(
    repository,
    /findBloodDyscrasiaConsumptionOperation/,
  )
  assert.match(
    repository,
    /findBloodDyscrasiaConsumptionBySource/,
  )
  assert.match(
    repository,
    /characterId_sourceBloodOperationId/,
  )
})

test('058-D3 servicio permanece interno y no está expuesto por CharactersModule', async () => {
  const useCase =
    await readFile(useCaseUrl, 'utf8')
  const module =
    await readFile(moduleUrl, 'utf8')

  assert.match(
    useCase,
    /intentionally not exposed by an HTTP controller/,
  )
  assert.equal(
    module.includes(
      'ConsumeCharacterBloodDyscrasiaUseCase',
    ),
    false,
  )
})

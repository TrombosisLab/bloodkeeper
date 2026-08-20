import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repositoryUrl = new URL(
  '../src/characters/infrastructure/prisma-character-draft.repository.ts',
  import.meta.url,
)

const domainUrl = new URL(
  '../src/characters/domain/character-blood-resonance.types.ts',
  import.meta.url,
)

test('058-D2 alimentación reemplaza Discrasia y ledger conserva evidencia', async () => {
  const repository =
    await readFile(repositoryUrl, 'utf8')

  assert.match(
    repository,
    /characterBloodState[\s\S]*dyscrasiaKey:[\s\S]*data\.dyscrasiaKey[\s\S]*dyscrasiaAcquisitionMode:[\s\S]*data\.dyscrasiaAcquisitionMode/,
  )

  assert.match(
    repository,
    /characterBloodResonanceOperation[\s\S]*dyscrasiaKey:[\s\S]*data\.dyscrasiaKey[\s\S]*dyscrasiaAcquisitionMode:[\s\S]*data\.dyscrasiaAcquisitionMode/,
  )
})

test('058-D2 limpieza de Resonancia limpia también Discrasia', async () => {
  const repository =
    await readFile(repositoryUrl, 'utf8')

  assert.match(
    repository,
    /clearBloodResonance[\s\S]*resonanceSpecialAffinityKey:[\s\S]*null,[\s\S]*dyscrasiaKey:\s*null,[\s\S]*dyscrasiaAcquisitionMode:/,
  )
})

test('058-D2 idempotencia incorpora key y modo de adquisición', async () => {
  const domain =
    await readFile(domainUrl, 'utf8')

  assert.match(
    domain,
    /existing\.dyscrasiaKey[\s\S]*attempted\.dyscrasiaKey/,
  )
  assert.match(
    domain,
    /existing\.dyscrasiaAcquisitionMode[\s\S]*attempted\.dyscrasiaAcquisitionMode/,
  )
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  InvalidInitialVampireResolutionRequestError,
  parseConsolidateInitialVampireProfileRequest,
} from '../dist/characters/presentation/character-initial-vampire.dto.js'

const characterId = '33333333-3333-4333-8333-333333333333'

test('057-E3C2 parser acepta sólo expectedRevision', () => {
  assert.deepEqual(
    parseConsolidateInitialVampireProfileRequest(
      characterId,
      { expectedRevision: 9 },
    ),
    { characterId, expectedRevision: 9 },
  )
  assert.throws(
    () => parseConsolidateInitialVampireProfileRequest(
      characterId,
      { expectedRevision: 9, xp: 1 },
    ),
    InvalidInitialVampireResolutionRequestError,
  )
})

test('057-E3C2 publica endpoint autenticado y error estructurado', async () => {
  const source = await readFile(
    new URL(
      '../src/characters/presentation/character-initial-vampire.controller.ts',
      import.meta.url,
    ),
    'utf8',
  )
  assert.match(source, /:characterId\/initial-vampire\/consolidate/)
  assert.match(source, /authenticatedActorId\(request\)/)
  assert.match(source, /resolve\.consolidateProfile/)
  assert.match(source, /INITIAL_VAMPIRE_PROFILE_INCOMPLETE/)
})

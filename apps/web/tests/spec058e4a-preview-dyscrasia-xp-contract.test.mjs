import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const [
  types,
  api,
] = await Promise.all([
  readFile(
    new URL(
      '../src/features/character-sheet/types/character-experience.types.ts',
      import.meta.url,
    ),
    'utf8',
  ),
  readFile(
    new URL(
      '../src/features/character-sheet/infrastructure/character-experience.api.ts',
      import.meta.url,
    ),
    'utf8',
  ),
])

test('058-E4A gateway permite sólo el opt-in booleano en preview/purchase', () => {
  assert.match(
    types,
    /preview\([\s\S]*useDyscrasiaExperience\?: boolean/,
  )
  assert.match(
    types,
    /purchase\([\s\S]*useDyscrasiaExperience\?: boolean/,
  )

  assert.match(
    api,
    /useDyscrasiaExperience[\s\S]*\? \{[\s\S]*advancement,[\s\S]*useDyscrasiaExperience:/,
  )

  assert.match(
    api,
    /expectedRevision,[\s\S]*operationId,[\s\S]*advancement,[\s\S]*useDyscrasiaExperience/,
  )

  const previewRequestBody =
    api.slice(
      api.indexOf(
        'async preview(',
      ),
      api.indexOf(
        'async purchase(',
      ),
    )

  const purchaseRequestBody =
    api.slice(
      api.indexOf(
        'async purchase(',
      ),
    )

  for (const forbidden of [
    'sourceBloodOperationId',
    'dyscrasiaKey:',
    'discount:',
    'cost:',
  ]) {
    assert.equal(
      previewRequestBody.includes(
        forbidden,
      ),
      false,
      `autoridad preview inesperada: ${forbidden}`,
    )

    const purchaseJsonStart =
      purchaseRequestBody.indexOf(
        'JSON.stringify({',
      )
    const purchaseJsonEnd =
      purchaseRequestBody.indexOf(
        '}),',
        purchaseJsonStart,
      )

    const purchaseJson =
      purchaseRequestBody.slice(
        purchaseJsonStart,
        purchaseJsonEnd,
      )

    assert.equal(
      purchaseJson.includes(
        forbidden,
      ),
      false,
      `autoridad purchase inesperada: ${forbidden}`,
    )
  }
})

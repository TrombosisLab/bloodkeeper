import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const api =
  fs.readFileSync(
    'src/features/character-sheet/infrastructure/character-blush-of-life.api.ts',
    'utf8',
  )

const types =
  fs.readFileSync(
    'src/features/character-sheet/types/character-blush-of-life-persistence.types.ts',
    'utf8',
  )

test(
  '059-D1B contrato público sólo envía expectedRevision + operationId',
  () => {
    assert.match(
      types,
      /interface CharacterBlushOfLifeRequest[\s\S]*expectedRevision:[\s\S]*number[\s\S]*operationId:[\s\S]*string/,
    )

    const requestBlock =
      types.slice(
        types.indexOf(
          'export interface CharacterBlushOfLifeRequest',
        ),
        types.indexOf(
          'export type CharacterBlushOfLifeConsequence',
        ),
      )

    for (const forbidden of [
      'reason',
      'dyscrasiaKey',
      'sourceBloodOperationId',
      'hunger',
      'rolls',
      'forced',
      'success',
    ]) {
      assert.doesNotMatch(
        requestBlock,
        new RegExp(forbidden),
      )
    }
  },
)

test(
  '059-D1B gateway usa endpoint contextual POST con sesión y JSON',
  () => {
    assert.match(
      api,
      /\/api\/characters\/\$\{encodeURIComponent\(characterId\)\}\/blood\/blush-of-life/,
    )
    assert.match(
      api,
      /method:[\s\S]*'POST'/,
    )
    assert.match(
      api,
      /credentials:[\s\S]*'include'/,
    )
    assert.match(
      api,
      /'Content-Type':[\s\S]*'application\/json'/,
    )
    assert.match(
      api,
      /JSON\.stringify\([\s\S]*request/,
    )
  },
)

test(
  '059-D1B parser distingue rouseResolved de rouseExempted',
  () => {
    assert.match(
      api,
      /parsed\.outcome ===[\s\S]*'rouseResolved'/,
    )
    assert.match(
      api,
      /parsed\.outcome !==[\s\S]*'rouseExempted'/,
    )
    assert.match(
      api,
      /parsed\.reason !==[\s\S]*'blushOfLife'/,
    )
    assert.match(
      api,
      /exemption\.source !==[\s\S]*'dyscrasia'/,
    )
  },
)

test(
  '059-D1B exención exige Hambre inmutable y no fabrica rolls',
  () => {
    assert.match(
      api,
      /hungerBefore !==[\s\S]*hungerAfter/,
    )
    assert.match(
      api,
      /rouseExempted must preserve Hunger/,
    )

    const exemptReturnStart =
      api.indexOf(
        "outcome:\n      'rouseExempted'",
      )

    assert.ok(
      exemptReturnStart >= 0,
    )

    const exemptReturn =
      api.slice(
        exemptReturnStart,
        api.indexOf(
          '\n  }\n}\n\nfunction parseError',
          exemptReturnStart,
        ),
      )

    assert.doesNotMatch(
      exemptReturn,
      /\brolls\b/,
    )
    assert.doesNotMatch(
      exemptReturn,
      /\bsuccess\b/,
    )
    assert.doesNotMatch(
      exemptReturn,
      /rollHistoryId/,
    )
  },
)

test(
  '059-D1B valida Rouse ordinario de uno o dos d10',
  () => {
    assert.match(
      api,
      /parsed\.rolls\.length < 1/,
    )
    assert.match(
      api,
      /parsed\.rolls\.length > 2/,
    )
    assert.match(
      api,
      /roll < 1/,
    )
    assert.match(
      api,
      /roll > 10/,
    )
    assert.match(
      api,
      /selectedResult/,
    )
  },
)

test(
  '059-D1B propaga HTTP y distingue fallo de red con status 0',
  () => {
    assert.match(
      api,
      /if \(!response\.ok\)/,
    )
    assert.match(
      api,
      /new CharacterBlushOfLifeApiError\([\s\S]*response\.status/,
    )
    assert.match(
      api,
      /new CharacterBlushOfLifeApiError\([\s\S]*0,[\s\S]*null/,
    )
  },
)

test(
  '059-D1B UUID fallback conserva versión 4 y variante RFC4122',
  () => {
    assert.match(
      api,
      /bytes\[6\][\s\S]*0x0f[\s\S]*0x40/,
    )
    assert.match(
      api,
      /bytes\[8\][\s\S]*0x3f[\s\S]*0x80/,
    )
    assert.match(
      api,
      /cryptoApi\.randomUUID/,
    )
    assert.match(
      api,
      /cryptoApi\.getRandomValues/,
    )
  },
)

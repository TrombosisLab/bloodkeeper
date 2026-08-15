import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidOffsetPaginationQueryError,
  offsetPageFromRows,
  parseOffsetPaginationQuery,
} from '../dist/common/offset-pagination.js'

test(
  'SPEC-053 usa 25/0 por defecto y limita a 50',
  () => {
    assert.deepEqual(
      parseOffsetPaginationQuery({}),
      {
        limit: 25,
        offset: 0,
      },
    )

    assert.deepEqual(
      parseOffsetPaginationQuery({
        limit: '50',
        offset: '75',
      }),
      {
        limit: 50,
        offset: 75,
      },
    )
  },
)

test(
  'SPEC-053 rechaza límites y offsets inválidos',
  () => {
    for (const query of [
      { limit: '0' },
      { limit: '51' },
      { limit: '-1' },
      { limit: '1.5' },
      { limit: ['25'] },
      { offset: '-1' },
      { offset: '1.5' },
      { offset: ['0'] },
    ]) {
      assert.throws(
        () =>
          parseOffsetPaginationQuery(
            query,
          ),
        InvalidOffsetPaginationQueryError,
      )
    }
  },
)

test(
  'SPEC-053 calcula nextOffset sólo cuando existe otra fila',
  () => {
    assert.deepEqual(
      offsetPageFromRows(
        ['a', 'b', 'c'],
        {
          limit: 2,
          offset: 10,
        },
      ),
      {
        items: ['a', 'b'],
        nextOffset: 12,
      },
    )

    assert.deepEqual(
      offsetPageFromRows(
        ['a', 'b'],
        {
          limit: 2,
          offset: 10,
        },
      ),
      {
        items: ['a', 'b'],
        nextOffset: null,
      },
    )
  },
)

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BadRequestException,
} from '@nestjs/common'

import {
  contentReferences,
  contextImageTargetType,
  noteTags,
  references,
} from '../dist/chronicles/presentation/chronicle-note-input.js'

test(
  'chronicle note input normalizes supported mentions and tags',
  () => {
    assert.deepEqual(
      contentReferences(
        'Pista @[Catedral](LOCATION:location-id) y @[Informe](DOCUMENT:document-id).',
      ),
      [
        { targetType: 'LOCATION', targetId: 'location-id' },
        { targetType: 'DOCUMENT', targetId: 'document-id' },
      ],
    )

    assert.equal(
      contextImageTargetType('document'),
      'DOCUMENT',
    )
    assert.deepEqual(
      noteTags(['#pista', 'pista', ' secreto ']),
      ['pista', 'secreto'],
    )
  },
)

test(
  'chronicle note input rejects unsupported or malformed references',
  () => {
    assert.throws(
      () => references([
        { targetType: 'UNKNOWN', targetId: 'target-id' },
      ]),
      BadRequestException,
    )
    assert.throws(
      () => contextImageTargetType('CHARACTER'),
      BadRequestException,
    )
  },
)

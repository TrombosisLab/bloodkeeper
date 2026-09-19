import assert from 'node:assert/strict'
import test from 'node:test'

import {
  presentChronicleNote,
} from '../dist/chronicles/presentation/chronicle-note-presenter.js'

const note = {
  id: 'note-id',
  chronicleId: 'chronicle-id',
  sessionId: null,
  contextLocationId: null,
  contextImageTargetType: 'DOCUMENT',
  contextImageTargetId: 'document-id',
  title: 'Pista',
  content: 'Contenido',
  visibility: 'SELECTED_PLAYERS',
  status: 'ACTIVE',
  authorUserId: 'author-id',
  tags: ['importante'],
  revision: 2,
  createdAt: new Date('2026-09-19T10:00:00.000Z'),
  updatedAt: new Date('2026-09-19T10:05:00.000Z'),
  favorites: [{ userId: 'player-id' }],
  references: [{
    id: 'reference-id',
    targetType: 'LOCATION',
    targetId: 'location-id',
    label: 'Catedral',
  }],
  audiences: [{ userId: 'player-id' }],
  author: {
    id: 'author-id',
    displayName: 'Narrador',
    username: 'narrador',
  },
  session: null,
}

test(
  'chronicle note presenter keeps private audience data for the narrator',
  () => {
    const presented = presentChronicleNote(note, true, 'author-id')

    assert.equal(presented.pinned, false)
    assert.equal(presented.contextImageTargetType, 'DOCUMENT')
    assert.equal(presented.contextImageTargetId, 'document-id')
    assert.deepEqual(presented.audienceUserIds, ['player-id'])
    assert.deepEqual(presented.references, [{
      id: 'reference-id',
      targetType: 'LOCATION',
      targetId: 'location-id',
      label: 'Catedral',
    }])
  },
)

test(
  'chronicle note presenter hides selected audience from other viewers',
  () => {
    const presented = presentChronicleNote(note, false, 'player-id')

    assert.equal(presented.pinned, true)
    assert.deepEqual(presented.audienceUserIds, [])
    assert.equal(presented.canEdit, false)
  },
)

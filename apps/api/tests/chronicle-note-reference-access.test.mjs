import assert from 'node:assert/strict'
import test from 'node:test'

import {
  findNoteReferenceTarget,
  previewImageType,
} from '../dist/chronicles/presentation/chronicle-note-reference-access.js'

function resourceDatabase(resource) {
  const calls = []
  return {
    calls,
    libraryResource: {
      async findFirst(args) {
        calls.push(args)
        return resource
      },
    },
  }
}

test(
  'note reference access hides narrator-only resources from players',
  async () => {
    const database = resourceDatabase({
      id: 'resource-id',
      name: 'Informe',
      kind: 'document',
      summary: 'Resumen',
      narratorNotes: 'Privado',
      metadata: null,
      status: 'active',
    })

    const target = await findNoteReferenceTarget(database, {
      chronicleId: 'chronicle-id',
      targetType: 'DOCUMENT',
      targetId: 'resource-id',
      narrator: false,
    })

    assert.equal(target.label, 'Informe')
    assert.equal(
      database.calls[0].where.bindings.some.visibility,
      'chronicle_participants',
    )
    assert.equal(database.calls[0].where.kind, 'document')
  },
)

test(
  'note reference access lets the narrator inspect narrator-only resources',
  async () => {
    const database = resourceDatabase({
      id: 'resource-id',
      name: 'Informe',
      kind: 'document',
      summary: null,
      narratorNotes: 'Privado',
      metadata: { source: 'narrator' },
      status: 'active',
    })

    const target = await findNoteReferenceTarget(database, {
      chronicleId: 'chronicle-id',
      targetType: 'DOCUMENT',
      targetId: 'resource-id',
      narrator: true,
    })

    assert.equal(target.narratorDetails, 'Privado')
    assert.equal(
      'visibility' in database.calls[0].where.bindings.some,
      false,
    )
  },
)

test(
  'note reference access resolves direct chronicle targets and image types',
  async () => {
    const database = {
      chronicleLocation: {
        async findFirst() {
          return {
            id: 'location-id',
            name: 'Catedral',
            category: 'sagrado',
            description: 'Un lugar',
            narratorNotes: null,
            status: 'ACTIVE',
            parentLocationId: null,
          }
        },
      },
    }

    const target = await findNoteReferenceTarget(database, {
      chronicleId: 'chronicle-id',
      targetType: 'LOCATION',
      targetId: 'location-id',
      narrator: false,
    })

    assert.equal(target.label, 'Catedral')
    assert.equal(previewImageType('LOCATION'), 'LOCATION')
    assert.equal(previewImageType('DOCUMENT'), 'RESOURCE')
  },
)

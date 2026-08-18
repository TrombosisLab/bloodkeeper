import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const types = await readFile(
  new URL(
    '../src/features/chronicles/types/chronicle-api.types.ts',
    import.meta.url,
  ),
  'utf8',
)

const gateway = await readFile(
  new URL(
    '../src/features/chronicles/infrastructure/chronicle.api.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '034-C modela snapshot y requests exactos de Evento',
  () => {
    const eventTypes =
      types.slice(
        types.indexOf(
          'export type ChronicleEventApiStatus',
        ),
        types.indexOf(
          'export interface ChronicleSessionAttendanceApiSnapshot',
        ),
      )

    for (const field of [
      'title',
      'description',
      'narratorNotes',
      'narrativeTimeLabel',
      'realDate',
      'timelineOrder',
      'status',
      'createdAt',
      'updatedAt',
    ]) {
      assert.match(
        eventTypes,
        new RegExp(`\\b${field}\\b`),
      )
    }

    assert.doesNotMatch(
      eventTypes,
      /characterId|npcId|locationId|sessionId|shared|visibility|planned|occurred/i,
    )
  },
)

test(
  '034-C parser valida timestamp opcional orden entero y estado',
  () => {
    assert.match(
      gateway,
      /parseChronicleEventResponse/,
    )
    assert.match(
      gateway,
      /value\.realDate === null[\s\S]*validTimestamp\(value\.realDate\)/,
    )
    assert.match(
      gateway,
      /Number\.isInteger\(value\.timelineOrder\)/,
    )
    assert.match(
      gateway,
      /value\.status === 'active'[\s\S]*value\.status === 'archived'/,
    )
  },
)

test(
  '034-C gateway expone list detail create update reorder archive',
  () => {
    for (const method of [
      'eventsPage(',
      'events(',
      'event(',
      'createEvent(',
      'updateEvent(',
      'reorderEvents(',
      'archiveEvent(',
    ]) {
      assert.match(
        gateway,
        new RegExp(
          method.replace(
            '(',
            '\\(',
          ),
        ),
      )
    }
  },
)

test(
  '034-C gateway usa endpoints backend exactos',
  () => {
    assert.match(
      gateway,
      /\/events\?limit=\$\{limit\}&offset=\$\{offset\}`/,
    )
    assert.match(
      gateway,
      /\/events\/\$\{eventId\}`/,
    )
    assert.match(
      gateway,
      /\/events\/reorder`/,
    )
    assert.match(
      gateway,
      /\/events\/\$\{eventId\}\/archive`/,
    )
  },
)

test(
  '034-C escrituras usan POST/PATCH y JSON sin DELETE',
  () => {
    assert.match(
      gateway,
      /async createEvent[\s\S]*method: 'POST'/,
    )
    assert.match(
      gateway,
      /async updateEvent[\s\S]*method: 'PATCH'/,
    )
    assert.match(
      gateway,
      /async reorderEvents[\s\S]*method: 'PATCH'/,
    )
    assert.match(
      gateway,
      /async archiveEvent[\s\S]*method: 'PATCH'/,
    )
    assert.doesNotMatch(
      gateway,
      /async deleteEvent|method: 'DELETE'[\s\S]*events/,
    )
  },
)

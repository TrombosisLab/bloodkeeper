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
  '035-C modela snapshot y requests exactos de Sesion',
  () => {
    const sessionTypes =
      types.slice(
        types.indexOf(
          'export type ChronicleSessionApiStatus',
        ),
      )

    for (const field of [
      'sessionNumber',
      'title',
      'realDate',
      'status',
      'summary',
      'narratorNotes',
      'createdAt',
      'updatedAt',
    ]) {
      assert.match(
        sessionTypes,
        new RegExp(`\\b${field}\\b`),
      )
    }

    assert.doesNotMatch(
      sessionTypes,
      /eventId|npcId|locationId|characterId|dice|activeSession|shared/i,
    )
  },
)

test(
  '035-C parser valida numero fecha opcional y tres estados',
  () => {
    assert.match(
      gateway,
      /parseChronicleSessionResponse/,
    )
    assert.match(
      gateway,
      /value\.sessionNumber === null[\s\S]*Number\.isInteger\(value\.sessionNumber\)[\s\S]*value\.sessionNumber >= 0/,
    )
    assert.match(
      gateway,
      /value\.realDate === null[\s\S]*validTimestamp\(value\.realDate\)/,
    )
    assert.match(
      gateway,
      /value\.status === 'preparation'[\s\S]*value\.status === 'completed'[\s\S]*value\.status === 'archived'/,
    )
  },
)

test(
  '035-C gateway expone list detail create update complete archive',
  () => {
    for (const method of [
      'sessions(',
      'session(',
      'createSession(',
      'updateSession(',
      'completeSession(',
      'archiveSession(',
    ]) {
      assert.match(
        gateway,
        new RegExp(
          method.replace('(', '\\('),
        ),
      )
    }
  },
)

test(
  '035-C gateway usa endpoints backend exactos',
  () => {
    assert.match(gateway, /\/sessions`/)
    assert.match(
      gateway,
      /\/sessions\/\$\{sessionId\}`/,
    )
    assert.match(
      gateway,
      /\/sessions\/\$\{sessionId\}\/complete`/,
    )
    assert.match(
      gateway,
      /\/sessions\/\$\{sessionId\}\/archive`/,
    )
  },
)

test(
  '035-C escrituras usan POST PATCH y JSON sin DELETE',
  () => {
    assert.match(
      gateway,
      /async createSession[\s\S]*method: 'POST'/,
    )
    for (const method of [
      'updateSession',
      'completeSession',
      'archiveSession',
    ]) {
      assert.match(
        gateway,
        new RegExp(
          `async ${method}[\\s\\S]*method: 'PATCH'`,
        ),
      )
    }
    assert.doesNotMatch(
      gateway,
      /async deleteSession|method: 'DELETE'[\s\S]*sessions/,
    )
  },
)

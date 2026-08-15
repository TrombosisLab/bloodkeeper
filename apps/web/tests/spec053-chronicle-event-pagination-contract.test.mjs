import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

async function source(relative) {
  return readFile(
    new URL(
      `../src/features/chronicles/${relative}`,
      import.meta.url,
    ),
    'utf8',
  )
}

test(
  'SPEC-053 Events expone página física y helper COMPLETE',
  async () => {
    const gateway =
      await source(
        'infrastructure/chronicle.api.ts',
      )

    assert.match(
      gateway,
      /eventsPage\(/,
    )
    assert.match(
      gateway,
      /\/events\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /ChronicleEventApiPage/,
    )

    const start =
      gateway.indexOf(
        '    async events(chronicleId)',
      )
    const end =
      gateway.indexOf(
        '    async event(',
        start,
      )
    const complete =
      gateway.slice(start, end)

    assert.match(
      complete,
      /while \(nextOffset !== null\)/,
    )
    assert.match(
      complete,
      /this\.eventsPage/,
    )
    assert.match(
      complete,
      /limit:\s*50/,
    )
    assert.match(
      complete,
      /offset:\s*nextOffset/,
    )
    assert.match(
      complete,
      /\.\.\.page\.items/,
    )
  },
)

test(
  'SPEC-053 reorderEvents conserva respuesta array completa',
  async () => {
    const gateway =
      await source(
        'infrastructure/chronicle.api.ts',
      )

    const start =
      gateway.indexOf(
        '    async reorderEvents(',
      )
    const end =
      gateway.indexOf(
        '    async archiveEvent(',
        start,
      )
    const reorder =
      gateway.slice(start, end)

    assert.match(
      reorder,
      /parseList\(/,
    )
    assert.doesNotMatch(
      reorder,
      /parseNestedOffsetPage/,
    )
  },
)

test(
  'SPEC-053 ChronicleEventPanel sigue trabajando con colección completa',
  async () => {
    const panel =
      await source(
        'components/ChronicleEventPanel.tsx',
      )

    assert.match(
      panel,
      /await gateway\.events\(/,
    )
    assert.match(
      panel,
      /const activeEvents[\s\S]*events\.filter/,
    )
    assert.match(
      panel,
      /activeEvents\.findIndex/,
    )
    assert.match(
      panel,
      /eventIds:[\s\S]*reordered\.map/,
    )
    assert.doesNotMatch(
      panel,
      /Cargar más Eventos|loadMoreEvents|eventsNextOffset/,
    )
  },
)

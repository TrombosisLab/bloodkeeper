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
  'SPEC-053-C4 gateway expone página física Location',
  async () => {
    const gateway =
      await source(
        'infrastructure/chronicle.api.ts',
      )

    assert.match(
      gateway,
      /locationsPage\(/,
    )
    assert.match(
      gateway,
      /\/locations\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /ChronicleLocationApiPage/,
    )
  },
)

test(
  'SPEC-053-C4 locations reconstruye colección completa por páginas bounded',
  async () => {
    const gateway =
      await source(
        'infrastructure/chronicle.api.ts',
      )

    const start =
      gateway.indexOf(
        '    async locations(chronicleId)',
      )
    const end =
      gateway.indexOf(
        '    async location(',
        start,
      )
    const block =
      gateway.slice(start, end)

    assert.notEqual(start, -1)
    assert.notEqual(end, -1)
    assert.match(
      block,
      /while \(nextOffset !== null\)/,
    )
    assert.match(
      block,
      /this\.locationsPage/,
    )
    assert.match(
      block,
      /limit:\s*50/,
    )
    assert.match(
      block,
      /offset:\s*nextOffset/,
    )
    assert.match(
      block,
      /\.\.\.page\.items/,
    )
  },
)

test(
  'SPEC-053-C4 panel conserva jerarquía completa sin Cargar más parcial',
  async () => {
    const panel =
      await source(
        'components/ChronicleLocationPanel.tsx',
      )

    assert.match(
      panel,
      /await gateway\.locations\(/,
    )
    assert.match(
      panel,
      /locations\.find\(/,
    )
    assert.match(
      panel,
      /locations\.filter\(/,
    )
    assert.match(
      panel,
      /location\.id !==[\s\S]*currentLocationId/,
    )
    assert.doesNotMatch(
      panel,
      /Cargar más Localizaciones|loadMoreLocations|locationsNextOffset/,
    )
  },
)

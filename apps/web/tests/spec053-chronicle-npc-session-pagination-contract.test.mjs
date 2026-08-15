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
  'SPEC-053-C3 gateway PNJ y Sesiones usa páginas visibles',
  async () => {
    const gateway =
      await source(
        'infrastructure/chronicle.api.ts',
      )

    assert.match(
      gateway,
      /\/npcs\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /\/sessions\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /ChronicleNpcApiPage/,
    )
    assert.match(
      gateway,
      /ChronicleSessionApiPage/,
    )
  },
)

test(
  'SPEC-053-C3 panel PNJ carga 25 continua y resetea tras escritura',
  async () => {
    const panel =
      await source(
        'components/ChronicleNpcPanel.tsx',
      )

    assert.match(
      panel,
      /limit:\s*25[\s\S]*offset:\s*0/,
    )
    assert.match(
      panel,
      /loadMoreNpcs/,
    )
    assert.match(
      panel,
      /Cargar más PNJ/,
    )
    assert.match(
      panel,
      /setNpcs\([\s\S]*\.\.\.current[\s\S]*\.\.\.page\.items/,
    )
    assert.match(
      panel,
      /refreshAfterWrite[\s\S]*offset:\s*0/,
    )
  },
)

test(
  'SPEC-053-C3 panel Sesiones carga 25 continua y resetea tras escritura',
  async () => {
    const panel =
      await source(
        'components/ChronicleSessionPanel.tsx',
      )

    assert.match(
      panel,
      /limit:\s*25[\s\S]*offset:\s*0/,
    )
    assert.match(
      panel,
      /loadMoreSessions/,
    )
    assert.match(
      panel,
      /Cargar más sesiones/,
    )
    assert.match(
      panel,
      /setSessions\([\s\S]*\.\.\.current[\s\S]*\.\.\.page\.items/,
    )
    assert.match(
      panel,
      /refreshAfterWrite[\s\S]*offset:\s*0/,
    )
  },
)

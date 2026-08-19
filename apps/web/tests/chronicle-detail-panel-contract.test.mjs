import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const list =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleListCreate.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const detail =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleDetail.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const styles =
  await readFile(
    new URL(
      '../src/features/chronicles/components/chronicle-detail.css',
      import.meta.url,
    ),
    'utf8',
  )

const npcPanel =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleNpcPanel.tsx',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '030-D abre una crónica real desde el listado y permite volver',
  () => {
    assert.match(
      list,
      />\s*Abrir crónica\s*</,
    )
    assert.match(
      list,
      /selectedChronicleId/,
    )
    assert.match(
      list,
      /<ChronicleDetail/,
    )
    assert.match(
      detail,
      />\s*Volver a crónicas\s*</,
    )
  },
)

test(
  '030-D materializa un panel individual con Resumen real',
  () => {
    assert.match(
      detail,
      /gateway\.get/,
    )
    assert.match(
      detail,
      /aria-labelledby="chronicle-detail-title"/,
    )
    assert.match(
      detail,
      />\s*Resumen\s*</,
    )
    assert.match(
      detail,
      /chronicle\.name/,
    )
    assert.match(
      detail,
      /chronicle\.description/,
    )
    assert.match(
      detail,
      /chronicle\.status/,
    )
    assert.match(
      detail,
      /chronicle\.createdAt/,
    )
    assert.match(
      detail,
      /chronicle\.updatedAt/,
    )
  },
)

test(
  '035-C materializa Sesiones tras Eventos sin adelantar relaciones futuras',
  () => {
    const combined =
      detail + list + npcPanel

    assert.match(
      combined,
      /Participantes/,
    )
    assert.match(
      combined,
      />\s*PNJ\s*</,
    )
    assert.match(
      detail,
      /ChronicleResourcesWorkspace/,
    )
    assert.match(
      detail,
      /ChronicleEventPanel/,
    )
    assert.match(
      detail,
      /ChronicleSessionPanel/,
    )
  },
)

test(
  '030-D usa el sistema visual existente y sigue siendo responsive',
  () => {
    assert.match(
      styles,
      /var\(--color-border-default\)/,
    )
    assert.match(
      styles,
      /var\(--color-surface-translucent\)/,
    )
    assert.match(
      styles,
      /var\(--radius-xl\)/,
    )
    assert.match(
      styles,
      /@media \(max-width: 760px\)/,
    )
    assert.doesNotMatch(
      styles,
      /#[0-9a-f]{3,8}\b/i,
    )
    assert.doesNotMatch(
      styles,
      /rgba?\(/,
    )
  },
)

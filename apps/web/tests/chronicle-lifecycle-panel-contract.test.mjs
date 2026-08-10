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

test(
  '031-D ofrece lifecycle sólo desde detalle con Narrador contextual',
  () => {
    assert.match(
      detail,
      /label: 'Activar crónica'/,
    )
    assert.match(
      detail,
      /label: 'Archivar crónica'/,
    )
    assert.match(
      detail,
      /label: 'Reactivar crónica'/,
    )
    assert.match(
      detail,
      /canManageParticipants/,
    )
    assert.match(
      detail,
      /currentMembership/,
    )
    assert.match(
      detail,
      /gateway\.transition/,
    )

    assert.doesNotMatch(
      list,
      /gateway\.transition/,
    )
    assert.doesNotMatch(
      list,
      /transitioningId/,
    )
  },
)

test(
  '030-C mantiene archivadas fuera del flujo habitual sin ocultarlas',
  () => {
    assert.match(
      list,
      /habitualChronicles[\s\S]*status !== 'archived'/,
    )
    assert.match(
      list,
      /archivedChronicles[\s\S]*status === 'archived'/,
    )
    assert.match(
      list,
      />\s*Archivadas\s*</,
    )
  },
)

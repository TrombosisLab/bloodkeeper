import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const component =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleListCreate.tsx',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '030-C ofrece acciones explícitas de activar archivar y reactivar',
  () => {
    assert.match(
      component,
      /label: 'Activar'/,
    )
    assert.match(
      component,
      /label: 'Archivar'/,
    )
    assert.match(
      component,
      /label: 'Reactivar'/,
    )
    assert.match(
      component,
      /gateway\.transition/,
    )
  },
)

test(
  '030-C retira archivadas del flujo habitual sin ocultarlas históricamente',
  () => {
    assert.match(
      component,
      /habitualChronicles[\s\S]*status !== 'archived'/,
    )
    assert.match(
      component,
      /archivedChronicles[\s\S]*status === 'archived'/,
    )
    assert.match(
      component,
      />\s*Archivadas\s*</,
    )
  },
)

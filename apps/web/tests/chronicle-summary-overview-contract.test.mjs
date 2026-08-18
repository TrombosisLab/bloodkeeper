import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const detail = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleDetail.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'Resumen de Crónica reutiliza contexto, participantes y personajes cargados',
  () => {
    assert.match(detail, /activeNarratorCount/)
    assert.match(detail, /activePlayerCount/)
    assert.match(
      detail,
      /className="chronicle-detail__overview"/,
    )
    assert.match(detail, />\s*Tu papel\s*</)
    assert.match(detail, />\s*Narradores activos\s*</)
    assert.match(detail, />\s*Jugadores activos\s*</)
    assert.match(detail, />\s*Personajes asociados\s*</)
    assert.match(detail, /associatedCharacters\.length/)
    assert.match(detail, /currentMembership\?\.role/)
  },
)

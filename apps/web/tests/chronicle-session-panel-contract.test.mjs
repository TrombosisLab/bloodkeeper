import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const panel = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleSessionPanel.tsx',
    import.meta.url,
  ),
  'utf8',
)

const detail = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleDetail.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/features/chronicles/components/chronicle-session-panel.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  '035-C integra Sesiones solo con gate Narrador',
  () => {
    assert.match(detail, /canManageSessions/)
    assert.match(
      detail,
      /currentMembership\?\.role[\s\S]*'narrator'/,
    )
    assert.match(detail, /<ChronicleSessionPanel/)
    assert.match(panel, />\s*Sesiones\s*</)
  },
)

test(
  '035-C alta mantiene numero titulo y fecha flexibles',
  () => {
    assert.match(panel, /Número opcional/)
    assert.match(panel, /Título opcional/)
    assert.match(panel, /type="number"/)
    assert.match(panel, /min="0"/)
    assert.match(panel, /type="datetime-local"/)
    assert.match(
      panel,
      /sessionNumber:[\s\S]*parsedSessionNumber/,
    )
    assert.doesNotMatch(
      panel,
      /required[\s\S]{0,100}(title|real-date|number)/,
    )
  },
)

test(
  '035-C lista respeta orden backend sin ordenar por numero o fecha',
  () => {
    assert.match(panel, /sessions\.map/)
    assert.doesNotMatch(
      panel,
      /\.sort\([\s\S]*(sessionNumber|realDate)/,
    )
  },
)

test(
  '035-C permite editar preparacion y completada pero no archivada',
  () => {
    assert.match(
      panel,
      /selectedSession\.status !==[\s\S]*'archived'/,
    )
    assert.match(panel, />\s*Editar\s*</)
    assert.match(
      panel,
      /session\.status ===[\s\S]*'archived'[\s\S]*return/,
    )
  },
)

test(
  '035-C finaliza explicitamente solo PREPARATION y archiva sin borrar',
  () => {
    assert.match(
      panel,
      /session\.status ===[\s\S]*'preparation'/,
    )
    assert.match(panel, /Marcar completada/)
    assert.match(panel, /gateway\.completeSession/)
    assert.match(panel, /gateway\.archiveSession/)
    assert.doesNotMatch(panel, /deleteSession|Eliminar/)
  },
)

test(
  '035-C detalle separa resumen notas privadas y fechas tecnicas',
  () => {
    for (const label of [
      'chronicle-session-workspace-summary-panel',
      'Resumen narrativo',
      'Notas privadas del Narrador',
      'Fecha real',
      'Creada',
      'Actualizada',
    ]) {
      assert.match(panel, new RegExp(label))
    }
  },
)

test(
  '035-C no adelanta tiempo real ni estados fuera del workspace aprobado',
  () => {
    assert.match(
      panel,
      /workspaceTab\([\s\S]*'dice',[\s\S]*'Tiradas'/,
    )
    assert.doesNotMatch(
      panel,
      /WebSocket|socket|polling|Sesión activa|Iniciar sesión/i,
    )
  },
)

test(
  '035-C reutiliza tokens visuales y responsive existente',
  () => {
    for (const token of [
      'var(--color-border-default)',
      'var(--color-surface-translucent)',
      'var(--radius-xl)',
      '@media (max-width: 900px)',
      '@media (max-width: 760px)',
    ]) {
      assert.match(
        styles,
        new RegExp(
          token.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
          ),
        ),
      )
    }
  },
)

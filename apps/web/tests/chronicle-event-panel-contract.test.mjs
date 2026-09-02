import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const panel = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleEventPanel.tsx',
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
    '../src/features/chronicles/components/chronicle-event-panel.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  '034-C integra Eventos/Línea temporal sólo con gate Narrador',
  () => {
    assert.match(
      detail,
      /canManageEvents/,
    )
    assert.match(
      detail,
      /currentMembership\?\.role[\s\S]*'narrator'/,
    )
    assert.match(
      detail,
      /<ChronicleEventPanel/,
    )
    assert.match(
      panel,
      /Eventos \/ Línea temporal/,
    )
  },
)

test(
  '034-C creación no obliga fecha exacta',
  () => {
    assert.match(
      panel,
      /Título/,
    )
    assert.match(
      panel,
      /Referencia temporal narrativa/,
    )
    assert.match(
      panel,
      /type="datetime-local"/,
    )
    assert.match(
      panel,
      /realDate:[\s\S]*isoFromLocalDateTime/,
    )
    assert.doesNotMatch(
      panel,
      /required[\s\S]{0,80}real-date/,
    )
  },
)

test(
  '034-C conserva el orden backend y SPEC-061 permite una lectura alternativa',
  () => {
    assert.match(panel, /visibleEvents\.map/)
    assert.match(panel, /timelineOrder/)
    assert.match(panel, /timelineView === 'narrative'/)
    assert.match(panel, /new Date\(left\.realDate\)/)
  },
)

test(
  '034-C reordena ACTIVE con Subir/Bajar y lista completa',
  () => {
    assert.match(
      panel,
      /const activeEvents[\s\S]*events\.filter/,
    )
    assert.match(
      panel,
      />\s*Subir\s*</,
    )
    assert.match(
      panel,
      />\s*Bajar\s*</,
    )
    assert.match(
      panel,
      /gateway\.reorderEvents/,
    )
    assert.match(
      panel,
      /eventIds:[\s\S]*reordered\.map/,
    )
  },
)

test(
  '034-C detalle muestra tiempo detalle privado y fechas técnicas',
  () => {
    for (const label of [
      'Consulta rápida',
      'Referencia temporal',
      'Fecha real',
      'Descripción',
      'Notas privadas',
      'Posición temporal',
      'Creado',
      'Actualizado',
    ]) {
      assert.match(
        panel,
        new RegExp(label),
      )
    }
  },
)

test(
  '034-C editar y archivar sólo se ofrecen a Eventos activos',
  () => {
    assert.match(
      panel,
      /selectedEvent\.status ===[\s\S]*'active'/,
    )
    assert.match(
      panel,
      />\s*Editar\s*</,
    )
    assert.match(
      panel,
      /Archivar/,
    )
    assert.match(
      panel,
      /event\.status !== 'active'/,
    )
  },
)

test(
  '034-C UX crea workspace por id con alta plegable y autoselección',
  () => {
    assert.match(
      panel,
      /showCreateForm[\s\S]*useState\(false\)/,
    )
    assert.match(
      panel,
      /aria-expanded=\{showCreateForm\}/,
    )
    assert.match(
      panel,
      /loadedEvents\.length > 0[\s\S]*gateway\.event\([\s\S]*chronicleId,[\s\S]*loadedEvents\[0\]\.id/,
    )
    assert.match(
      panel,
      /key=\{event\.id\}/,
    )
    assert.match(
      panel,
      /selectedEvent\?\.id ===[\s\S]*event\.id/,
    )
  },
)

test(
  '034-C UX usa listado izquierda detalle derecha y scroll acotado',
  () => {
    assert.match(
      styles,
      /grid-template-columns:[\s\S]*minmax\(16rem,[\s\S]*minmax\(0, 1fr\)/,
    )
    assert.match(
      styles,
      /max-height:\s*min\(32rem,\s*55vh\)/,
    )
    assert.match(
      styles,
      /height:\s*fit-content/,
    )
  },
)

test(
  '034-C archivados consultables pero no editables',
  () => {
    assert.match(
      panel,
      /chronicle-event-panel__item--\$\{event\.status\}/,
    )
    assert.match(
      panel,
      /gateway\.event/,
    )
    assert.match(
      panel,
      /selectedEvent\.status ===[\s\S]*'active'/,
    )
  },
)

test(
  '034-C no adelanta sharing ni relaciones fuera de SPEC-061',
  () => {
    assert.doesNotMatch(
      panel,
      /Compartir|characterId|npcId|locationId|sessionId|Planificado|Ocurrido|drag|drop|canvas|svg/i,
    )
  },
)

test(
  '034-C reutiliza tokens visuales y responsive existente',
  () => {
    for (const token of [
      'var(--color-border-default)',
      'var(--color-surface-translucent)',
      'var(--radius-xl)',
      '@media (max-width: 1100px)',
      '@media (max-width: 760px)',
    ]) {
      assert.ok(
        styles.includes(token),
        `Falta token/patrón visual: ${token}`,
      )
    }

    assert.doesNotMatch(
      styles,
      /#[0-9a-f]{3,8}\b|rgb\(/i,
    )
  },
)

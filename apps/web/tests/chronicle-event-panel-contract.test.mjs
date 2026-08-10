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
  '034-C lista usa orden backend y no ordena por fechas',
  () => {
    assert.match(
      panel,
      /events\.map/,
    )
    assert.match(
      panel,
      /timelineOrder/,
    )
    assert.doesNotMatch(
      panel,
      /\.sort\([\s\S]*realDate|\.sort\([\s\S]*narrativeTimeLabel/,
    )
  },
)

test(
  '034-C reordena ACTIVE con Subir/Bajar y lista completa',
  () => {
    assert.match(
      panel,
      /activeEvents/,
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
  '034-C consulta rápida muestra tiempo detalle privado y fechas técnicas',
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
      /event\.status ===[\s\S]*'active'/,
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
  '034-C no adelanta filtros sharing relaciones estados ni timeline gráfica',
  () => {
    assert.doesNotMatch(
      panel,
      /Buscar|Filtrar|Compartir|characterId|npcId|locationId|sessionId|Planificado|Ocurrido|drag|drop|canvas|svg/i,
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
      '@media (max-width: 900px)',
      '@media (max-width: 760px)',
    ]) {
      assert.match(
        styles,
        new RegExp(
          token
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      )
    }
  },
)

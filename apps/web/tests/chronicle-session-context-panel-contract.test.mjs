import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const panel =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleSessionContextPanel.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const sessionPanel =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleSessionPanel.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const styles =
  await readFile(
    new URL(
      '../src/features/chronicles/components/chronicle-session-context-panel.css',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '035-D Web integra contexto sólo dentro del detalle de Sesión seleccionada',
  () => {
    assert.match(
      sessionPanel,
      /selectedSession !== null[\s\S]*ChronicleSessionPreparationWorkspace/,
    )
    assert.match(
      sessionPanel,
      /chronicleId=\{chronicleId\}[\s\S]*session=\{selectedSession\}/,
    )
  },
)

test(
  '035-D Web carga contexto y tres catálogos existentes',
  () => {
    assert.match(
      panel,
      /gateway\.sessionContext/,
    )
    assert.match(
      panel,
      /gateway\.events/,
    )
    assert.match(
      panel,
      /gateway\.npcs/,
    )
    assert.match(
      panel,
      /gateway\.locations/,
    )
    assert.match(
      panel,
      /Promise\.all/,
    )
  },
)

test(
  '035-D Web muestra Eventos PNJ y Localizaciones y guarda un reemplazo único',
  () => {
    for (const label of [
      'Contexto de la Sesión',
      'Eventos',
      'PNJ',
      'Localizaciones',
      'Guardar contexto',
    ]) {
      assert.match(
        panel,
        new RegExp(label),
      )
    }

    assert.match(
      panel,
      /gateway\.replaceSessionContext/,
    )
    assert.match(
      panel,
      /eventIds,[\s\S]*npcIds,[\s\S]*locationIds/,
    )
  },
)

test(
  '035-D Web mantiene archivados vinculados visibles pero no ofrece archivados nuevos',
  () => {
    assert.match(
      panel,
      /loadedContext\.events[\s\S]*status ===[\s\S]*'archived'/,
    )
    assert.match(
      panel,
      /loadedContext\.npcs[\s\S]*status ===[\s\S]*'archived'/,
    )
    assert.match(
      panel,
      /loadedContext\.locations[\s\S]*status ===[\s\S]*'archived'/,
    )
    assert.match(
      panel,
      /events[\s\S]*status ===[\s\S]*'active'/,
    )
    assert.match(
      panel,
      /npcs[\s\S]*status ===[\s\S]*'active'/,
    )
    assert.match(
      panel,
      /locations[\s\S]*status ===[\s\S]*'active'/,
    )
  },
)

test(
  '035-D Web Sesión archivada queda sólo lectura',
  () => {
    assert.match(
      panel,
      /session\.status ===[\s\S]*'archived'/,
    )
    assert.match(
      panel,
      /fieldset[\s\S]*disabled=\{[\s\S]*readOnly/,
    )
    assert.match(
      panel,
      /sólo de consulta/i,
    )
  },
)

test(
  '035-D Web no introduce sharing tiempo real estados ni duplicación narrativa',
  () => {
    assert.doesNotMatch(
      panel,
      /WebSocket|socket|polling|shared|visibility|planned|occurred|description|narratorNotes/i,
    )
  },
)

test(
  '035-D Web usa tokens y conserva responsive',
  () => {
    for (const token of [
      'var(--color-border-subtle)',
      'var(--color-surface-emphasis)',
      'var(--radius-control)',
      '@media (max-width: 1100px)',
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

test(
  'UX Preparación presenta resumen real y tres columnas de contexto',
  () => {
    for (const marker of [
      'chronicle-session-context-panel__summary',
      'chronicle-session-context-panel__summary-card--events',
      'chronicle-session-context-panel__summary-card--npcs',
      'chronicle-session-context-panel__summary-card--locations',
      'chronicle-session-context-panel__group--events',
      'chronicle-session-context-panel__group--npcs',
      'chronicle-session-context-panel__group--locations',
    ]) {
      assert.match(
        panel,
        new RegExp(marker),
      )
    }

    assert.match(
      panel,
      /\{eventIds\.length\} seleccionados/,
    )
    assert.match(
      panel,
      /\{npcIds\.length\} seleccionados/,
    )
    assert.match(
      panel,
      /\{locationIds\.length\} seleccionadas/,
    )
  },
)

test(
  'UX Preparación conserva guardado real y no inventa búsqueda ni navegación',
  () => {
    assert.match(
      panel,
      /chronicle-session-context-panel__footer/,
    )
    assert.match(
      panel,
      /type="submit"[\s\S]*Guardar contexto/,
    )
    assert.doesNotMatch(
      panel,
      /type="search"|Buscar Eventos|Buscar PNJ|Buscar Localizaciones|Ver todos/,
    )
  },
)

test(
  'UX Preparación usa columnas compactas con scroll sólo en escritorio',
  () => {
    assert.match(
      styles,
      /\.chronicle-session-context-panel__form\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    )
    assert.match(
      styles,
      /\.chronicle-session-context-panel__options\s*\{[\s\S]*max-height:[\s\S]*overflow-y:\s*auto/,
    )
    assert.match(
      styles,
      /@media \(max-width:\s*1100px\)[\s\S]*\.chronicle-session-context-panel__options[\s\S]*max-height:\s*none[\s\S]*overflow-y:\s*visible/,
    )
  },
)

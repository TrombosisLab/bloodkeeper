import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const sessions =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleSessionPanel.tsx',
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
      '../src/features/chronicles/components/chronicle-session-panel.css',
      import.meta.url,
    ),
    'utf8',
  )

const contextStyles =
  await readFile(
    new URL(
      '../src/features/chronicles/components/chronicle-session-context-panel.css',
      import.meta.url,
    ),
    'utf8',
  )

test(
  'UX Sesiones separa lista compacta y workspace',
  () => {
    assert.match(
      sessions,
      /chronicle-session-panel__browser/,
    )
    assert.match(
      sessions,
      /chronicle-session-panel__workspace/,
    )
    assert.match(
      styles,
      /grid-template-columns:[\s\S]*minmax\(16rem,[\s\S]*minmax\(0, 1fr\)/,
    )
  },
)

test(
  'UX Sesiones ofrece cuatro areas internas exclusivas',
  () => {
    assert.match(
      sessions,
      /role="tablist"/,
    )

    for (const section of [
      'summary',
      'preparation',
      'attendance',
      'dice',
    ]) {
      assert.match(
        sessions,
        new RegExp(
          `chronicle-session-workspace-${section}-tab`,
        ),
      )
      assert.match(
        sessions,
        new RegExp(
          `chronicle-session-workspace-${section}-panel`,
        ),
      )
    }

    assert.match(
      sessions,
      /workspaceTab\([\s\S]*'summary',[\s\S]*'Resumen'/,
    )
    assert.match(
      sessions,
      /workspaceTab\([\s\S]*'preparation',[\s\S]*'Preparación'/,
    )
    assert.match(
      sessions,
      /workspaceTab\([\s\S]*'attendance',[\s\S]*'Asistencia'/,
    )
    assert.match(
      sessions,
      /workspaceTab\([\s\S]*'dice',[\s\S]*'Tiradas'/,
    )
  },
)

test(
  'UX Sesiones oculta alta hasta accion explicita',
  () => {
    assert.match(
      sessions,
      /showCreateForm/,
    )
    assert.match(
      sessions,
      /Preparar nueva sesión/,
    )
    assert.match(
      sessions,
      /aria-expanded=\{showCreateForm\}/,
    )
    assert.match(
      sessions,
      /showCreateForm \? \(/,
    )
  },
)

test(
  'UX Sesiones coloca contexto asistencia y dados en su area',
  () => {
    assert.match(
      sessions,
      /workspace-preparation-panel[\s\S]*ChronicleSessionPreparationWorkspace/,
    )
    assert.match(
      sessions,
      /workspace-attendance-panel[\s\S]*ChronicleSessionAttendancePanel/,
    )
    assert.match(
      sessions,
      /workspace-dice-panel[\s\S]*DiceRollPanel[\s\S]*DiceHistoryPanel/,
    )
  },
)

test(
  'UX Sesiones elimina los dados globales duplicados de ChronicleDetail',
  () => {
    assert.doesNotMatch(
      detail,
      /<DiceRollPanel/,
    )
    assert.doesNotMatch(
      detail,
      /<DiceHistoryPanel/,
    )
    assert.doesNotMatch(
      detail,
      /Historial de la crónica/,
    )
  },
)

test(
  'UX Preparacion presenta Eventos PNJ y Localizaciones como tres columnas en escritorio',
  () => {
    assert.match(
      contextStyles,
      /chronicle-session-context-panel__form[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/,
    )
    assert.match(
      contextStyles,
      /@media \(max-width: 1100px\)[\s\S]*grid-template-columns: 1fr/,
    )
  },
)

test(
  'UX Sesiones conserva responsive lista arriba workspace abajo',
  () => {
    assert.match(
      styles,
      /@media \(max-width: 1100px\)[\s\S]*chronicle-session-panel__workspace-layout[\s\S]*grid-template-columns: 1fr/,
    )
    assert.match(
      styles,
      /@media \(max-width: 760px\)/,
    )
  },
)

test(
  'UX Sesiones usa historial compacto y resumen agrupado',
  () => {
    assert.match(
      sessions,
      /Historial de sesiones/,
    )
    assert.match(
      sessions,
      /Datos de sesión/,
    )
    assert.match(
      sessions,
      /Resumen narrativo/,
    )
    assert.match(
      sessions,
      /Notas del Narrador/,
    )
    assert.match(
      styles,
      /max-height: 36rem/,
    )
    assert.match(
      styles,
      /overflow-y: auto/,
    )
    assert.match(
      styles,
      /repeat\(3, minmax\(0, 1fr\)\)/,
    )
  },
)


test(
  'UX Sesiones mantiene historial legible y reduce énfasis del contexto',
  () => {
    assert.match(
      styles,
      /browser-heading h3[\s\S]*white-space: nowrap/,
    )
    assert.match(
      contextStyles,
      /color-surface-translucent/,
    )
    assert.match(
      contextStyles,
      /:has\(input:checked\)[\s\S]*color-border-accent/,
    )
  },
)

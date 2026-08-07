import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL(
    '../src/components/ui/ViewStateStatus.tsx',
    import.meta.url,
  ),
  'utf8',
)

const dashboard = await readFile(
  new URL(
    '../src/features/dashboard/components/Dashboard.tsx',
    import.meta.url,
  ),
  'utf8',
)

const chronicles = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleListCreate.tsx',
    import.meta.url,
  ),
  'utf8',
)

test('SPEC-014 comparte únicamente loading y empty como estados pasivos', () => {
  assert.match(
    component,
    /ViewStateStatusKind[\s\S]*'loading'[\s\S]*'empty'/,
  )

  assert.doesNotMatch(
    component,
    /'error'|'permission'|'content'/,
  )
})

test('SPEC-014 centraliza la semántica accesible de estados pasivos', () => {
  assert.match(
    component,
    /data-view-state=\{state\}/,
  )
  assert.match(
    component,
    /role="status"/,
  )
  assert.match(
    component,
    /aria-live="polite"/,
  )
})

test('SPEC-014 mantiene una API presentacional pequeña', () => {
  assert.match(
    component,
    /readonly state: ViewStateStatusKind/,
  )
  assert.match(
    component,
    /readonly className\?: string/,
  )
  assert.match(
    component,
    /readonly children: ReactNode/,
  )

  assert.doesNotMatch(
    component,
    /gateway|fetch|retry|onRetry/,
  )
})

test('SPEC-014 tiene dos consumidores funcionales reales', () => {
  for (const source of [
    dashboard,
    chronicles,
  ]) {
    assert.match(
      source,
      /ViewStateStatus/,
    )
    assert.match(
      source,
      /state="loading"/,
    )
    assert.match(
      source,
      /state="empty"/,
    )
  }
})

test('SPEC-014 preserva los estilos locales de cada módulo', () => {
  assert.match(
    dashboard,
    /className="dashboard-message"/,
  )
  assert.match(
    chronicles,
    /className="chronicle-message"/,
  )

  assert.doesNotMatch(
    component,
    /import ['"].*\.css['"]/,
  )
})

test('SPEC-014 no absorbe error permisos contenido ni reintento', () => {
  assert.match(
    dashboard,
    /data-view-state="error"[\s\S]*role="alert"/,
  )
  assert.match(
    dashboard,
    />\s*Reintentar\s*</,
  )

  assert.match(
    chronicles,
    /failureState \?\? 'error'[\s\S]*role="alert"/,
  )

  assert.doesNotMatch(
    component,
    /role="alert"|assertive|Reintentar|permission|content/,
  )
})

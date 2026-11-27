import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(
  new URL('../src/features/chronicles/components/chronicle-summary-workspace.css', import.meta.url),
  'utf8',
)

test('los módulos de escritorio usan superficies oscuras diferenciadas', () => {
  const marker = css.indexOf('SUMMARY_DESKTOP_SURFACE_CONTRAST_V3')
  assert.ok(marker >= 0, 'falta el tratamiento de superficies v3')
  const desktop = css.slice(marker)
  assert.match(desktop, /@media\s*\(min-width:\s*1101px\)/)
  for (const selector of [
    '.summary-card--identity',
    '.summary-card--activity',
    '.summary-block-grid article:first-child',
    '.summary-block-grid article + article',
    '.summary-card--pulse',
    '.summary-card--progress',
    '.summary-card--session',
    '.summary-card--stories',
    '.summary-card--events',
  ]) {
    assert.ok(desktop.includes(selector), `falta el acento para ${selector}`)
  }
  assert.match(desktop, /background:\s*linear-gradient\(140deg, #192b29/)
  assert.match(desktop, /background:\s*linear-gradient\(120deg, #292215/)
})

test('los estilos nuevos quedan fuera del breakpoint móvil', () => {
  const marker = css.indexOf('SUMMARY_DESKTOP_SURFACE_CONTRAST_V3')
  const mobile = css.indexOf('@media(max-width:760px)')
  assert.ok(mobile >= 0 && mobile < marker)
  assert.match(css.slice(marker), /@media\s*\(min-width:\s*1101px\)/)
})

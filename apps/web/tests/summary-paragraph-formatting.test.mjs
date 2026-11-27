import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(
  new URL('../src/features/chronicles/components/chronicle-summary-workspace.css', import.meta.url),
  'utf8',
)

test('Premisa y Situación actual muestran los saltos de línea guardados', () => {
  assert.match(css, /RESUMEN_SALTOS_PREMISA_SITUACION_V1/)
  assert.match(
    css,
    /\.summary-premise-text\s*,\s*\.summary-card--overview\s+\.summary-block-grid\s*>\s*article:not\(\.summary-premise\)\s+p\s*\{[^}]*white-space\s*:\s*pre-wrap\s*;/s,
  )
})

test('los textos largos no desbordan sus tarjetas', () => {
  assert.match(
    css,
    /\.summary-premise-text\s*,\s*\.summary-card--overview\s+\.summary-block-grid\s*>\s*article:not\(\.summary-premise\)\s+p\s*\{[^}]*overflow-wrap\s*:\s*anywhere\s*;/s,
  )
})

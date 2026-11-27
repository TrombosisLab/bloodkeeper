import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(
  new URL('../src/features/chronicles/components/chronicle-shared-session-workspace.css', import.meta.url),
  'utf8',
)

test('el resumen narrativo conserva los saltos y separaciones de párrafo', () => {
  assert.match(css, /SESIONES_RESUMEN_CON_SALTOS_V1/)
  assert.match(
    css,
    /\.shared-session-workspace__detail\s*>\s*article\s+p\s*\{[^}]*white-space\s*:\s*pre-wrap\s*;/s,
  )
})

test('el texto largo puede partirse sin desbordar la tarjeta', () => {
  assert.match(
    css,
    /\.shared-session-workspace__detail\s*>\s*article\s+p\s*\{[^}]*overflow-wrap\s*:\s*anywhere\s*;/s,
  )
})

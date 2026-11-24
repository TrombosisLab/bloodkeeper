import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const dialog = await readFile(
  new URL(
    '../src/features/character-creation/components/advantages/AdvantageInstanceDetailsDialog.tsx',
    import.meta.url,
  ),
  'utf8',
)

const entry = await readFile(
  new URL('../src/main.tsx', import.meta.url),
  'utf8',
)

test('el cierre de limpieza de React StrictMode no cancela la apertura del editor', () => {
  assert.match(entry, /<React\.StrictMode>/)
  assert.match(dialog, /userRequestedCloseRef\.current = true/)
  assert.match(dialog, /function handleDialogClose\(\)[\s\S]*?if \(!userRequestedCloseRef\.current\)[\s\S]*?return[\s\S]*?onClose\(\)/)
  assert.match(dialog, /return \(\) => \{[\s\S]*?if \(dialog\?\.open\)[\s\S]*?dialog\.close\(\)/)
  assert.match(dialog, /onClose=\{handleDialogClose\}/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const component = readFileSync(new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url), 'utf8')

test('Jugar keeps every session in one accessible selector and removes the redundant rail', () => {
  assert.match(component, /aria-label="Seleccionar sesión"/)
  assert.match(component, /sessions\.map\(\(item: any\) => <option/)
  assert.match(component, /sessionStatus\(item\)/)
  assert.doesNotMatch(component, /chronicle-play-workspace__session-list|chronicle-play-workspace__rail/)
  assert.match(styles, /\.chronicle-play-workspace__session-switcher/)
  assert.match(styles, /grid-template-columns: minmax\(0, 1fr\) minmax\(16rem, 18\.5rem\)/)
})

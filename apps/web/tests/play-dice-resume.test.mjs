import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const playHub = readFileSync(
  new URL('../src/features/chronicles/components/PlayHub.tsx', import.meta.url),
  'utf8',
)
const playWorkspace = readFileSync(
  new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url),
  'utf8',
)

test('una recarga conserva la crónica abierta en Jugar en la pestaña actual', () => {
  assert.match(playHub, /bloodkeeper\.play\.selectedChronicleId/)
  assert.match(playHub, /useState<string \| null>\(readSelectedChronicleId\)/)
  assert.match(playHub, /sessionStorage\.setItem\(selectedChronicleStorageKey, chronicleId\)/)
  assert.match(playHub, /sessionStorage\.removeItem\(selectedChronicleStorageKey\)/)
})

test('una recarga restaura el lanzador de dados y el modo que estaba seleccionado', () => {
  assert.match(playWorkspace, /bloodkeeper\.play\.diceLauncher:/)
  assert.match(playWorkspace, /JSON\.stringify\(\{ open: true, mode: diceLauncherMode \}\)/)
  assert.match(playWorkspace, /useState\(restoredDiceLauncher\.open\)/)
  assert.match(playWorkspace, /useState<DiceLauncherMode>\(restoredDiceLauncher\.mode\)/)
  assert.match(playWorkspace, /sessionStorage\.removeItem\(diceLauncherStorageKey\(chronicleId\)\)/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const component = readFileSync(new URL('../src/features/chronicles/components/PlayHub.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/features/chronicles/components/play-hub.css', import.meta.url), 'utf8')

test('Jugar reveals the existing chronicle description on demand', () => {
  assert.match(component, /const description = chronicle\.description/)
  assert.match(component, /aria-expanded=\{isExpanded\}/)
  assert.match(component, /aria-controls=\{descriptionId\}/)
  assert.match(component, /setExpandedChronicleId\(isExpanded \? null : chronicle\.id\)/)
  assert.match(component, /Entrar a jugar/)
  assert.match(component, /className="play-hub__updated"/)
  assert.match(styles, /grid-template-rows:minmax\(0,1fr\) auto/)
  assert.match(styles, /\.play-hub__updated \{ display: block; margin-top:/)
  assert.match(styles, /-webkit-line-clamp:\s*3/)
  assert.match(styles, /\.play-hub__card\.is-expanded \.play-hub__description/)
  assert.match(styles, /repeat\(auto-fit,minmax\(min\(100%,24rem\),1fr\)\)/)
})

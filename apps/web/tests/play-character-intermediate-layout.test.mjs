import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const deployedPath = new URL('../src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url)
const sourceBundlePath = new URL('../bloodkeeper-web-8308b61-source/apps/web/src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url)
const cssPath = existsSync(deployedPath) ? deployedPath : sourceBundlePath
const css = readFileSync(cssPath, 'utf8')

test('play character card uses balanced columns at intermediate widths and stacks on narrow screens', () => {
  const intermediate = css.slice(css.indexOf('@media (max-width: 1320px)'), css.indexOf('@media (max-width: 980px)'))
  const narrow = css.slice(css.indexOf('@media (max-width: 860px)'), css.indexOf('@media (max-width: 620px)'))

  assert.match(intermediate, /grid-template-columns:\s*minmax\(12rem,\s*15rem\)\s+minmax\(0,\s*1fr\)/)
  assert.match(intermediate, /__character\s*>\s*header\s*\{\s*grid-column:\s*1\s*\/\s*-1;/)
  assert.match(intermediate, /__tracks,\s*\.chronicle-play-workspace__character\s*>\s*article\s*\{\s*grid-column:\s*2;/)
  assert.match(narrow, /@media\s*\(max-width:\s*860px\)/)
  assert.match(narrow, /__character\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
})

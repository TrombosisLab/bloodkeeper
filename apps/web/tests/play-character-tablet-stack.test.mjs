import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const deployedPath = new URL('../src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url)
const sourceBundlePath = new URL('../bloodkeeper-web-8308b61-source/apps/web/src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url)
const css = readFileSync(existsSync(deployedPath) ? deployedPath : sourceBundlePath, 'utf8')

test('narrow play character layout resets the spanning header and all children to one column', () => {
  const narrow = css.slice(css.indexOf('@media (max-width: 860px)'), css.indexOf('@media (max-width: 620px)'))
  assert.match(narrow, /__character\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(narrow, /__character\s*>\s*\*,\s*\.chronicle-play-workspace__character\s*>\s*header,\s*\.chronicle-play-character__tracks/)
  assert.match(narrow, /__character\s*>\s*header,\s*\.chronicle-play-character__tracks[^}]*grid-column:\s*auto;/s)
})

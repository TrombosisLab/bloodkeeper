import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const deployedCss = new URL('../src/styles/bloodkeeper-visual-system.css', import.meta.url)
const sourceBundleCss = new URL('../bloodkeeper-web-8308b61-source/apps/web/src/styles/bloodkeeper-visual-system.css', import.meta.url)
const css = readFileSync(existsSync(deployedCss) ? deployedCss : sourceBundleCss, 'utf8')

test('tablet-width character card overrides container query two-column layout', () => {
  const marker = css.lastIndexOf('PLAY_CHARACTER_CONTAINER_OVERRIDE_V3')
  assert.notEqual(marker, -1, 'missing narrow-tablet override')
  const override = css.slice(marker)
  assert.match(override, /@media\s*\(max-width:\s*860px\)/)
  assert.match(override, /#chronicle-section-play-panel\s+\.chronicle-play-workspace__character\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/s)
  assert.match(override, /\.chronicle-play-workspace__character\s*>\s*\*\s*\{[^}]*grid-column:\s*auto\s*!important;[^}]*grid-row:\s*auto\s*!important/s)
})

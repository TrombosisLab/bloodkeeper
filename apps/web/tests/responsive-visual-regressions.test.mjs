import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = new URL('../src/', import.meta.url)
const read = (path) => readFileSync(new URL(path, source), 'utf8')

test('character list switches to a compact tablet card before its columns collide', () => {
  const css = read('features/character-list/character-list.css')
  const fluidLayout = css.slice(css.lastIndexOf('CHARACTER_LIST_FLUID_LAYOUT_V2'))
  assert.match(css, /\.character-list-workspace\s*\{[^}]*container-type:\s*inline-size;[^}]*container-name:\s*character-list;/s)
  assert.match(fluidLayout, /@container\s+character-list\s*\(min-width:\s*72rem\)/)
  assert.match(fluidLayout, /grid-template-columns:\s*clamp\(4rem,\s*5cqi,\s*5\.25rem\)\s+minmax\(0,\s*1fr\)\s+auto/)
  assert.match(fluidLayout, /@container\s+character-list\s*\(min-width:\s*40rem\)\s+and\s+\(max-width:\s*71\.99rem\)/)
  assert.match(fluidLayout, /grid-template-columns:\s*clamp\(3\.5rem,\s*7cqi,\s*4\.25rem\)\s+minmax\(0,\s*1fr\);[^}]*grid-template-rows:\s*auto\s+auto;/s)
  assert.match(fluidLayout, /\.character-list-card__identity\s*\{[^}]*grid-row:\s*1;/s)
  assert.match(fluidLayout, /\.character-list-card__concept\s*\{[^}]*grid-row:\s*2;/s)
  assert.match(fluidLayout, /\.character-list-card__updated\s*\{[^}]*grid-row:\s*3;/s)
  assert.match(fluidLayout, /\.character-list-card__actions\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*grid-row:\s*2;/s)
  assert.match(fluidLayout, /\.character-list-card__body\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s)
  assert.match(fluidLayout, /@container\s+character-list\s*\(max-width:\s*39\.99rem\)/)
  assert.match(fluidLayout, /\.character-list-card__actions\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*grid-row:\s*2;/s)
  assert.doesNotMatch(fluidLayout, /grid-row:\s*1\s*\/\s*span\s*2/)
})

test('character sheet exposes all sections in a visible two-column mobile grid', () => {
  const css = read('styles/character-sheet-redesign.css')
  const mobile = css.slice(css.lastIndexOf('CHARACTER_SHEET_MOBILE_NAV_FINAL_V1'))
  assert.match(mobile, /@media\s*\(max-width:\s*820px\)/)
  assert.match(mobile, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important/)
  assert.match(mobile, /overflow:\s*visible\s*!important/)
  assert.match(mobile, /text-overflow:\s*clip\s*!important/)
})

test('manual role labels use two mobile columns without splitting inside words', () => {
  const css = read('features/manual/components/manual-page.css')
  assert.equal((css.match(/MOBILE_MANUAL_TABS_V1/g) || []).length, 1)
  assert.match(css, /\.manual-role-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s)
  assert.match(css, /\.manual-role-tabs button\s*\{[^}]*word-break:\s*normal;[^}]*hyphens:\s*none;/s)
  assert.doesNotMatch(css, /\.manual-role-tabs button\s*\{[^}]*overflow-wrap:\s*anywhere/s)
})

test('chronicle tabs give the final mobile tab a deliberate full-width row', () => {
  const css = read('features/chronicles/components/chronicle-detail.css')
  assert.match(css, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.chronicle-detail__section-tabs\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(css, /\.chronicle-detail button\.chronicle-detail__section-tab:last-child\s*\{\s*grid-column:\s*1\s*\/\s*-1;/)
})

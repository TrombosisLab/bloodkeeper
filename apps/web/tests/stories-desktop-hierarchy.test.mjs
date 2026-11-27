import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/features/chronicles/components/chronicle-story-workspace.css', import.meta.url), 'utf8')
const component = readFileSync(new URL('../src/features/chronicles/components/ChronicleSharedStoryWorkspace.tsx', import.meta.url), 'utf8')
const desktop = css.split('/* HISTORIAS_COMPARTIDAS_ESCRITORIO_JERARQUIA_V1 */')[1]

test('desktop Stories hierarchy is scoped above the mobile breakpoint', () => {
  assert.ok(desktop)
  assert.match(desktop, /@media \(min-width: 1251px\)/)
  assert.match(desktop, /\.story-card__shared-heading/)
  assert.match(desktop, /\.story-card__shared-meta/)
  assert.match(desktop, /\.story-detail__header/)
})

test('desktop story view removes duplicate metrics and gives each content group a restrained accent', () => {
  assert.match(desktop, /\.story-sidebar \.story-summary\s*\{\s*display:\s*none/)
  assert.match(desktop, /\.story-shared-summary\s*\{[^}]*border-left: 3px solid #b99a66/s)
  assert.match(desktop, /\.story-milestones\s*\{[^}]*border-left: 3px solid var\(--story-red-bright\)/s)
  assert.match(desktop, /\.story-shared-lifecycle\s*\{[^}]*border-left: 3px solid #5ba69e/s)
  assert.match(desktop, /\.story-shared-summary > p\s*\{[^}]*min-height: 0/s)
})

test('mobile reading rules and story selection behavior remain intact', () => {
  assert.match(css, /HISTORIAS_COMPARTIDAS_MOVIL_LECTURA_V1/)
  assert.match(css, /@media \(max-width: 820px\)/)
  assert.match(component, /onClick=\{\(\) => openStory\(story\.id\)\}/)
  assert.match(component, /story-card__shared-heading/)
})

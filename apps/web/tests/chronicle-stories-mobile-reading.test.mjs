import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const shared = await readFile(resolve(root, 'src/features/chronicles/components/ChronicleSharedStoryWorkspace.tsx'), 'utf8')
const styles = await readFile(resolve(root, 'src/features/chronicles/components/chronicle-story-workspace.css'), 'utf8')

test('historias compartidas alterna entre lista y detalle solo en móvil', () => {
  assert.match(shared, /story-workspace--mobile-detail/)
  assert.match(shared, /onClick=\{\(\) => openStory\(story\.id\)\}/)
  assert.match(shared, /className="story-mobile-back" onClick=\{returnToStoryList\}/)
  assert.match(shared, /matchMedia\('\(max-width: 820px\)'\)/)
  assert.match(shared, /scrollIntoView\(\{ block: 'start', behavior: 'smooth' \}\)/)
  assert.match(shared, /setMilestonesExpanded\(false\)/)
  assert.match(styles, /story-workspace--shared:not\(\.story-workspace--mobile-detail\) \.story-detail/)
  assert.match(styles, /story-workspace--shared\.story-workspace--mobile-detail \.story-browser/)
  assert.match(styles, /@media \(max-width: 820px\)/)
})

test('las tarjetas móviles separan título y tipo y reducen metadatos repetidos', () => {
  assert.match(shared, /story-card__shared-heading/)
  assert.match(shared, /story-card__shared-meta/)
  assert.match(styles, /\.story-card__shared-heading \{ display: grid; gap: 4px/)
  assert.match(styles, /\.story-card__progress \{ display: none; \}/)
  assert.match(styles, /\.story-browser__shared-notice \{ display: none; \}/)
})

test('el detalle móvil permite desplegar hitos y conserva el diseño de escritorio', () => {
  assert.match(shared, /aria-expanded=\{milestonesExpanded\}/)
  assert.match(shared, /aria-controls="shared-story-milestones"/)
  assert.match(shared, /milestonesExpanded \? 'Ocultar hitos' : `Ver los \$\{selected\.progress\.total\} hitos`/)
  assert.match(shared, /story-sidebar/)
  assert.match(styles, /\.story-workspace--shared \.story-milestones__track\.is-expanded \{ display: grid; \}/)
  assert.match(styles, /\.story-workspace--shared\.story-workspace--mobile-detail \.story-sidebar/)
})

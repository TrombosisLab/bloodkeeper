import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import test from 'node:test'
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'features', 'notebook', 'components')
const read = (name) => readFileSync(join(root, name), 'utf8')
test('SPEC-071 conserva el motor y el wrapper', () => { const reducer = read('notebook-page-transition.ts'); const hook = read('useNotebookPageTransition.ts'); const component = read('NotebookPageTransition.tsx'); const workspace = read('NotebookPhaseTwo.tsx'); const css = read(existsSync(join(root, 'notebook-journal-v4.css')) ? 'notebook-journal-v4.css' : 'notebook-phase2.css'); for (const marker of ['preparing', 'turning-forward', 'turning-backward', 'settling', 'reduced-motion']) assert.match(reducer, new RegExp(marker)); assert.match(hook, /durationMs = 440/); assert.match(component, /nb2-page-face--front/); assert.match(component, /nb2-page-face--back/); assert.doesNotMatch(component, /innerHTML/); assert.match(workspace, /activeKey=\{section\}/); assert.match(css, /SPEC071_ANIMATED_NOTEBOOK_V2/) })
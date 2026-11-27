import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const summary = await readFile(resolve(root, 'src/features/chronicles/components/ChronicleSummaryWorkspace.tsx'), 'utf8')
const styles = await readFile(resolve(root, 'src/features/chronicles/components/chronicle-summary-activity-formatting.css'), 'utf8')

test('Actividad reciente conserva los saltos de párrafo de su descripción', () => {
  assert.match(summary, /import ['"]\.\/chronicle-summary-activity-formatting\.css['"]/)
  assert.match(summary, /<small className="summary-activity-description">\{item\.description\}<\/small>/)
  assert.match(styles, /\.summary-activity-description\s*\{\s*white-space:\s*pre-line;/)
})

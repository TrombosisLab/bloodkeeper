import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const summary = await readFile(resolve(root, 'src/features/chronicles/components/ChronicleSummaryWorkspace.tsx'), 'utf8')

test('solo narradores ven los enlaces a la cronología de sucesos', () => {
  const gatedLinks = summary.match(/\{canManage \? \([\s\S]*?\) : null\}/g) ?? []
  assert.ok(gatedLinks.some((block) => block.includes("onNavigate('timeline')") && block.includes('Ver toda la actividad')))
  assert.ok(gatedLinks.some((block) => block.includes("onNavigate('timeline')") && block.includes('Ver todos los sucesos')))
})

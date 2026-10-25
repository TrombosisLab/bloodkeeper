import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8')
test('administration exposes scoped identity panel with explicit save, reset and preview cleanup',()=>{
  const panel = read('src/features/administration/components/ApplicationIdentityPanel.tsx')
  assert.match(read('src/features/administration/components/AdministrationHub.tsx'),/<ApplicationIdentityPanel \/>/)
  for (const expected of ['Guardar icono para todos','Restaurar predeterminado','window.confirm','URL.revokeObjectURL','If-Match','response.status === 409','credentials: \'include\'']) assert.ok(panel.includes(expected),expected)
  assert.match(panel,/no subas retratos/i)
})
test('HTTP remains usable and branding failure is isolated from application startup',()=>{
  const branding = read('src/features/installation/application-identity.ts')
  assert.match(branding,/catch\s*\{/)
  assert.doesNotMatch(branding,/location\.(assign|replace|href)|serviceWorker|localStorage|indexedDB/)
  assert.match(read('index.html'),/href="\/api\/application\/manifest.webmanifest"/)
  assert.match(read('index.html'),/href="\/icons\/bloodkeeper-192.png"/)
  assert.match(read('src/main.tsx'),/void refreshApplicationIdentity\(\)/)
})

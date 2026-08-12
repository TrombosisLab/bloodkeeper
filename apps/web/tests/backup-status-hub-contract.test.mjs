import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
const hub = await readFile(new URL('../src/features/administration/components/AdministrationHub.tsx', import.meta.url),'utf8')
const gateway = await readFile(new URL('../src/features/administration/infrastructure/backup-status.api.ts', import.meta.url),'utf8')

test('042-A muestra estado de backups en Administración', () => {
  assert.match(hub,/Copias de seguridad/)
  assert.match(hub,/Última copia correcta/)
  assert.match(hub,/Integridad/)
  assert.match(hub,/Archivo/)
  assert.match(gateway,/\/api\/administration\/backups\/status/)
})

test('042-B mantiene restauración y ejecución de host fuera de la Web', () => {
  assert.match(hub,/restauración[\s\S]*exclusivamente por SSH/i)
  assert.doesNotMatch(
    `${hub}\n${gateway}`,
    /restoreBackup|\/backups\/restore|docker compose|\/var\/run\/docker\.sock|child_process|spawn\(/i,
  )
})

test(
  '042-B ofrece creación manual con confirmación explícita',
  () => {
    assert.match(hub, /Crear copia ahora/)
    assert.match(hub, /window\.confirm/)
    assert.match(hub, /restauración[\s\S]*exclusivamente por SSH/i)
    assert.doesNotMatch(
      hub,
      /Restaurar copia|restoreBackup|\/backups\/restore/i,
    )
  },
)

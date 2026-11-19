import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../../', import.meta.url)
async function source(path) {
  return await readFile(new URL(path, root), 'utf8')
}

test('portable backup manifest records format and source revision', async () => {
  const worker = await source('apps/backup/worker.sh')
  const compose = await source('compose.deploy.yaml')
  assert.match(worker, /format=bloodkeeper_portable_database_v1/)
  assert.match(worker, /source_revision=\$\{BLOODKEEPER_SOURCE_REVISION:-unknown\}/)
  assert.match(compose, /BLOODKEEPER_SOURCE_REVISION: \$\{BLOODKEEPER_SOURCE_REVISION:-unknown\}/)
})

test('host export validates a successful backup from today and preserves the Docker copy', async () => {
  const exporter = await source('scripts/export-portable-backups.sh')
  assert.match(exporter, /lastSuccessfulBackupAt/)
  assert.match(exporter, /integrity.*ok/)
  assert.match(exporter, /sha256sum -c/)
  assert.match(exporter, /checksum_line.*name/)
  assert.match(exporter, /database\.dump/)
  assert.match(exporter, /portable-compose\.sh" cp backup-worker:\/backups\//)
  assert.doesNotMatch(exporter, /portable-compose\.sh" rm/)
  assert.match(exporter, /--require-mounted/)
})

test('host scheduling is optional, UTC-based, serialized, and reversible', async () => {
  const installer = await source('scripts/install-host-backup-export.sh')
  assert.match(installer, /--enable/)
  assert.match(installer, /--disable/)
  assert.match(installer, /CRON_TZ=UTC/)
  assert.match(installer, /flock -n/)
  assert.match(installer, /--require-mounted/)
  assert.match(installer, /rm -f -- "\$CRON_FILE"/)
})

test('portable restore verifies in staging, requires confirmation, and keeps rollback data', async () => {
  const restore = await source('scripts/restore-portable-backup.sh')
  assert.match(restore, /--verify/)
  assert.match(restore, /checksum exterior no válido/)
  assert.match(restore, /--apply/)
  assert.match(restore, /--confirm/)
  assert.match(restore, /RESTAURAR/)
  assert.match(restore, /bk_restore_/)
  assert.match(restore, /bk_previous_/)
  assert.match(restore, /bk_failed_/)
  assert.match(restore, /npx prisma migrate deploy/)
  assert.match(restore, /api\/health/)
  assert.match(restore, /PRE_RESTORE_BACKUP/)
  assert.match(restore, /merge-base --is-ancestor/)
  assert.doesNotMatch(restore, /tar -xOzf "\$ARCHIVE" \.\/database\.dump \|[^\n]*pg_restore --list/)
  assert.match(restore, /tar -xOzf "\$ARCHIVE" \.\/database\.dump \|[^\n]*pg_restore --username="\$USERNAME" --dbname="\$TEMP_DATABASE"/)
  assert.doesNotMatch(restore, /pg_restore --list -/)
  assert.doesNotMatch(restore, /--exit-on-error -/)
  assert.doesNotMatch(restore, /docker compose down --volumes/)
})

test('clean-server instructions use the portable flow and distinguish historical scripts', async () => {
  const recovery = await source('docs/RECOVERY.md')
  assert.match(recovery, /## Recuperación desde servidor limpio/)
  assert.match(recovery, /BLOODKEEPER_SKIP_ADMIN=1 \.\/install\.sh/)
  assert.match(recovery, /restore-portable-backup\.sh --verify/)
  assert.match(recovery, /restore-portable-backup\.sh --apply/)
  assert.match(recovery, /no se usan para una instalación portable nueva/)
  assert.match(recovery, /no se requiere crontab para las copias internas/i)
})

test('interactive and retry admin creation preserve credentials through sudo', async () => {
  const installer = await source('install.sh')
  const adminScript = await source('scripts/create-initial-admin.sh')
  for (const script of [installer, adminScript]) {
    assert.match(script, /--preserve-env=ADMIN_USERNAME,ADMIN_DISPLAY_NAME,ADMIN_PASSWORD/)
    assert.match(script, /-e ADMIN_USERNAME[\s\S]*-e ADMIN_DISPLAY_NAME[\s\S]*-e ADMIN_PASSWORD/)
  }
  assert.match(installer, /admin_compose=\([\s\S]*"\$\{COMPOSE\[@\]:1\}"[\s\S]*\)/)
  assert.match(adminScript, /sudo docker info/)
})

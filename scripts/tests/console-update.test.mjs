import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const script = fileURLToPath(new URL('../update-from-github.sh', import.meta.url))
const installer = fileURLToPath(new URL('../install-update-command.sh', import.meta.url))
const installation = fileURLToPath(new URL('../../install.sh', import.meta.url))
const helper = fileURLToPath(new URL('./console-update-mock.mjs', import.meta.url))
const bash = process.env.BLOODKEEPER_TEST_BASH || '/bin/bash'
const normalized = (value) => value.replaceAll('\\', '/')
const functions = ['id', 'git', 'docker', 'flock', 'mkdir', 'mktemp', 'cat', 'cp', 'mv', 'rm', 'tee']
  .map((name) => `${name}() { "$TEST_NODE_BIN" "$TEST_HELPER" ${name} "$@"; }`).join('\n')
const harness = `${functions}\nsource "$TEST_SCRIPT" --repo "$TEST_REPO" --user tester --compose-file "$TEST_REPO/compose.yaml" --env-file "$TEST_REPO/.env"`

function fixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bloodkeeper-update-test-'))
  fs.mkdirSync(path.join(root, '.git'))
  fs.writeFileSync(path.join(root, '.git', 'mock-head'), 'a'.repeat(40))
  fs.writeFileSync(path.join(root, '.env'), 'TEST_ONLY=true\n')
  fs.writeFileSync(path.join(root, 'compose.yaml'), 'services: {}\n')
  fs.writeFileSync(path.join(root, 'failure.txt'), '')
  context.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}
function run(root, extra = {}) {
  return spawnSync(bash, ['-c', harness], {
    timeout: 60000,
    encoding: 'utf8',
    env: {
      ...process.env,
      TEST_REPO: normalized(root), TEST_SCRIPT: normalized(script), TEST_HELPER: normalized(helper),
      TEST_NODE_BIN: normalized(process.execPath), BLOODKEEPER_UPDATE_BACKUP_DIR: normalized(path.join(root, 'backups')),
      ...extra,
    },
  })
}
function calls(root) {
  const file = path.join(root, 'calls.jsonl')
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : []
}
const deployed = (root) => path.join(root, '.git', 'bloodkeeper-deployed-version')
const pending = (root) => path.join(root, '.git', 'bloodkeeper-update-pending')

test('shell syntax is valid for updater, registration and installation hook', () => {
  const result = spawnSync(bash, ['-n', script], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  for (const file of [installer, installation]) {
    const syntax = spawnSync(bash, ['-n', file], { encoding: 'utf8' })
    assert.equal(syntax.status, 0, syntax.stderr)
  }
})

test('successful update preserves main and origin and records only the healthy version', (context) => {
  const root = fixture(context)
  const result = run(root)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(fs.readFileSync(deployed(root), 'utf8').trim(), 'b'.repeat(40))
  assert.equal(fs.existsSync(pending(root)), false)
  const trace = calls(root)
  assert.ok(trace.some((call) => call.command === 'git' && call.args[0] === 'fetch' && call.args[1] === 'https://github.com/TrombosisLab/bloodkeeper.git'))
  assert.ok(!trace.some((call) => call.command === 'git' && ['checkout', 'reset', 'push', 'remote'].includes(call.args[0])))
  const backup = path.join(root, 'backups', fs.readdirSync(path.join(root, 'backups'))[0])
  assert.ok(fs.statSync(path.join(backup, 'database.dump')).size > 0)
  assert.ok(fs.existsSync(path.join(backup, 'environment.env')))
})

test('a build failure after download can be retried without new Git changes', (context) => {
  const root = fixture(context)
  fs.writeFileSync(deployed(root), 'a'.repeat(40))
  fs.writeFileSync(path.join(root, 'failure.txt'), 'build')
  const first = run(root)
  assert.notEqual(first.status, 0, first.stdout)
  assert.equal(fs.readFileSync(path.join(root, '.git', 'mock-head'), 'utf8'), 'b'.repeat(40))
  assert.equal(fs.readFileSync(deployed(root), 'utf8'), 'a'.repeat(40))
  assert.equal(fs.existsSync(pending(root)), true)
  fs.writeFileSync(path.join(root, 'failure.txt'), '')
  const second = run(root)
  assert.equal(second.status, 0, second.stdout + second.stderr)
  assert.equal(fs.readFileSync(deployed(root), 'utf8').trim(), 'b'.repeat(40))
  assert.equal(fs.existsSync(pending(root)), false)
  assert.equal(calls(root).filter((call) => call.command === 'docker' && call.args.includes('build')).length, 2)
})

for (const failure of ['compile', 'migration', 'health']) {
  test(`${failure} failure is not recorded as a deployed version`, (context) => {
    const root = fixture(context)
    fs.writeFileSync(path.join(root, 'failure.txt'), failure)
    const result = run(root)
    assert.notEqual(result.status, 0, result.stdout)
    assert.equal(fs.existsSync(deployed(root)), false)
    assert.equal(fs.existsSync(pending(root)), true)
    if (failure === 'migration' || failure === 'compile') {
      assert.ok(!calls(root).some((call) => call.command === 'docker' && call.args.includes('up') && call.args.includes('web')))
    }
  })
}

test('an already deployed healthy version does not rebuild or migrate', (context) => {
  const root = fixture(context)
  fs.writeFileSync(path.join(root, '.git', 'mock-head'), 'b'.repeat(40))
  fs.writeFileSync(deployed(root), 'b'.repeat(40))
  const result = run(root)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.ok(!calls(root).some((call) => call.command === 'docker' && ['build', 'run', 'up'].some((action) => call.args.includes(action))))
})

for (const [name, extra] of [['untracked local files', { TEST_DIRTY: '?? local-note.txt\n' }], ['another update holding the lock', { TEST_BUSY: '1' }], ['a different branch', { TEST_BRANCH: 'feature' }], ['the wrong operating user', { TEST_USER: 'someone-else' }]]) {
  test(`${name} blocks download and deployment`, (context) => {
    const root = fixture(context)
    const result = run(root, extra)
    assert.notEqual(result.status, 0, result.stdout)
    assert.ok(!calls(root).some((call) => call.command === 'docker' || call.args[0] === 'fetch'))
  })
}

test('local commits not present in GitHub block integration and deployment', (context) => {
  const root = fixture(context)
  const result = run(root, { TEST_DIVERGED: '1' })
  assert.notEqual(result.status, 0, result.stdout)
  assert.ok(!calls(root).some((call) => call.args[0] === 'merge' || call.args.includes('build')))
})

for (const failure of ['backup', 'verify-dump']) {
  test(`${failure} failure blocks Git integration, migrations and deployment`, (context) => {
    const root = fixture(context)
    fs.writeFileSync(path.join(root, 'failure.txt'), failure)
    const result = run(root)
    assert.notEqual(result.status, 0, result.stdout)
    assert.equal(fs.readFileSync(path.join(root, '.git', 'mock-head'), 'utf8'), 'a'.repeat(40))
    assert.equal(fs.existsSync(pending(root)), false)
    assert.ok(!calls(root).some((call) => call.args[0] === 'merge' || call.args.includes('build') || call.args.includes('prisma')))
  })
}

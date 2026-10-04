import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const [command, ...args] = process.argv.slice(2)
const root = process.env.TEST_REPO
const headPath = path.join(root, '.git', 'mock-head')
const target = 'b'.repeat(40)
const failure = fs.readFileSync(path.join(root, 'failure.txt'), 'utf8').trim()
const write = (value) => process.stdout.write(String(value))
const fail = () => { process.exitCode = 1 }
if (command === 'git' || command === 'docker') {
  fs.appendFileSync(path.join(root, 'calls.jsonl'), JSON.stringify({ command, args }) + '\n')
}
switch (command) {
  case 'id': write(args[0] === '-u' ? '0\n' : (process.env.TEST_USER || 'tester') + '\n'); break
  case 'flock': if (process.env.TEST_BUSY === '1') fail(); break
  case 'git': {
    switch (args[0]) {
      case 'branch': write((process.env.TEST_BRANCH || 'main') + '\n'); break
      case 'status': write(process.env.TEST_DIRTY || ''); break
      case 'fetch': break
      case 'merge-base': if (process.env.TEST_DIVERGED === '1') fail(); break
      case 'rev-parse':
        if (args[1] === '--is-inside-work-tree') write('true\n')
        else if (args[1] === '--git-path') write(path.join(root, '.git', args[2]).replaceAll('\\', '/') + '\n')
        else write((args[1] === 'FETCH_HEAD' ? target : fs.readFileSync(headPath, 'utf8')) + '\n')
        break
      case 'merge': fs.writeFileSync(headPath, args.at(-1)); break
      case 'archive': write('test-code-archive'); break
      case 'config': write('git@github.com:TrombosisLab/bloodkeeper.git\n'); break
      case 'update-ref': break
      default: throw new Error(`Unexpected git: ${args.join(' ')}`)
    }
    break
  }
  case 'docker': {
    const action = args.find((arg) => ['config', 'build', 'exec', 'run', 'up', 'ps'].includes(arg))
    if (action === 'build' && failure === 'build') fail()
    else if (action === 'run' && args.includes('prisma') && failure === 'migration') fail()
    else if (action === 'run' && args.some((arg) => arg.includes('npm run build')) && failure === 'compile') fail()
    else if (action === 'exec' && args.some((arg) => arg.includes('pg_dump'))) {
      if (failure === 'backup') fail()
      else write('test-database-dump')
    }
    else if (action === 'exec' && args.includes('pg_restore')) {
      for await (const chunk of process.stdin) { /* Consume the test dump. */ }
      if (failure === 'verify-dump') fail()
    }
    else if (action === 'exec' && args.includes('api')) write(failure === 'health' ? '{"status":"ok","database":"error"}\n' : '{"status":"ok","database":"ok"}\n')
    break
  }
  case 'mkdir': for (const directory of args.filter((arg) => arg !== '-p')) fs.mkdirSync(directory, { recursive: true }); break
  case 'mktemp': {
    const template = args.at(-1)
    const directory = template.replace(/X+$/, crypto.randomBytes(6).toString('hex'))
    fs.mkdirSync(directory)
    write(directory.replaceAll('\\', '/') + '\n')
    break
  }
  case 'cat': for (const file of args) write(fs.readFileSync(file)); break
  case 'cp': {
    const filtered = args.filter((arg) => arg !== '--')
    fs.copyFileSync(filtered[0], filtered[1]); break
  }
  case 'mv': fs.renameSync(args[0], args[1]); break
  case 'rm': for (const file of args.filter((arg) => !arg.startsWith('-'))) fs.rmSync(file, { force: true }); break
  case 'tee': {
    const file = args.at(-1)
    for await (const chunk of process.stdin) { fs.appendFileSync(file, chunk); process.stdout.write(chunk) }
    break
  }
  default: throw new Error(`Unexpected command: ${command}`)
}

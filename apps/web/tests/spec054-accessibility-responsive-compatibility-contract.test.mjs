import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const webRoot = process.cwd()
const srcRoot = path.join(webRoot, 'src')

function read(relativePath) {
  return fs.readFileSync(path.join(webRoot, relativePath), 'utf8')
}

function walk(root, extension) {
  const result = []

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name)

    if (entry.isDirectory()) {
      result.push(...walk(fullPath, extension))
      continue
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      result.push(fullPath)
    }
  }

  return result
}

function readAll(files) {
  return files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
}

test('SPEC-054 conserva idioma y viewport responsive', () => {
  const html = read('index.html')

  assert.match(html, /<html\s+lang=["']es["']/)
  assert.match(
    html,
    /<meta\s+name=["']viewport["']\s+content=["']width=device-width,\s*initial-scale=1\.0["']\s*\/?>/,
  )
})

test('SPEC-054 mantiene controles esenciales sobre HTML semántico y teclado nativo', () => {
  const tsxFiles = walk(srcRoot, '.tsx')
  const suspicious = []

  for (const file of tsxFiles) {
    const source = fs.readFileSync(file, 'utf8')
    const pattern = /<(div|span|p|li)\b[^>]*\bonClick=/g

    for (const match of source.matchAll(pattern)) {
      const start = match.index ?? 0
      const end = source.indexOf('>', start)
      const tag = source.slice(start, end >= 0 ? end + 1 : start + 300)

      const keyboardComplete =
        tag.includes('role=') &&
        tag.includes('tabIndex=') &&
        (tag.includes('onKeyDown=') || tag.includes('onKeyUp='))

      if (!keyboardComplete) {
        suspicious.push(`${path.relative(webRoot, file)}: ${tag.slice(0, 180)}`)
      }
    }
  }

  assert.deepEqual(suspicious, [])
})

test('SPEC-054 conserva foco visible transversal', () => {
  const designSystem = read('src/styles/design-system.css')
  const foundations = read('src/styles/ui-foundations.css')
  const css = readAll(walk(srcRoot, '.css'))
  const focusCount = (css.match(/:focus-visible/g) ?? []).length

  assert.match(designSystem, /:focus-visible/)
  assert.match(foundations, /:focus-visible/)
  assert.ok(focusCount >= 10, `focus-visible insuficiente: ${focusCount}`)
})

test('SPEC-054 mantiene estados críticos comprensibles sin depender sólo del color', () => {
  const damage = read('src/components/ui/DamageTracker.tsx')
  const humanity = read(
    'src/features/character-sheet/components/HumanityTrack.tsx',
  )
  const hunger = read(
    'src/features/character-sheet/components/HungerTrack.tsx',
  )
  const dice = read(
    'src/features/dice/components/DiceRollPanel.tsx',
  )

  assert.match(damage, /aria-label=/)
  assert.match(damage, /aria-hidden=/)
  assert.match(humanity, /aria-label=/)
  assert.match(hunger, /aria-label=/)
  assert.match(hunger, /activo|vacío/)
  assert.match(dice, /aria-label=/)
  assert.match(dice, /aria-live=/)
})

test('SPEC-054 conserva cobertura responsive y objetivos táctiles explícitos', () => {
  const css = readAll(walk(srcRoot, '.css'))
  const mediaCount = (css.match(/@media/g) ?? []).length
  const touchTargetCount = (
    css.match(/min-height\s*:\s*(?:4[0-9]|[5-9][0-9])px/g) ?? []
  ).length

  assert.ok(mediaCount >= 20, `media queries insuficientes: ${mediaCount}`)
  assert.ok(
    touchTargetCount > 0,
    'No se detectan objetivos táctiles con min-height >= 40px',
  )
})

test('SPEC-054 mantiene toolchain moderno sin capa legacy específica', () => {
  const tsconfig = JSON.parse(read('tsconfig.json'))
  const packageJson = JSON.parse(read('package.json'))

  assert.equal(tsconfig.compilerOptions?.target, 'ES2022')

  const viteVersion =
    packageJson.dependencies?.vite ??
    packageJson.devDependencies?.vite

  const legacyPluginVersion =
    packageJson.dependencies?.['@vitejs/plugin-legacy'] ??
    packageJson.devDependencies?.['@vitejs/plugin-legacy']

  assert.ok(viteVersion)
  assert.equal(legacyPluginVersion, undefined)
})

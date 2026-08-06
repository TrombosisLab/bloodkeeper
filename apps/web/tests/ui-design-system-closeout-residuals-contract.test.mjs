import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testsDirectory = path.dirname(fileURLToPath(import.meta.url))
const srcDirectory = path.resolve(testsDirectory, '../src')

const designSystemPath = path.join(
  srcDirectory,
  'styles/design-system.css',
)
const baseStylesPath = path.join(
  srcDirectory,
  'styles/base-and-sheet-header.css',
)
const creationStylesPath = path.join(
  srcDirectory,
  'styles/character-creation.css',
)

const designSystem = await readFile(
  designSystemPath,
  'utf8',
)
const baseStyles = await readFile(
  baseStylesPath,
  'utf8',
)
const creationStyles = await readFile(
  creationStylesPath,
  'utf8',
)

async function collectFiles(directory, extension) {
  const entries = await readdir(
    directory,
    { withFileTypes: true },
  )
  const files = []

  for (const entry of entries) {
    const target = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(
        ...(await collectFiles(target, extension)),
      )
    } else if (entry.name.endsWith(extension)) {
      files.push(target)
    }
  }

  return files.sort()
}

const cssFiles = await collectFiles(srcDirectory, '.css')
const tsxFiles = await collectFiles(srcDirectory, '.tsx')

const cssSources = new Map(
  await Promise.all(
    cssFiles.map(async (file) => [
      file,
      await readFile(file, 'utf8'),
    ]),
  ),
)
const tsxSources = new Map(
  await Promise.all(
    tsxFiles.map(async (file) => [
      file,
      await readFile(file, 'utf8'),
    ]),
  ),
)

test('SPEC-010 elimina exclusivamente los cinco colores residuales auditados', () => {
  assert.equal(
    baseStyles.includes('rgb(114 183 131 / 0.1)'),
    false,
  )
  assert.equal(
    baseStyles.includes('#392d2f'),
    false,
  )
  assert.equal(
    baseStyles.match(
      /var\(--color-success-halo\)/g,
    )?.length,
    1,
  )
  assert.equal(
    baseStyles.match(
      /var\(--color-group-border\)/g,
    )?.length,
    4,
  )
})

test('SPEC-010 resuelve los controles sin alterar el bloque CSS cerrado', () => {
  assert.match(
    creationStyles,
    /\.advantage-rating-control button\s*\{[^{}]*border:\s*1px solid var\(--color-border\);[^{}]*color:\s*var\(--color-text\);[^{}]*\}/s,
  )
  assert.match(
    creationStyles,
    /\.advantage-rating-control button:hover:not\(:disabled\)\s*\{[^{}]*border-color:\s*var\(--color-text\);[^{}]*\}/s,
  )
  assert.match(
    designSystem,
    /--color-border:\s*var\(--color-control-border\);/,
  )
  assert.match(
    designSystem,
    /--color-text:\s*var\(--color-control-text\);/,
  )
})

test('SPEC-010 añade un único token reutilizable de halo de éxito', () => {
  assert.equal(
    designSystem.match(
      /--color-success-halo\s*:/g,
    )?.length,
    1,
  )
  assert.match(
    designSystem,
    /--color-success-halo:\s*rgb\(114 183 131 \/ 0\.1\);/,
  )
  assert.doesNotMatch(
    '--color-success-halo',
    /(?:character|sheet|creation|advantage|identity|header)/i,
  )
})

test('SPEC-010 conserva fuera de alcance el gradiente visual previo', () => {
  assert.equal(
    baseStyles.includes('rgb(88 20 28 / 0.18)'),
    true,
  )
  assert.match(
    baseStyles,
    /radial-gradient\([\s\S]*rgb\(88 20 28 \/ 0\.18\)[\s\S]*transparent 30rem[\s\S]*\)/,
  )
})

test('SPEC-010 no conserva variables CSS globalmente inexistentes sin fallback', () => {
  const definitions = new Set()
  const cssDefinition = /(--[\w-]+)\s*:/g
  const tsxDefinition = /['"](--[\w-]+)['"]\s*:/g

  for (const source of cssSources.values()) {
    for (const match of source.matchAll(cssDefinition)) {
      definitions.add(match[1])
    }
  }

  for (const source of tsxSources.values()) {
    for (const match of source.matchAll(tsxDefinition)) {
      definitions.add(match[1])
    }
  }

  for (const [file, source] of cssSources) {
    for (const match of source.matchAll(
      /var\(\s*(--[\w-]+)([^)]*)\)/g,
    )) {
      const [, token, tail] = match

      if (tail.includes(',')) {
        continue
      }

      assert.equal(
        definitions.has(token),
        true,
        `Variable sin definición en ${path.relative(srcDirectory, file)}: ${token}`,
      )
    }
  }
})

test('SPEC-010 mantiene este cierre fuera de un identificador C.3 inventado', () => {
  assert.doesNotMatch(
    designSystem + baseStyles + creationStyles,
    /SPEC-010\.C\.3/,
  )
})

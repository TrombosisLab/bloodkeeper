import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('los contadores de subgrupo comparten una columna alineada', () => {
  assert.match(
    styles,
    /\.advantages-catalog-subgroup > summary\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(5\.5rem,\s*12rem\) 1rem;/,
  )
  assert.match(
    styles,
    /\.advantages-catalog-subgroup > summary small\s*\{[^}]*text-align:\s*right;/,
  )
  assert.match(
    styles,
    /\.advantages-catalog-subgroup > summary::after\s*\{[^}]*margin-left:\s*0;/,
  )
})

test('la columna de contadores sigue alineada en móviles', () => {
  assert.match(
    styles,
    /@media \(max-width: 760px\)[\s\S]*?\.advantages-catalog-subgroup > summary\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(5\.5rem,\s*8rem\) 1rem;/,
  )
})

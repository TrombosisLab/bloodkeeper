import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = async (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('el manual móvil abre primero el perfil que corresponde a la cuenta', async () => {
  const page = await source('../src/features/manual/components/ManualPage.tsx')

  assert.match(page, /matchMedia\('\(max-width: 760px\)'\)/)
  assert.match(page, /authenticatedUser\.roles\.includes\('player'\)[\s\S]*authenticatedUser\.roles\.includes\('narrator'\)/)
  assert.match(page, /isMobile \? preferredRole : 'admin'/)
  assert.match(page, /defaultOpen=\{isMobile && role !== 'admin' \? index === 1 : index < 2\}/)
})

test('las pestañas internas de Crónicas permiten descubrir y recorrer su contenido en móvil', async () => {
  const styles = await source('../src/features/chronicles/components/chronicle-detail.css')
  const mobileRule = styles.match(/@media \(max-width: 720px\) \{([\s\S]*?)\n\}/)?.[1] ?? ''

  assert.match(mobileRule, /\.chronicle-detail__section-tabs \{[\s\S]*overflow-x: auto/)
  assert.match(mobileRule, /scrollbar-width: thin/)
  assert.match(mobileRule, /scroll-snap-type: x proximity/)
  assert.match(mobileRule, /min-width: max-content/)
})

test('Crónicas compacta sus contadores y evita duplicar la destacada solo en móvil', async () => {
  const page = await source('../src/features/chronicles/components/ChronicleListCreate.tsx')
  const styles = await source('../src/features/chronicles/components/chronicle-list-create.css')
  const mobileRule = styles.match(/@media \(max-width: 760px\) \{([\s\S]*?)\n\}/)?.[1] ?? ''

  assert.match(page, /chronicle-card-list-item--continue-duplicate/)
  assert.match(page, /chronicle-continue--single-mobile/)
  assert.match(mobileRule, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(mobileRule, /\.chronicle-card-list-item--continue-duplicate \{\s*display: none/)
  assert.match(mobileRule, /\.chronicle-continue--single-mobile \{\s*display: none/)
})

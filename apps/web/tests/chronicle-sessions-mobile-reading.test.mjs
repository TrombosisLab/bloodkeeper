import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(new URL('../src/features/chronicles/components/ChronicleSharedSessionWorkspace.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/features/chronicles/components/chronicle-shared-session-workspace.css', import.meta.url), 'utf8')

test('en móvil, la vista inicial prioriza la lista y separa el detalle', () => {
  assert.match(component, /mobileDetailOpen/)
  assert.match(component, /shared-session-workspace__browser\$\{mobileDetailOpen \? ' is-mobile-hidden' : ''\}/)
  assert.match(component, /shared-session-workspace__detail\$\{mobileDetailOpen \? '' : ' is-mobile-hidden'\}/)
  assert.match(styles, /\.shared-session-workspace__browser\.is-mobile-hidden,\.shared-session-workspace__detail\.is-mobile-hidden\{display:none\}/)
})

test('elegir una sesión abre el detalle y permite regresar a la lista', () => {
  assert.match(component, /setSelectedId\(session\.id\); setMobileDetailOpen\(true\)/)
  assert.match(component, /className="shared-session-workspace__back" onClick=\{\(\) => setMobileDetailOpen\(false\)\}/)
  assert.match(component, /<span aria-hidden="true">←<\/span> Sesiones/)
})

test('la navegación y el cambio de disposición solo afectan a móvil', () => {
  assert.match(component, /matchMedia\('\(max-width: 760px\)'\)/)
  assert.match(styles, /\.shared-session-workspace__back\{display:none\}/)
  assert.match(styles, /@media\(max-width:760px\)\{[\s\S]*\.shared-session-workspace__back\{display:inline-flex/)
  assert.match(styles, /\.shared-session-workspace\{display:grid;grid-template-columns:minmax\(15rem,18rem\) minmax\(0,1fr\)/)
})

test('los títulos de sesión pueden leerse en varias líneas en móvil', () => {
  assert.match(styles, /\.shared-session-workspace li button strong\{display:-webkit-box;[\s\S]*white-space:normal/)
  assert.match(styles, /min-height:3\.75rem/)
})

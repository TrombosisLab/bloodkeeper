import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('la guía inicial, plegable, describe las tres secciones que ve Chuela', () => {
  assert.match(component, /<details className="research-room-guide">\s*<summary>¿Primera vez aquí\? Guía rápida<\/summary>/)
  for (const section of ['Pizarra', 'Cronología', 'Archivo']) assert.match(component, new RegExp(`<h3>${section}</h3>`))
  assert.doesNotMatch(component, /<h3>Relaciones<\/h3>/)
  assert.match(component, /Empieza por elegir una crónica/)
  assert.match(component, /Pulsa «\+ Nueva nota»/)
  assert.match(component, /tus conexiones de «Mi vista» son privadas/)
  assert.match(component, /vínculos oficiales aparecen como referencia/)
})

test('cada pestaña explica acciones concretas y no afirma que las sesiones sean reales', () => {
  assert.match(component, /Elige las fichas que quieres tener a mano/)
  assert.match(component, /Consulta las sesiones, abre sus resúmenes/)
  assert.match(component, /Busca personas, lugares y anotaciones\. Filtra por tipo/)
  assert.doesNotMatch(component, /Las sesiones reales de la crónica/)
})

test('el diseño de la guía respeta teclado y tamaños de escritorio, tablet y móvil', () => {
  assert.match(styles, /research-room-guide > summary[\s\S]*min-height: 44px[\s\S]*cursor: pointer/)
  assert.match(styles, /research-room-guide > summary:focus-visible/)
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(styles, /@media \(max-width: 1100px\)[\s\S]*research-room-guide__steps[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*research-room-guide__steps[\s\S]*minmax\(0, 1fr\)/)
})

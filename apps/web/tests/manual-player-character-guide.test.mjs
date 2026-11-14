import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const manual = readFileSync(
  fileURLToPath(new URL('../src/features/manual/components/ManualPage.tsx', import.meta.url)),
  'utf8',
)
const styles = readFileSync(
  fileURLToPath(new URL('../src/features/manual/components/manual-page.css', import.meta.url)),
  'utf8',
)

test('player manual includes a clear, ordered character creation walkthrough', () => {
  assert.match(manual, /Guía rápida: crear un personaje desde cero/)
  assert.match(manual, /Piensa en una idea sencilla/)
  assert.match(manual, /Identidad: ponle cara a la idea/)
  assert.match(manual, /Atributos: qué se le da bien por naturaleza/)
  assert.match(manual, /Habilidades: qué ha aprendido/)
  assert.match(manual, /Ventajas y defectos: apoyos y complicaciones/)
  assert.match(manual, /Humanidad, revisión y guardado/)
  assert.match(manual, /Ya en partida: usa la ficha como referencia/)
})

test('walkthrough distinguishes Session 0 humans from standard vampire creation', () => {
  assert.match(manual, /Comenzar como humano \(Sesión 0\)/)
  assert.match(manual, /Creación vampírica estándar/)
  assert.match(manual, /Sangre y después Disciplinas/)
  assert.match(manual, /continúa directamente con Ventajas/)
  assert.match(manual, /manual-guide-steps/)
  assert.match(styles, /\.manual-guide-steps/)
})

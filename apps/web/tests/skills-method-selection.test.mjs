import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const skillsStep = await readFile(
  new URL('../src/features/character-creation/components/SkillsStep.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('cambiar el perfil no reasigna las Habilidades ya elegidas', () => {
  const start = skillsStep.indexOf('function changeMethod(')
  const end = skillsStep.indexOf('\n  function randomize()', start)
  assert.ok(start >= 0 && end > start, 'No se encontró el selector de perfil')
  const changeMethod = skillsStep.slice(start, end)

  assert.match(changeMethod, /onMethodChange\(nextMethod\)/)
  assert.doesNotMatch(changeMethod, /onChange|randomizeSkills/)
  assert.match(skillsStep, /onChange\(\s*randomizeSkills\(method\)/)
})

test('cada perfil explica su propósito y muestra las cantidades objetivo', () => {
  assert.match(skillsStep, /Generalista/)
  assert.match(skillsStep, /10 a nivel 1 · 8 a nivel 2 · 1 a nivel 3 · 8 sin puntos/)
  assert.match(skillsStep, /7 a nivel 1 · 5 a nivel 2 · 3 a nivel 3 · 12 sin puntos/)
  assert.match(skillsStep, /3 a nivel 1 · 3 a nivel 2 · 3 a nivel 3 · 1 a nivel 4 · 17 sin puntos/)
  assert.match(skillsStep, /El perfil define las cantidades objetivo, pero no mueve tus puntos/)
  assert.match(skillsStep, /Reparto aleatorio válido/)
})

test('las cantidades objetivo quedan visibles y legibles en las tarjetas', () => {
  assert.match(styles, /\.skill-method-card small\s*\{[\s\S]*?display: block/)
  assert.match(styles, /\.skill-method-card--active small/)
  assert.match(styles, /\.skills-step__method-guidance/)
})

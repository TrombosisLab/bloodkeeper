import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const introduction = await readFile(
  new URL('../src/features/character-creation/components/SkillsIntroductionStep.tsx', import.meta.url),
  'utf8',
)
const wizard = await readFile(
  new URL('../src/features/character-creation/components/CharacterCreationWizard.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('la introducción explica niveles, repartos y especializaciones', () => {
  for (const text of [
    'Tienes 27 habilidades.',
    'Sin puntos',
    'No entrenada',
    'Generalista',
    '10 básicas · 8 competentes · 1 destacada · 8 sin puntos',
    '7 básicas · 5 competentes · 3 destacadas · 12 sin puntos',
    '3 básicas · 3 competentes · 3 destacadas · 1 experta · 17 sin puntos',
    'Reparto aleatorio válido',
    'Tienes una especialización libre para cualquiera de las 27',
    'requieren además una propia cuando',
    'Academicismo, Artesanía, Ciencia e Interpretación',
    'Las del Tipo de Depredador se añaden aparte.',
  ]) {
    assert.ok(introduction.includes(text), `Falta explicación: ${text}`)
  }
  assert.match(introduction, /no\\s+consumen esos cupos\\./)
  assert.match(introduction, /skills-introduction__profiles/)
  assert.match(introduction, /skills-introduction__specialties/)
})

test('la explicación es un subpaso solo del recorrido guiado y se puede volver a abrir', () => {
  assert.match(
    wizard,
    /journeyMode === 'guided' &&\s*currentStepId === 'skills' &&\s*!hasCompletedSkillsIntroduction/,
  )
  assert.match(
    wizard,
    /if \(skillsIntroductionActive\) \{[\s\S]*?setHasCompletedSkillsIntroduction\(true\)[\s\S]*?return/,
  )
  assert.match(
    wizard,
    /currentStepId === 'skills' &&\s*hasCompletedSkillsIntroduction[\s\S]*?setHasCompletedSkillsIntroduction\(false\)/,
  )
  assert.match(wizard, /<SkillsIntroductionStep\s*\/>/)
  assert.match(wizard, /Continuar: elegir perfil/)
  assert.match(wizard, /skillsIntroductionActive \? \(/)
})

test('la guía conserva la legibilidad en pantallas estrechas', () => {
  assert.match(styles, /\.skills-introduction__levels\s*\{[\s\S]*?grid-template-columns/)
  assert.match(styles, /\.skills-introduction__profiles\s*\{[\s\S]*?grid-template-columns/)
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.skills-introduction__levels/)
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.skills-introduction__profiles/)
})

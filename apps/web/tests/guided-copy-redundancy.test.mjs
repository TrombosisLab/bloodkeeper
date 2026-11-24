import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const base = '../src/features/character-creation/components/'
const [wizard, attributes, skills, specialties, humanity, advantages, placeholder] = await Promise.all([
  readFile(new URL(base + 'CharacterCreationWizard.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'AttributesStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'SkillsStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'SkillSpecialtiesEditor.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'HumanityIntroductionStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'AdvantagesIntroductionStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'CreationStepPlaceholder.tsx', import.meta.url), 'utf8'),
])

test('el recorrido no repite instrucciones visibles en el menú ni en el pie', () => {
  assert.doesNotMatch(wizard, /creation-guided-note|Una pregunta cada vez|muestra tu progreso general/)
  assert.match(wizard, /guidedIdentityActive[\s\S]*?Paso \$\{guidedIdentityStageIndex/)
  assert.doesNotMatch(wizard, /Paso \$\{currentStep\.number\} de \$\{activeCreationSteps\.length\}/)
  assert.doesNotMatch(placeholder, /Fase \{step\.number\}/)
})

test('los contadores de Atributos aparecen una sola vez', () => {
  assert.doesNotMatch(attributes, /<small>\{index \+ 1\} de \{categories\.length\}<\/small>/)
  assert.match(attributes, /categoryLabels\[activeCategory\][\s\S]*?categories\.indexOf\(activeCategory\) \+ 1/)
})

test('la explicación de Habilidades se conserva en modo directo y no se repite en guiado', () => {
  assert.match(skills, /guided\?: boolean/)
  assert.match(skills, /!guided \? \([\s\S]*option\.description[\s\S]*option\.target/)
  assert.match(skills, /guided \? \([\s\S]*Reparto objetivo/)
  assert.match(skills, /!guided \? \([\s\S]*El perfil define las cantidades objetivo/)
  assert.match(specialties, /guided[\s\S]*El contador muestra las especialidades disponibles/)
  assert.match(specialties, /Academicismo, Artesanía, Ciencia e Interpretación/)
})

test('las introducciones no repiten instrucciones que aparecen en el paso siguiente', () => {
  assert.doesNotMatch(humanity, /humanity-introduction__note/)
  assert.doesNotMatch(advantages, /advantages-introduction__note/)
})

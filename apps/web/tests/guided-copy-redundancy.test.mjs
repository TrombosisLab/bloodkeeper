import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const base = '../src/features/character-creation/components/'
const predatorSummary = await readFile(new URL(base + 'PredatorTypeAdvantageSummary.tsx', import.meta.url), 'utf8')
const modeSelector = await readFile(new URL(base + 'CharacterCreationModeSelector.tsx', import.meta.url), 'utf8')
const predatorConfiguration = await readFile(new URL(base + 'PredatorTypeConfiguration.tsx', import.meta.url), 'utf8')
const [wizard, attributes, skills, specialties, humanity, advantages, placeholder, identity, bloodIntro, blood, disciplines, powerSelector, advantagesStep] = await Promise.all([
  readFile(new URL(base + 'CharacterCreationWizard.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'AttributesStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'SkillsStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'SkillSpecialtiesEditor.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'HumanityIntroductionStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'AdvantagesIntroductionStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'CreationStepPlaceholder.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'IdentityStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'BloodIntroductionStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'BloodStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'DisciplinesStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'DisciplinePowerSelector.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'AdvantagesStep.tsx', import.meta.url), 'utf8'),
])

test('el recorrido no repite instrucciones visibles en el menú ni en el pie', () => {
  assert.doesNotMatch(wizard, /creation-guided-note|Una pregunta cada vez|muestra tu progreso general|Recorrido guiado · construirás/)
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


test('elimina repeticiones entre fases y no muestra texto interno de validación', () => {
  assert.doesNotMatch(identity, /Identidad · paso|clan-card-selector__help/)
  assert.doesNotMatch(bloodIntro, /Decisión anterior|ya se decidió en Identidad/)
  assert.match(blood, /guided\?: boolean/)
  assert.match(blood, /!guided && \([\s\S]*Ajusta la Potencia de Sangre y el Hambre iniciales/)
  assert.match(wizard, /<BloodStep\s+guided=\{journeyMode === 'guided'\}/)
  assert.doesNotMatch(modeSelector, /Primero elegiste el recorrido|Ahora decide desde qué punto comienza la historia/)
  assert.match(modeSelector, /Esta elección define si la historia empieza como vampiro/)
  assert.doesNotMatch(predatorConfiguration, /fases posteriores consumirán este resultado/)
  assert.match(predatorSummary, /Estas Ventajas y Defectos vienen incluidas[\s\S]*?7 para Ventajas[\s\S]*?2 para Defectos/)
  assert.doesNotMatch(predatorSummary, /origen Tipo de Depredador|presupuesto ordinario 7\/2/)
  assert.doesNotMatch(disciplines, /Esta concesión no consume el reparto inicial/)
  assert.doesNotMatch(powerSelector, /temporal para validar|discipline-power-selector__help/)
  assert.doesNotMatch(advantages, /Las concesiones del Tipo de Depredador se indican aparte/)
  assert.doesNotMatch(advantagesStep, /Elige los rasgos que mejor representen/)
  assert.doesNotMatch(humanity, /Cada principio se vincula a una persona/)
})

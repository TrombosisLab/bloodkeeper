import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = (name) => readFile(
  new URL(`../src/features/chronicles/components/${name}`, import.meta.url),
  'utf8',
)

const [
  detail,
  summary,
  participants,
  sharedSessions,
  dossier,
  story,
  eventPanel,
] = await Promise.all([
  component('ChronicleDetail.tsx'),
  component('ChronicleSummaryWorkspace.tsx'),
  component('ChronicleParticipantsWorkspace.tsx'),
  component('ChronicleSharedSessionWorkspace.tsx'),
  component('ChronicleNpcDeepDossier.tsx'),
  component('ChronicleStoryWorkspace.tsx'),
  component('ChronicleEventPanel.tsx'),
])

test('los participantes consultan sesiones compartidas sin abrir el panel privado', () => {
  assert.match(detail, /canViewSessions\s*=\s*currentMembership !== undefined/)
  assert.match(detail, /<ChronicleSharedSessionWorkspace/)
  assert.match(sharedSessions, /La preparación, las notas privadas y la gestión de asistencia permanecen reservadas al Narrador/)
})

test('el resumen del jugador evita recursos exclusivos del Narrador', () => {
  assert.match(summary, /canManage[\s\S]*gateway\.events\(chronicle\.id\)[\s\S]*Promise\.resolve\(\[\]/)
  assert.match(summary, /canManage \? <section className="summary-card summary-card--pending"/)
  assert.match(summary, /canManage \? <section className="summary-card summary-card--critical"/)
})

test('la asociación de personajes sólo actúa sobre el participante autenticado', () => {
  assert.match(participants, /authenticatedUserId/)
  assert.match(participants, /selected\.userId === authenticatedUserId/)
  assert.match(participants, /Acceso efectivo/)
  assert.doesNotMatch(participants, /permission-switch/)
})

test('el dossier de PNJ usa atributos, disciplinas graduadas y fichas múltiples', () => {
  for (const contract of [
    /Atributos V5/,
    /Disciplinas y poderes/,
    /disciplineDetails/,
    /TokenEditor/,
    /Intro, coma y punto y coma/,
  ]) assert.match(dossier, contract)
})

test('las relaciones de historia abren el selector contextual correcto', () => {
  for (const focus of ['sessions', 'events', 'cast', 'locations']) {
    assert.match(story, new RegExp(`openContext\\('${focus}'\\)`))
    assert.match(story, new RegExp(`contextFocus === '${focus}'`))
  }
})

test('el alta de sucesos reinicia el formulario y no conserva errores anteriores', () => {
  assert.match(eventPanel, /setOperationError\(null\)[\s\S]*setCreateForm\(emptyForm\)[\s\S]*setShowCreateForm/)
})

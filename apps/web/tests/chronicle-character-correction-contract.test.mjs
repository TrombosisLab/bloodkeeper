import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const componentUrl = new URL('../src/features/chronicles/components/ChronicleCharacterCorrectionPanel.tsx', import.meta.url)
const gatewayUrl = new URL('../src/features/character-sheet/infrastructure/chronicle-character-read.api.ts', import.meta.url)
const participantsUrl = new URL('../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx', import.meta.url)

test('narrator correction exposes dots, merits/flaws and a required reason, not operational state or XP', async () => {
  const component = await readFile(componentUrl, 'utf8')
  assert.match(component, /Atributos/)
  assert.match(component, /Habilidades/)
  assert.match(component, /Disciplinas/)
  assert.match(component, /Añadir Mérito/)
  assert.match(component, /Añadir Defecto/)
  assert.match(component, /Motivo de la corrección/)
  assert.doesNotMatch(component, /setExperience|setHunger|setHumanity|experienceGateway|bloodPotency/)
})

test('correction editor is a sectioned modal with an always-available audited save', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(new URL('../src/features/chronicles/components/chronicle-character-correction.css', import.meta.url), 'utf8'),
  ])
  assert.match(component, /role="dialog" aria-modal="true"/)
  assert.match(component, /aria-label="Apartados de la ficha"/)
  assert.match(component, /\['attributes', 'Atributos'\]/)
  assert.match(component, /\['skills', 'Habilidades'\]/)
  assert.match(component, /\['disciplines', 'Disciplinas'\]/)
  assert.match(component, /\['advantages', 'Méritos, defectos y trasfondos'\]/)
  assert.match(component, /activeSection === 'advantages'/)
  assert.match(component, /character-correction-reason/)
  assert.match(component, /Guardar corrección/)
  assert.match(component, /event\.key === 'Escape'/)
  assert.match(component, /onClose/)
  assert.match(styles, /position: fixed/)
  assert.match(styles, /max-height: min\(92dvh/)
  assert.match(styles, /@media \(max-width: 700px\)/)
})

test('correction uses a chronicle-scoped PATCH and is surfaced only in narrator participant workspace', async () => {
  const [gateway, participants] = await Promise.all([
    readFile(gatewayUrl, 'utf8'),
    readFile(participantsUrl, 'utf8'),
  ])
  assert.match(gateway, /method: 'PATCH'/)
  assert.match(gateway, /\/correction/)
  assert.match(participants, /canManage && character/)
  assert.match(participants, /ChronicleCharacterCorrectionPanel/)
  assert.match(participants, /setSelectedId\(item\.id\); setOpenedCharacterId\(null\); setCorrectionOpen\(false\)/)
  assert.match(participants, /openedCharacterId !== null && openedCharacterId === character\?\.characterId/)
})

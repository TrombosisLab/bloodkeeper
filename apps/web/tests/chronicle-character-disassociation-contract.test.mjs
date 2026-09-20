import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const detail = readFileSync(
  new URL('../src/features/chronicles/components/ChronicleDetail.tsx', import.meta.url),
  'utf8',
)
const participants = readFileSync(
  new URL('../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx', import.meta.url),
  'utf8',
)

test('el propietario puede iniciar una desasociación explícita sin borrar el personaje', () => {
  assert.match(detail, /ownAssociatedCharacter/)
  assert.match(detail, /includeOwnAssociatedCharacter/)
  assert.match(detail, /Desasociar personaje/)
  assert.match(detail, /chronicleId:\s*null/)
  assert.match(detail, /disassociateCharacter\(ownAssociatedCharacter, false\)/)
})

test('la desasociación con historial exige confirmación y conserva la ficha', () => {
  assert.match(detail, /pendingConfirmationCharacterId/)
  assert.match(detail, /Confirmar desasociación/)
  assert.match(detail, /disassociateCharacter\(ownAssociatedCharacter, true\)/)
  assert.match(detail, /Se conservará su historial/)
  assert.doesNotMatch(participants, /triggerDisassociation/)
})

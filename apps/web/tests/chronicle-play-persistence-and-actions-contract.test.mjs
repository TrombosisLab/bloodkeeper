import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const play = await readFile(new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url), 'utf8')
const detail = await readFile(new URL('../src/features/chronicles/components/ChronicleDetail.tsx', import.meta.url), 'utf8')
const dossier = await readFile(new URL('../src/features/chronicles/components/ChronicleNpcDeepDossier.tsx', import.meta.url), 'utf8')

test('Jugar persiste notas y abre la ficha real', () => {
  assert.match(play, /chronicleSessionParticipantNotesApi\.load/)
  assert.match(play, /chronicleSessionParticipantNotesApi\.update/)
  assert.match(play, /onOpenCharacter\(characterId\)/)
  assert.doesNotMatch(play, /setSavedPrivate\(true\)/)
  assert.doesNotMatch(play, /La ficha completa se abrirá desde Personajes/)
})

test('Jugar no conserva botones decorativos sin acción', () => {
  assert.match(play, /setShowAllSessions/)
  assert.doesNotMatch(play, /<button type="button" disabled=\{!session\}>Abrir sesión<\/button>/)
  assert.match(detail, /onOpenCharacter=\{onOpenCharacter\}/)
})

test('el alta contextual solo aparece al desplegarse', () => {
  assert.match(detail, /canManageParticipants\s*\?\s*\(/)
  assert.match(detail, /showParticipantAdmin\s*\?\s*\(/)
})

test('las disciplinas aceptan listas y normalizan datos antiguos', () => {
  assert.match(dossier, /disciplineNames/)
  assert.match(dossier, /split\(\/\[,;.\\n\]\+\//)
  assert.match(dossier, /Ej\. Celeridad, Potencia/)
})

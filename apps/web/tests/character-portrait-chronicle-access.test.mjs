import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8')

const [portrait, identity, sheet, persisted, participants, chronicleSpace] =
  await Promise.all([
    source('../src/features/character-sheet/components/CharacterPortrait.tsx'),
    source('../src/features/character-sheet/components/CharacterIdentity.tsx'),
    source('../src/features/character-sheet/components/CharacterSheet.tsx'),
    source('../src/features/character-sheet/components/PersistedCharacterSheet.tsx'),
    source('../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx'),
    source('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx'),
  ])

test('la ficha narrativa solicita la foto mediante el acceso de la crónica', () => {
  assert.match(portrait, /readImageUrl\?: string/)
  assert.match(portrait, /readImageUrl \?\? `\/api\/characters\/\$\{characterId\}\/portrait`/)
  assert.match(identity, /readImageUrl=\{portraitReadImageUrl\}/)
  assert.match(sheet, /portraitReadImageUrl=\{portraitReadImageUrl\}/)
  assert.match(persisted, /portraitReadImageUrl=\{portraitReadImageUrl\}/)
  assert.match(participants, /assets\/CHARACTER\/\$\{encodeURIComponent\(openedCharacterId\)\}\/image/)
  assert.match(participants, /readOnly/)
})

test('la Sala de Investigación resuelve imágenes contextuales desde el catálogo autorizado', () => {
  assert.match(chronicleSpace, /context\?\.imageCandidates/)
  assert.match(chronicleSpace, /chronicleNoteContextImage\(selectedNote, context\?\.imageCandidates \|\| \[\]\)/)
  assert.match(chronicleSpace, /selectedNoteContextImage\.imageUrl/)
})

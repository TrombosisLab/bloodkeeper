import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const identity = fs.readFileSync(new URL('../src/features/character-sheet/components/CharacterIdentity.tsx', import.meta.url), 'utf8')
const sheet = fs.readFileSync(new URL('../src/features/character-sheet/components/CharacterSheet.tsx', import.meta.url), 'utf8')
const admin = fs.readFileSync(new URL('../src/features/administration/components/AdministrationHub.tsx', import.meta.url), 'utf8')

test('SPEC-067 integra retrato con fallback de clan', () => {
  assert.match(identity, /<CharacterPortrait/)
  assert.match(identity, /characterId=\{characterId\}/)
})

test('SPEC-067 deja la validación global al final', () => {
  assert.ok(sheet.lastIndexOf('<PersistedCharacterValidation') > sheet.lastIndexOf('<PersistedCharacterSecondary'))
})

test('SPEC-067 añade almacenamiento a administración', () => {
  assert.match(admin, /Almacenamiento/)
  assert.match(admin, /systemApi\.storage/)
})

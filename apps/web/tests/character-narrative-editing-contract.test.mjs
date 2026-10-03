import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const narrative = readFileSync(
  new URL(
    '../src/features/character-sheet/components/CharacterNarrative.tsx',
    import.meta.url,
  ),
  'utf8',
)

const persistedSheet = readFileSync(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

const adapter = readFileSync(
  new URL(
    '../src/features/character-sheet/domain/persisted-character-sheet.adapter.ts',
    import.meta.url,
  ),
  'utf8',
)

const identity = readFileSync(
  new URL(
    '../src/features/character-sheet/components/CharacterIdentity.tsx',
    import.meta.url,
  ),
  'utf8',
)

const sheet = readFileSync(
  new URL(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'la historia de la ficha permite editar y guardar todos sus apartados',
  () => {
    assert.match(narrative, /Editar historia/)
    assert.match(narrative, /Guardar historia/)
    assert.match(narrative, /addConviction/)
    assert.match(narrative, /addTouchstone/)
    assert.match(narrative, /value=\{draft\.notes\}/)
  },
)

test(
  'el guardado conserva vínculos y notas narrativas',
  () => {
    assert.match(
      persistedSheet,
      /notes: narrative\.notes/,
    )
    assert.match(
      persistedSheet,
      /touchstoneId:[\s\S]*conviction\.touchstoneKey/,
    )
    assert.match(
      adapter,
      /touchstoneKey:[\s\S]*conviction\.touchstoneId/,
    )
    assert.match(
      adapter,
      /snapshot\.humanity\.notes \?\? ''/,
    )
  },
)

test(
  'Ambición y Deseo pueden evolucionar desde una ficha activa',
  () => {
    assert.doesNotMatch(
      identity,
      /Editar Ambición y Deseo/,
    )
    assert.match(
      identity,
      /Guardar cambios/,
    )
    assert.match(
      identity,
      /identity-grid identity-grid--editing/,
    )
    assert.match(
      persistedSheet,
      /identity: \{[\s\S]*ambition:[\s\S]*desire:/,
    )
    assert.doesNotMatch(
      persistedSheet,
      /identity: \{[\s\S]*clanKey:/,
    )
    assert.match(
      sheet,
      /Modificar ficha/,
    )
    assert.match(
      sheet,
      /editing=\{stateEditing && persistedIdentityEditable\}/,
    )
  },
)

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const sheet = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

const persisted = await readFile(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

const stateComponent = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterState.tsx',
    import.meta.url,
  ),
  'utf8',
)

const api = await readFile(
  new URL(
    '../src/features/character-sheet/infrastructure/character-state.api.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-024 habilita edición persistida sólo para draft/active',
  () => {
    assert.match(
      sheet,
      /model\.status !== 'archived'/,
    )
    assert.match(
      sheet,
      /persistedStateEditable/,
    )
    assert.match(
      sheet,
      /createCharacterStateGateway/,
    )
    assert.match(
      sheet,
      /Guardando Salud, Voluntad, Humanidad, Manchas y Hambre/,
    )
  },
)

test(
  'SPEC-024 aplica rollback y expone conflicto/recarga',
  () => {
    assert.match(sheet, /rollback\(\)/)
    assert.match(
      sheet,
      /error\.status === 409/,
    )
    assert.match(
      sheet,
      /Recargar ficha/,
    )
    assert.match(
      persisted,
      /onStateReload=/,
    )
  },
)

test(
  'SPEC-024 actualiza revisión y estado canónico tras guardar',
  () => {
    assert.match(
      persisted,
      /withOperationalState/,
    )
    assert.match(
      persisted,
      /revision: snapshot\.revision/,
    )
    assert.match(
      persisted,
      /onStateSaved=/,
    )
  },
)

test(
  'SPEC-027.E incluye Hambre en la escritura persistida',
  () => {
    assert.match(
      sheet,
      /hungerEditing=\{\s*stateEditing\s*&&\s*hasHunger\s*\}/,
    )
    assert.match(
      sheet,
      /hunger:\s*nextHunger/,
    )
    assert.match(
      api,
      /validateCharacterHunger/,
    )
    assert.match(
      api,
      /\bhunger\b/,
    )
    assert.match(
      persisted,
      /snapshot\.hunger/,
    )
  },
)

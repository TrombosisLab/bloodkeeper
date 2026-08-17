import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(
    new URL(path, import.meta.url),
    'utf8',
  )

const characterSheet = await readSource(
  '../src/features/character-sheet/components/CharacterSheet.tsx',
)
const characterTrackers = await readSource(
  '../src/features/character-sheet/components/CharacterTrackers.tsx',
)
const characterState = await readSource(
  '../src/features/character-sheet/components/CharacterState.tsx',
)
const headerStyles = await readSource(
  '../src/styles/base-and-sheet-header.css',
)

test(
  '006-I mantiene solo lectura hasta una acción explícita',
  () => {
    assert.match(
      characterSheet,
      /useState\(false\)/,
    )
    assert.match(
      characterSheet,
      /aria-pressed={stateEditing}/,
    )
    assert.match(characterSheet, /Editar estados/)
    assert.match(
      characterSheet,
      /Finalizar edición/,
    )
    assert.match(
      headerStyles,
      /sheet-header__state-edit:focus-visible/,
    )
  },
)

test(
  'SPEC-027.E conecta daño, Humanidad y Hambre a persistencia',
  () => {
    assert.match(
      characterSheet,
      /handleHealthChange/,
    )
    assert.match(
      characterSheet,
      /handleWillpowerChange/,
    )
    assert.match(
      characterSheet,
      /handleHumanityChange/,
    )
    assert.match(
      characterSheet,
      /handleHungerChange/,
    )
    assert.match(
      characterSheet,
      /damage:\s*\{/,
    )
    assert.match(
      characterSheet,
      /humanityValue:/,
    )
    assert.match(
      characterSheet,
      /humanityStains:/,
    )
    assert.match(
      characterSheet,
      /hunger:\s*nextHunger/,
    )
    assert.match(
      characterSheet,
      /hungerEditing=\{\s*stateEditing\s*&&\s*hasHunger\s*\}/,
    )
    assert.match(
      characterTrackers,
      /mode="editable"/,
    )
    assert.match(
      characterState,
      /hungerEditing = stateEditing/,
    )
  },
)

test(
  '006-I conserva la edición local de demostración',
  () => {
    assert.match(
      characterSheet,
      /Edición local de demostración/,
    )
    assert.match(
      characterSheet,
      /Los cambios no\s+se guardan/,
    )
  },
)

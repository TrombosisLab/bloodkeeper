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
  '006-I mantiene la ficha en solo lectura hasta una acción explícita',
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
  '006-I conecta daño y Humanidad con sus controles de dominio',
  () => {
    assert.match(
      characterSheet,
      /onHealthChange={setHealth}/,
    )
    assert.match(
      characterSheet,
      /onWillpowerChange={setWillpower}/,
    )
    assert.match(
      characterSheet,
      /onHumanityChange={setHumanity}/,
    )
    assert.match(
      characterSheet,
      /onHungerChange={setHunger}/,
    )
    assert.match(
      characterTrackers,
      /mode="editable"/,
    )
    assert.match(
      characterState,
      /mode="editable"/,
    )
  },
)

test(
  '006-I declara que la edición de demostración no persiste',
  () => {
    assert.match(
      characterSheet,
      /Edición local de demostración/,
    )
    assert.match(
      characterSheet,
      /Los cambios no\s+se guardan/,
    )
    assert.match(characterSheet, /role="status"/)
  },
)

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(
    new URL(path, import.meta.url),
    'utf8',
  )

const hungerTrack = await readSource(
  '../src/features/character-sheet/components/HungerTrack.tsx',
)
const characterState = await readSource(
  '../src/features/character-sheet/components/CharacterState.tsx',
)
const characterSheet = await readSource(
  '../src/features/character-sheet/components/CharacterSheet.tsx',
)
const sheetStyles = await readSource(
  '../src/styles/character-sheet.css',
)

test(
  '027-B mantiene Hambre en solo lectura fuera del modo de edición',
  () => {
    assert.match(
      hungerTrack,
      /mode = 'readOnly'/,
    )
    assert.match(
      hungerTrack,
      /mode === 'editable'/,
    )
    assert.match(
      characterState,
      /stateEditing \? \(/,
    )
    assert.match(
      characterState,
      /<HungerTrack[\s\S]*?mode="editable"/,
    )
  },
)

test(
  '027-B modifica Hambre exclusivamente mediante operaciones de dominio',
  () => {
    assert.match(
      hungerTrack,
      /increaseCharacterHunger/,
    )
    assert.match(
      hungerTrack,
      /reduceCharacterHunger/,
    )
    assert.match(
      hungerTrack,
      /disabled={!reduction\.valid}/,
    )
    assert.match(
      hungerTrack,
      /disabled={!increase\.valid}/,
    )
    assert.match(
      hungerTrack,
      /Hambre −/,
    )
    assert.match(
      hungerTrack,
      /Hambre \+/,
    )
  },
)

test(
  '027-B mantiene Hambre como estado propio de la ficha',
  () => {
    assert.match(
      characterSheet,
      /const \[hunger, setHunger\]/,
    )
    assert.match(
      characterSheet,
      /hunger={hunger}/,
    )
    assert.match(
      characterSheet,
      /onHungerChange={setHunger}/,
    )
    assert.doesNotMatch(
      characterState,
      /demoState\.hunger/,
    )
  },
)

test(
  '027-B comunica Hambre sin depender únicamente del color',
  () => {
    assert.match(
      hungerTrack,
      /role="list"/,
    )
    assert.match(
      hungerTrack,
      /role="listitem"/,
    )
    assert.match(
      hungerTrack,
      /aria-label={`Nivel/,
    )
    assert.match(
      sheetStyles,
      /hunger-track__controls button:focus-visible/,
    )
    assert.match(
      sheetStyles,
      /min-height: 44px/,
    )
  },
)

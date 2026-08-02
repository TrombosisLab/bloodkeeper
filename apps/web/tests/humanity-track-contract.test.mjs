import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const humanityTrack = await readFile(
  new URL(
    '../src/features/character-sheet/components/HumanityTrack.tsx',
    import.meta.url,
  ),
  'utf8',
)

const characterState = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterState.tsx',
    import.meta.url,
  ),
  'utf8',
)

const trackerStyles = await readFile(
  new URL(
    '../src/styles/character-sheet.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  '006-E renderiza el estado desde el dominio',
  () => {
    assert.match(
      humanityTrack,
      /toHumanityBoxStates\(state\)/,
    )
    assert.match(
      humanityTrack,
      /state: CharacterHumanityState/,
    )
    assert.doesNotMatch(humanityTrack, /Math\.min/)
  },
)

test(
  '006-G mantiene solo lectura como modo predeterminado',
  () => {
    assert.match(
      humanityTrack,
      /mode = 'readOnly'/,
    )
    assert.match(
      humanityTrack,
      /mode: 'editable'/,
    )
    assert.match(
      humanityTrack,
      /onChange: \(/,
    )
  },
)

test(
  '006-G ofrece operaciones separadas para Humanidad y Manchas',
  () => {
    assert.match(
      humanityTrack,
      /setHumanityValue\(/,
    )
    assert.match(
      humanityTrack,
      /setHumanityStains\(/,
    )
    assert.match(
      humanityTrack,
      /Humanidad −/,
    )
    assert.match(humanityTrack, /Mancha \+/)
  },
)

test(
  '006-G usa controles táctiles y accesibles por teclado',
  () => {
    assert.match(humanityTrack, /<button/)
    assert.match(
      humanityTrack,
      /disabled={!humanityCanDecrease}/,
    )
    assert.match(
      trackerStyles,
      /min-height: 44px/,
    )
    assert.match(
      trackerStyles,
      /humanity-track__controls button:focus-visible/,
    )
  },
)

test(
  '006-E comunica Humanidad y Manchas de forma accesible',
  () => {
    assert.match(humanityTrack, /role="list"/)
    assert.match(
      humanityTrack,
      /role="listitem"/,
    )
    assert.match(
      humanityTrack,
      /aria-label={`Casilla/,
    )
    assert.match(humanityTrack, /return '◆'/)
    assert.match(humanityTrack, /return '×'/)
  },
)

test(
  '006-E mantiene las Manchas visibles separadas del valor base',
  () => {
    assert.match(
      characterState,
      /humanity\.value/,
    )
    assert.match(
      characterState,
      /humanity\.stains/,
    )
  },
)

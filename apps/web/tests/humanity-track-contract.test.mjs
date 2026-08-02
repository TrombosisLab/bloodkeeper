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
      /demoState\.humanity\.value/,
    )
    assert.match(
      characterState,
      /demoState\.humanity\.stains/,
    )
  },
)

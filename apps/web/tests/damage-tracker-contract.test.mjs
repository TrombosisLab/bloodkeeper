import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const damageTracker = await readFile(
  new URL(
    '../src/components/ui/DamageTracker.tsx',
    import.meta.url,
  ),
  'utf8',
)

const trackerData = await readFile(
  new URL(
    '../src/features/character-sheet/data/demo-trackers.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '006-B reconstruye las casillas desde el contrato de dominio',
  () => {
    assert.match(
      damageTracker,
      /toDamageStates\(/,
    )
    assert.match(
      damageTracker,
      /track: CharacterDamageTrack/,
    )
    assert.doesNotMatch(
      damageTracker,
      /damage: DamageState\[\]/,
    )
    assert.match(trackerData, /track: \{/)
    assert.doesNotMatch(trackerData, /damage: \[/)
  },
)

test(
  '006-B mantiene diez casillas y comunica cada estado',
  () => {
    assert.match(
      damageTracker,
      /MAX_DAMAGE_TRACK_CAPACITY/,
    )
    assert.match(damageTracker, /role="list"/)
    assert.match(
      damageTracker,
      /role="listitem"/,
    )
    assert.match(
      damageTracker,
      /aria-label={`Casilla/,
    )
  },
)

test(
  '006-B diferencia el daño con símbolos además del color',
  () => {
    assert.match(
      damageTracker,
      /case 'superficial':[\s\S]*return '\/'/,
    )
    assert.match(
      damageTracker,
      /case 'aggravated':[\s\S]*return '×'/,
    )
  },
)

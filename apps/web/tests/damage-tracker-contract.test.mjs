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

const trackerStyles = await readFile(
  new URL(
    '../src/styles/character-sheet.css',
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
  '006-F mantiene solo lectura como modo predeterminado',
  () => {
    assert.match(
      damageTracker,
      /mode = 'readOnly'/,
    )
    assert.match(
      damageTracker,
      /mode: 'editable'/,
    )
    assert.match(
      damageTracker,
      /onChange: \(/,
    )
  },
)

test(
  '006-F delega cada cambio de casilla al dominio',
  () => {
    assert.match(
      damageTracker,
      /cycleDamageBoxState\(/,
    )
    assert.match(
      damageTracker,
      /onChange\?\.\(/,
    )
    assert.doesNotMatch(
      damageTracker,
      /superficial\s*[+][+]/,
    )
  },
)

test(
  '006-F usa controles deliberados accesibles por teclado',
  () => {
    assert.match(damageTracker, /<button/)
    assert.match(
      damageTracker,
      /type="button"/,
    )
    assert.match(
      damageTracker,
      /Cambiar a/,
    )
    assert.match(
      trackerStyles,
      /damage-box--editable:focus-visible/,
    )
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

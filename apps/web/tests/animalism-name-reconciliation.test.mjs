import assert from 'node:assert/strict'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'

test(
  '025-A5-R1 conserva la key técnica y usa el nombre oficial Expulsar a la Bestia',
  () => {
    const power =
      disciplinePowerDefinitions.find(
        definition =>
          definition.key ===
          'animalism-drawing-out-the-beast',
      )

    assert.ok(power)

    assert.equal(
      power.disciplineKey,
      'animalism',
    )

    assert.equal(
      power.level,
      5,
    )

    assert.equal(
      power.name,
      'Expulsar a la Bestia',
    )

    assert.equal(
      power.sourceKey,
      'core-v5-es',
    )

    assert.equal(
      power.sourcePage,
      248,
    )

    assert.equal(
      power.mechanics,
      undefined,
    )

    assert.equal(
      power.diceCheck,
      undefined,
    )
  },
)

test(
  '025-A5-R1 Animalismo mantiene exactamente 9 Poderes sin poblar mechanics',
  () => {
    const animalism =
      disciplinePowerDefinitions.filter(
        power =>
          power.disciplineKey ===
          'animalism',
      )

    assert.equal(
      animalism.length,
      9,
    )

    assert.ok(
      animalism.every(
        power =>
          power.mechanics ===
          undefined,
      ),
    )

    assert.ok(
      animalism.every(
        power =>
          power.diceCheck ===
          undefined,
      ),
    )
  },
)

test(
  '025-A5-R1 no conserva el nombre visible Extraer a la Bestia',
  () => {
    assert.equal(
      disciplinePowerDefinitions.some(
        power =>
          power.name ===
          'Extraer a la Bestia',
      ),
      false,
    )
  },
)

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  CHARACTER_HUNGER_MAX,
  CHARACTER_HUNGER_MIN,
  increaseCharacterHunger,
  normalizeCharacterHunger,
  reduceCharacterHunger,
  setCharacterHunger,
  validateCharacterHunger,
} from '../src/features/character/domain/hunger-rules.ts'

const bloodRulesSource = await readFile(
  new URL(
    '../src/features/character-creation/domain/blood-rules.ts',
    import.meta.url,
  ),
  'utf8',
)

const hungerTrackSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/HungerTrack.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '027-A valida el rango autorizado de Hambre',
  () => {
    for (
      let hunger = CHARACTER_HUNGER_MIN;
      hunger <= CHARACTER_HUNGER_MAX;
      hunger += 1
    ) {
      assert.equal(
        validateCharacterHunger(
          hunger,
        ).valid,
        true,
      )
    }

    for (const hunger of [-1, 6, 2.5]) {
      assert.equal(
        validateCharacterHunger(
          hunger,
        ).valid,
        false,
      )
    }
  },
)

test(
  '027-A incrementa y reduce Hambre mediante transiciones explícitas',
  () => {
    assert.deepEqual(
      increaseCharacterHunger(2),
      {
        valid: true,
        errors: [],
        value: 3,
        changed: true,
      },
    )

    assert.deepEqual(
      reduceCharacterHunger(3, 2),
      {
        valid: true,
        errors: [],
        value: 1,
        changed: true,
      },
    )
  },
)

test(
  '027-A impide transiciones fuera de rango sin modificar el valor',
  () => {
    const increase =
      increaseCharacterHunger(5)
    const reduction =
      reduceCharacterHunger(0)

    assert.equal(
      increase.valid,
      false,
    )
    assert.equal(
      increase.value,
      5,
    )
    assert.equal(
      increase.changed,
      false,
    )

    assert.equal(
      reduction.valid,
      false,
    )
    assert.equal(
      reduction.value,
      0,
    )
  },
)

test(
  '027-A rechaza cantidades de transición inválidas',
  () => {
    for (const amount of [0, -1, 1.5]) {
      assert.equal(
        increaseCharacterHunger(
          2,
          amount,
        ).valid,
        false,
      )
    }
  },
)

test(
  '027-A diferencia normalización defensiva de transición autorizada',
  () => {
    assert.equal(
      normalizeCharacterHunger(9.8),
      5,
    )
    assert.equal(
      normalizeCharacterHunger(
        Number.NaN,
      ),
      0,
    )

    assert.equal(
      setCharacterHunger(
        2,
        9,
      ).valid,
      false,
    )
  },
)

test(
  '027-A creador y ficha consumen la misma regla de Hambre',
  () => {
    assert.match(
      bloodRulesSource,
      /character\/domain\/hunger-rules/,
    )
    assert.match(
      bloodRulesSource,
      /normalizeCharacterHunger/,
    )
    assert.match(
      bloodRulesSource,
      /validateCharacterHunger/,
    )

    assert.match(
      hungerTrackSource,
      /character\/domain\/hunger-rules/,
    )
    assert.match(
      hungerTrackSource,
      /CHARACTER_HUNGER_MAX/,
    )
    assert.doesNotMatch(
      hungerTrackSource,
      /Math\.min|Math\.max/,
    )
  },
)

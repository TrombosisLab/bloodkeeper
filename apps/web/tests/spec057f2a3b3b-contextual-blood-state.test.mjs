import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  generationOptions,
} from '../src/features/character-creation/data/identity-options.ts'

import {
  getBloodPotencyRange,
} from '../src/features/character-creation/domain/blood-rules.ts'

import {
  CHARACTER_HUNGER_MAX,
  CHARACTER_HUNGER_MIN,
} from '../src/features/character/domain/hunger-rules.ts'

import {
  initialVampireBloodPotencyOptions,
  initialVampireHungerOptions,
  initialVampireTransitionGeneration,
} from '../src/features/character-sheet/domain/initial-vampire-transition-blood-ui-state.ts'

const component =
  await readFile(
    new URL(
      '../src/features/character-sheet/components/PersistedInitialVampireTransition.tsx',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '057-F2A3B3B deriva Potencia de Sangre desde la regla existente',
  () => {
    for (
      const generation of
        generationOptions
    ) {
      const range =
        getBloodPotencyRange(
          generation,
        )

      assert.deepEqual(
        initialVampireBloodPotencyOptions(
          generation,
        ),
        Array.from(
          {
            length:
              range.max -
              range.min +
              1,
          },
          (_, index) =>
            range.min + index,
        ),
      )
    }
  },
)

test(
  '057-F2A3B3B no fabrica rango cuando la Generación no está resuelta',
  () => {
    assert.equal(
      initialVampireTransitionGeneration(
        null,
      ),
      null,
    )

    assert.deepEqual(
      initialVampireBloodPotencyOptions(
        null,
      ),
      [],
    )

    assert.deepEqual(
      initialVampireBloodPotencyOptions(
        99,
      ),
      [],
    )
  },
)

test(
  '057-F2A3B3B consume el rango compartido de Hambre',
  () => {
    assert.deepEqual(
      initialVampireHungerOptions,
      Array.from(
        {
          length:
            CHARACTER_HUNGER_MAX -
            CHARACTER_HUNGER_MIN +
            1,
        },
        (_, index) =>
          CHARACTER_HUNGER_MIN +
          index,
      ),
    )
  },
)

test(
  '057-F2A3B3B muestra Sangre sólo cuando pendingDecisions lo autoriza',
  () => {
    assert.match(
      component,
      /pending\.includes\(\s*'bloodState'/,
    )

    assert.match(
      component,
      /<h3>Estado de Sangre<\/h3>/,
    )
  },
)

test(
  '057-F2A3B3B no inventa valores iniciales de Sangre',
  () => {
    assert.match(
      component,
      /setBloodPotency[\s\S]*useState\(''\)/,
    )

    assert.match(
      component,
      /setInitialHunger[\s\S]*useState\(''\)/,
    )

    assert.match(
      component,
      /<option value="">[\s\S]*Seleccionar…/,
    )

    assert.doesNotMatch(
      component,
      /useState\(\s*1\s*\)/,
    )

    assert.doesNotMatch(
      component,
      /bloodPotency\s*:\s*1/,
    )

    assert.doesNotMatch(
      component,
      /hunger\s*:\s*1/,
    )
  },
)

test(
  '057-F2A3B3B usa establishBlood dedicado y revisión optimista',
  () => {
    assert.match(
      component,
      /resolvedGateway\s*\.establishBlood\(/,
    )

    assert.match(
      component,
      /transition\.revision/,
    )

    assert.match(
      component,
      /await operation\(\)[\s\S]*onResolved\(\)/,
    )
  },
)

test(
  '057-F2A3B3B no duplica restricciones especiales de Sangre Débil en React',
  () => {
    assert.doesNotMatch(
      component,
      /\[14,\s*15,\s*16\]/,
    )

    assert.doesNotMatch(
      component,
      /clanKey\s*===\s*['"]thinBlood['"]/,
    )

    assert.doesNotMatch(
      component,
      /THIN_BLOOD_BLOOD_POTENCY_INVALID/,
    )
  },
)

test(
  '057-F2A3B3B no reabre decisiones posteriores a Disciplinas/Poderes',
  () => {
    for (
      const forbidden of [
        'adoptPredatorType(',
        'reviewAdvantages(',
        'resolveThinBloodState(',
        'consolidate(',
      ]
    ) {
      assert.equal(
        component.includes(forbidden),
        false,
      )
    }
  },
)

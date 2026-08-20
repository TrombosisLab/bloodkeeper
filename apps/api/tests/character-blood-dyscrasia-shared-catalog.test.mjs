import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import {
  characterBloodDyscrasiaCatalog,
} from '@v5r/character-rules'

const require = createRequire(import.meta.url)
const cjsRules = require('@v5r/character-rules')

const definitions =
  characterBloodDyscrasiaCatalog.definitions

test('058-D1 cataloga exactamente 26 Discrasias Core', () => {
  assert.equal(definitions.length, 26)
  assert.equal(
    new Set(
      definitions.map(({ key }) => key),
    ).size,
    26,
  )

  assert.deepEqual(
    Object.fromEntries(
      ['choleric', 'melancholy', 'phlegmatic', 'sanguine']
        .map((resonanceKey) => [
          resonanceKey,
          definitions.filter(
            (definition) =>
              definition.resonanceKey ===
              resonanceKey,
          ).length,
        ]),
    ),
    {
      choleric: 7,
      melancholy: 6,
      phlegmatic: 7,
      sanguine: 6,
    },
  )
})

test('058-D1 ninguna Discrasia de ejemplo pertenece a sangre animal o resonanceFree', () => {
  for (const definition of definitions) {
    assert.ok(
      [
        'choleric',
        'melancholy',
        'phlegmatic',
        'sanguine',
      ].includes(definition.resonanceKey),
    )

    assert.equal(
      definition.source,
      'core',
    )
    assert.ok(
      definition.sourcePage === 230 ||
      definition.sourcePage === 231,
    )
  }
})

test('058-D1 separa persistencia del donante de duración en el bebedor', () => {
  for (const definition of definitions) {
    assert.equal(
      definition.donorPersistence,
      'storytellerDefined',
    )

    assert.ok(
      [
        'untilNextFeedingOrHungerFive',
        'nextFeeding',
        'scene',
        'consumedImmediately',
      ].includes(
        definition.drinkerEffectDuration,
      ),
    )
  }
})

test('058-D1 modela adquisición normativa sin activar por mera detección', () => {
  for (const definition of definitions) {
    assert.deepEqual(
      definition.acquisitionModes,
      [
        'drainAndKill',
        'feedThreeNights',
      ],
    )
  }
})

test('058-D1 estructura los cuatro efectos de XP como consumibles', () => {
  const xp = definitions.filter(
    ({ effect }) =>
      effect.kind ===
      'restrictedExperienceGrant',
  )

  assert.deepEqual(
    xp.map(({ key }) => key),
    [
      'energetic',
      'evocative',
      'reflection',
      'excited',
    ],
  )

  for (const definition of xp) {
    assert.equal(definition.consumable, true)
    assert.equal(
      definition.drinkerEffectDuration,
      'consumedImmediately',
    )
    assert.equal(
      definition.effect.amount,
      1,
    )
  }
})

test('058-D1 conserva efectos que dependen de consumidores futuros como datos, no automatización falsa', () => {
  const rouse =
    definitions.find(
      ({ key }) =>
        key === 'enthusiasticAboutLife',
    )

  assert.equal(
    rouse.effect.kind,
    'rouseCheckExemption',
  )
  assert.equal(
    rouse.effect.action,
    'blushOfLife',
  )

  const manic =
    definitions.find(
      ({ key }) => key === 'manicHigh',
    )

  assert.deepEqual(
    {
      before: manic.effect.beforeFailureValue,
      after: manic.effect.afterFailureValue,
    },
    {
      before: 1,
      after: -2,
    },
  )
})

test('058-D1 ESM/CJS mantienen paridad y catálogo congelado', () => {
  assert.deepEqual(
    cjsRules.characterBloodDyscrasiaCatalog,
    characterBloodDyscrasiaCatalog,
  )

  assert.equal(
    Object.isFrozen(
      characterBloodDyscrasiaCatalog,
    ),
    true,
  )
  assert.equal(
    Object.isFrozen(
      characterBloodDyscrasiaCatalog
        .definitions,
    ),
    true,
  )
  assert.equal(
    Object.isFrozen(
      characterBloodDyscrasiaCatalog
        .definitions[0],
    ),
    true,
  )
})

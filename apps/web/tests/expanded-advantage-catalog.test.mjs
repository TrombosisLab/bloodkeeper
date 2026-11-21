import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  thinBloodTraitDefinitions,
} from '../src/features/character-creation/data/thin-blood-trait-definitions.ts'

const byKey = new Map(
  characterAdvantageDefinitions.map((definition) => [
    definition.key,
    definition,
  ]),
)

test('el catálogo extendido mantiene claves únicas y todas las entradas registradas', () => {
  assert.equal(byKey.size, characterAdvantageDefinitions.length)

  for (const key of [
    'two-masters',
    'careless-predator',
    'corpse-meat',
    'immutable-countenance',
    'rancher',
    'disease-vector',
    'plague-carrier',
    'diabolist-evident',
    'inherited-bane',
    'fame-influencer',
    'lasting-fame',
    'erased-identity',
    'mask-maker',
    'adversary-mawla',
    'indigent',
    'sacred-ground',
    'haven-sanctuary',
    'commercial-establishment',
    'furcus',
    'mechanic-workshop',
    'haven-mobile',
    'haven-armored',
    'smuggler-cache',
    'spare-plates',
    'haven-no-safehouse',
    'haven-shared',
    'haven-railbound',
    'haven-temperamental',
    'caitiff-favored-blood',
    'caitiff-mark-of-caine',
    'caitiff-mimic',
    'caitiff-marked-by-sun',
    'caitiff-uncle-fangs',
    'caitiff-contaminated-vitae',
    'caitiff-clan-curse',
    'caitiff-debt-servant',
    'caitiff-liquidator',
    'caitiff-pregnant-blood',
    'caitiff-walking-omen',
    'caitiff-marked-by-word',
  ]) {
    assert.ok(byKey.has(key), `Falta la entrada ${key}`)
  }

  assert.equal(
    characterAdvantageDefinitions.some((definition) =>
      /Cultos|Excomulgado|Sin Fe/.test(definition.name),
    ),
    false,
  )
})

test('los rangos de trasfondo y refugio respetan las capturas', () => {
  assert.deepEqual(byKey.get('allies').allowedRatings, [2, 3, 4, 5, 6])
  assert.deepEqual(byKey.get('haven').allowedRatings, [1, 2, 3, 4, 5])
  assert.deepEqual(byKey.get('awake-all-night').allowedRatings, [1, 4])
  assert.deepEqual(byKey.get('immutable-countenance').allowedRatings, [1, 2])
  assert.deepEqual(byKey.get('demon-luck').allowedRatings, [3])
  assert.deepEqual(byKey.get('rancher').allowedRatings, [2])
  assert.deepEqual(byKey.get('adversary-mawla').allowedRatings, [3, 4, 5, 6, 7])
  assert.deepEqual(byKey.get('commercial-establishment').allowedRatings, [2, 3])
  assert.deepEqual(byKey.get('furcus').allowedRatings, [1, 2, 3])
  assert.deepEqual(byKey.get('smuggler-cache').allowedRatings, [1, 2])
})

test('los méritos dependientes declaran trasfondo padre y puntuación mínima', () => {
  for (const [key, parentKey, minimum] of [
    ['fame-influencer', 'fame', 2],
    ['lasting-fame', 'fame', 3],
    ['erased-identity', 'mask', 2],
    ['mask-maker', 'mask', 2],
    ['secret-master', 'mawla', undefined],
  ]) {
    const definition = byKey.get(key)
    assert.ok(definition, `Falta ${key}`)
    assert.equal(definition.requiresParentSelection, true)
    assert.ok(definition.allowedParentDefinitionKeys.includes(parentKey))
    if (minimum !== undefined) {
      assert.equal(definition.minimumParentRating, minimum)
    }
  }

  for (const key of ['haven-railbound', 'haven-temperamental']) {
    assert.deepEqual(
      byKey.get(key).allowedParentDefinitionKeys,
      ['haven-mobile'],
    )
  }

  assert.deepEqual(
    byKey.get('adversary-mawla').parentRatingConstraints.map(
      ({ parentRating, allowedRatings }) => [parentRating, ...allowedRatings],
    ),
    [[1, 3], [2, 4], [3, 5], [4, 6], [5, 7]],
  )
})

test('los méritos y defectos exclusivos de Caitiff declaran su restricción', () => {
  const caitiffDefinitions = characterAdvantageDefinitions.filter(
    (definition) =>
      definition.requirements?.characterKinds?.includes('caitiff'),
  )

  assert.equal(caitiffDefinitions.length, 12)
  assert.ok(caitiffDefinitions.every((definition) =>
    definition.requirements.characterKinds.includes('caitiff'),
  ))
})

test('el catálogo Sangre Débil incorpora las 14 ventajas y 16 defectos mostrados', () => {
  const merits = thinBloodTraitDefinitions.filter(
    (definition) => definition.category === 'merit',
  )
  const flaws = thinBloodTraitDefinitions.filter(
    (definition) => definition.category === 'flaw',
  )
  const keys = new Set(thinBloodTraitDefinitions.map(({ key }) => key))

  assert.equal(keys.size, thinBloodTraitDefinitions.length)
  assert.equal(merits.length, 14)
  assert.equal(flaws.length, 16)

  for (const key of [
    'thin-blood-abominable-blood',
    'thin-blood-faith-proof',
    'thin-blood-low-appetite',
    'thin-blood-lucid-dream',
    'thin-blood-mortal-countenance',
    'thin-blood-fast-drinker',
    'thin-blood-heliophobia',
    'thin-blood-night-terrors',
    'thin-blood-plague-carriers',
    'thin-blood-clumsy-drinker',
    'thin-blood-sun-faded',
    'thin-blood-supernatural-tell',
    'thin-blood-twilight-presence',
    'thin-blood-endless-hunger',
  ]) {
    assert.ok(keys.has(key), `Falta el rasgo ${key}`)
  }
})

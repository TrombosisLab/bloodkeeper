import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CHARACTER_BLOOD_RESONANCE_DICE_MODIFIER_KEY,
  deriveCharacterBloodResonanceDiceModifier,
} from '../dist/dice/domain/character-dice-resonance.rules.js'

function humoral(
  resonanceKey,
  temperament = 'intense',
) {
  return {
    sourceKind: 'human',
    resonanceKey,
    specialAffinityKey: null,
    temperament,
  }
}

test('058-C aplica +1 sólo a Disciplinas asociadas con Intenso/Agudo', () => {
  const cases = [
    ['choleric', 'celerity'],
    ['choleric', 'potence'],
    ['melancholy', 'fortitude'],
    ['melancholy', 'obfuscate'],
    ['phlegmatic', 'auspex'],
    ['phlegmatic', 'dominate'],
    ['sanguine', 'bloodSorcery'],
    ['sanguine', 'presence'],
  ]

  for (const [resonanceKey, disciplineKey] of cases) {
    for (const temperament of ['intense', 'acute']) {
      const modifier =
        deriveCharacterBloodResonanceDiceModifier(
          humoral(
            resonanceKey,
            temperament,
          ),
          disciplineKey,
        )

      assert.equal(
        modifier?.key,
        CHARACTER_BLOOD_RESONANCE_DICE_MODIFIER_KEY,
      )
      assert.equal(modifier?.value, 1)
    }
  }
})

test('058-C Efímero y Disciplina no asociada no producen modificador', () => {
  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      humoral('choleric', 'fleeting'),
      'celerity',
    ),
    null,
  )

  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      humoral('choleric', 'intense'),
      'auspex',
    ),
    null,
  )
})

test('058-C animalBlood usa Animalismo/Protean y resonanceFree no inventa +1', () => {
  const animal = {
    sourceKind: 'animal',
    resonanceKey: null,
    specialAffinityKey: 'animalBlood',
    temperament: 'acute',
  }

  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      animal,
      'animalism',
    )?.value,
    1,
  )

  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      animal,
      'protean',
    )?.value,
    1,
  )

  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      animal,
      'presence',
    ),
    null,
  )

  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      {
        sourceKind: 'human',
        resonanceKey: null,
        specialAffinityKey:
          'resonanceFree',
        temperament: null,
      },
      'oblivion',
    ),
    null,
  )
})

test('058-C sin Resonancia o sin contexto de Disciplina no aplica bonus', () => {
  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      null,
      'celerity',
    ),
    null,
  )

  assert.equal(
    deriveCharacterBloodResonanceDiceModifier(
      humoral('choleric'),
      null,
    ),
    null,
  )
})

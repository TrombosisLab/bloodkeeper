import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCharacterDisciplineValidationContributor,
} from '../dist/characters/domain/character-discipline-validation.contributor.js'
import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

function character(clanKey, creationMode) {
  return {
    nature: 'vampire',
    identity: {
      clanKey,
      generation: clanKey === 'thinBlood' ? 14 : 13,
      predatorTypeKey: clanKey === 'thinBlood' ? null : 'bagger',
    },
    creation: {
      creationMode,
      predatorTypeChoices: {},
    },
    blood: {
      bloodPotency: clanKey === 'thinBlood' ? 0 : 1,
      hunger: 1,
    },
    disciplines: [],
    bloodSorceryRituals: { ritualKeys: [] },
    oblivionCeremonies: { ceremonyKeys: [] },
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: { selections: [] },
    skillSpecialties: [],
  }
}

function hasRequired(clanKey, creationMode) {
  const contributor =
    createCharacterDisciplineValidationContributor(
      characterRulesCatalog,
    )
  const section = contributor.validate(
    character(clanKey, creationMode),
    'activation',
  )[0]
  return section.issues.some(
    ({ code }) => code ===
      'CHARACTER_VAMPIRE_THIN_BLOOD_ALCHEMY_STATE_REQUIRED',
  )
}

test('057-E3C2 Session Zero no Thin Blood no necesita Alquimia ficticia', () => {
  assert.equal(hasRequired('brujah', 'sessionZero'), false)
})

test('057-E3C2 conserva STANDARD y Thin Blood estrictos', () => {
  assert.equal(hasRequired('brujah', 'standard'), true)
  assert.equal(hasRequired('thinBlood', 'sessionZero'), true)
})

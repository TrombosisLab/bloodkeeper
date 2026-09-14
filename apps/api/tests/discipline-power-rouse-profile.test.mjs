import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  listCharacterDisciplinePowerRouseProfiles,
  resolveCharacterDisciplinePowerRouseProfile,
} from '../dist/characters/domain/discipline-power-rouse-profile.js'

function character({
  bloodPotency = 3,
  powerKeys = [],
  disciplineKey = 'celerity',
  blood = true,
} = {}) {
  return {
    blood: blood
      ? { bloodPotency, hunger: 1 }
      : null,
    disciplines: [
      {
        disciplineKey,
        rating: 5,
        powerKeys,
        origin: 'creation',
      },
    ],
  }
}

test(
  'la capa de Enardecimiento conserva los 106 poderes canónicos',
  () => {
    const before = JSON.stringify(
      characterRulesCatalog.disciplineCatalog.powers,
    )

    assert.equal(
      characterRulesCatalog.disciplineCatalog.powers.length,
      106,
    )

    resolveCharacterDisciplinePowerRouseProfile({
      catalog: characterRulesCatalog,
      character: character({
        powerKeys: ['celerity-fleetness'],
      }),
      powerKey: 'celerity-fleetness',
    })

    const after = JSON.stringify(
      characterRulesCatalog.disciplineCatalog.powers,
    )

    assert.equal(after, before)
  },
)

test(
  'un poder adquirido con coste fijo de un control queda listo',
  () => {
    const profile =
      resolveCharacterDisciplinePowerRouseProfile({
        catalog: characterRulesCatalog,
        character: character({
          bloodPotency: 3,
          powerKeys: ['celerity-fleetness'],
        }),
        powerKey: 'celerity-fleetness',
      })

    assert.equal(profile.status, 'ready')
    assert.equal(profile.execution, 'singleCheck')
    assert.equal(profile.requiredChecks, 1)
    assert.equal(profile.dicePerCheck, 2)
    assert.equal(profile.powerName, 'Presteza')
  },
)

test(
  'la repetición depende del nivel real del poder y la Potencia de Sangre',
  () => {
    const levelOne =
      resolveCharacterDisciplinePowerRouseProfile({
        catalog: characterRulesCatalog,
        character: character({
          bloodPotency: 1,
          powerKeys: ['oblivion-ashes-to-ashes'],
          disciplineKey: 'oblivion',
        }),
        powerKey: 'oblivion-ashes-to-ashes',
      })

    const levelTwo =
      resolveCharacterDisciplinePowerRouseProfile({
        catalog: characterRulesCatalog,
        character: character({
          bloodPotency: 1,
          powerKeys: ['celerity-blink'],
        }),
        powerKey: 'celerity-blink',
      })

    assert.equal(levelOne.dicePerCheck, 2)
    assert.equal(levelTwo.dicePerCheck, 1)
  },
)

test(
  'los costes complejos no se convierten silenciosamente en un único control',
  () => {
    const profile =
      resolveCharacterDisciplinePowerRouseProfile({
        catalog: characterRulesCatalog,
        character: character({
          powerKeys: ['auspex-possession'],
          disciplineKey: 'auspex',
        }),
        powerKey: 'auspex-possession',
      })

    assert.equal(profile.status, 'contextual')
    assert.equal(profile.execution, 'contextual')
    assert.equal(profile.requiredChecks, 2)
    assert.equal(profile.dicePerCheck, 1)
  },
)

test(
  'solo se ofrecen poderes adquiridos y los poderes sin Enardecimiento se marcan aparte',
  () => {
    const profiles =
      listCharacterDisciplinePowerRouseProfiles({
        catalog: characterRulesCatalog,
        character: character({
          powerKeys: [
            'celerity-cats-grace',
            'celerity-fleetness',
          ],
        }),
      })

    assert.deepEqual(
      profiles.map((profile) => profile.powerKey),
      ['celerity-cats-grace', 'celerity-fleetness'],
    )
    assert.equal(profiles[0].status, 'noRouseCheck')
    assert.equal(profiles[1].status, 'ready')
  },
)

test(
  'un poder no adquirido nunca queda disponible para lanzar',
  () => {
    const profile =
      resolveCharacterDisciplinePowerRouseProfile({
        catalog: characterRulesCatalog,
        character: character(),
        powerKey: 'celerity-fleetness',
      })

    assert.equal(profile.status, 'notOwned')
    assert.equal(profile.execution, 'none')
    assert.equal(profile.dicePerCheck, null)
  },
)

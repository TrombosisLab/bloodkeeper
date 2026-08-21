import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCharacterBloodDyscrasiaConsumptionHistoryEntry,
  buildCharacterBloodFeedingHistoryEntry,
  CHARACTER_BLOOD_DYSCRASIA_CONSUMPTION_HISTORY_TITLE,
  CHARACTER_BLOOD_FEEDING_HISTORY_TITLE,
} from '../dist/characters/domain/character-blood-history.rules.js'

test('058-E3 describe alimentación humoral y Discrasia con nombres canónicos', () => {
  const history =
    buildCharacterBloodFeedingHistoryEntry({
      sourceKind: 'human',
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'acute',
      dyscrasiaKey: 'energetic',
    })

  assert.equal(
    history.title,
    CHARACTER_BLOOD_FEEDING_HISTORY_TITLE,
  )
  assert.match(
    history.description,
    /Colérica/,
  )
  assert.match(
    history.description,
    /Agud|Agudo|Aguda/,
  )
  assert.match(
    history.description,
    /Discrasia/,
  )
})

test('058-E3 distingue afinidades especiales sin inventar quinta Resonancia', () => {
  const animal =
    buildCharacterBloodFeedingHistoryEntry({
      sourceKind: 'animal',
      resonanceKey: null,
      specialAffinityKey:
        'animalBlood',
      temperament: 'intense',
      dyscrasiaKey: null,
    })

  const resonanceFree =
    buildCharacterBloodFeedingHistoryEntry({
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey:
        'resonanceFree',
      temperament: null,
      dyscrasiaKey: null,
    })

  assert.match(
    animal.description,
    /animal/i,
  )
  assert.match(
    resonanceFree.description,
    /libre de Resonancia/i,
  )
})

test('058-E3 representa alimentación sin Resonancia significativa sin crear valor ficticio', () => {
  const history =
    buildCharacterBloodFeedingHistoryEntry({
      sourceKind: 'human',
      resonanceKey: null,
      specialAffinityKey: null,
      temperament: null,
      dyscrasiaKey: null,
    })

  assert.equal(
    history.title,
    CHARACTER_BLOOD_FEEDING_HISTORY_TITLE,
  )
  assert.match(
    history.description,
    /sin conservar una Resonancia/i,
  )
})

test('058-E3 consumo directo y consumo para Disciplina comparten evento canónico', () => {
  const direct =
    buildCharacterBloodDyscrasiaConsumptionHistoryEntry({
      dyscrasiaKey: 'energetic',
    })

  const advancement =
    buildCharacterBloodDyscrasiaConsumptionHistoryEntry({
      dyscrasiaKey: 'energetic',
      disciplineKey: 'celerity',
    })

  assert.equal(
    direct.title,
    CHARACTER_BLOOD_DYSCRASIA_CONSUMPTION_HISTORY_TITLE,
  )
  assert.equal(
    advancement.title,
    CHARACTER_BLOOD_DYSCRASIA_CONSUMPTION_HISTORY_TITLE,
  )
  assert.match(
    direct.description,
    /Discrasia/,
  )
  assert.match(
    advancement.description,
    /adquisición de/i,
  )
})

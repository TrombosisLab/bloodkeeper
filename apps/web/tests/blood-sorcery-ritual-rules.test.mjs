import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addKnownRitual,
  canLearnRitualAtDisciplineLevel,
  canSelectRitualAtCharacterCreation,
  getMinimumRitualLearningWeeks,
  getRitualExperienceCost,
  normalizeKnownRituals,
  removeKnownRitual,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-rules.ts'

const definitions = [
  {
    key: 'ritual-level-1',
    name: 'Ritual técnico nivel 1',
    level: 1,
  },
  {
    key: 'ritual-level-2',
    name: 'Ritual técnico nivel 2',
    level: 2,
  },
  {
    key: 'ritual-level-3',
    name: 'Ritual técnico nivel 3',
    level: 3,
  },
]

test(
  'un Ritual no puede superar el nivel de Hechicería de Sangre',
  () => {
    assert.equal(
      canLearnRitualAtDisciplineLevel(
        definitions[1],
        1,
      ).valid,
      false,
    )

    assert.equal(
      canLearnRitualAtDisciplineLevel(
        definitions[1],
        2,
      ).valid,
      true,
    )
  },
)

test(
  'durante creación requiere al menos Hechicería de Sangre 1',
  () => {
    const result =
      canSelectRitualAtCharacterCreation(
        definitions[0],
        0,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'durante creación inicial solo admite Rituales de nivel 1',
  () => {
    assert.equal(
      canSelectRitualAtCharacterCreation(
        definitions[0],
        1,
      ).valid,
      true,
    )

    assert.equal(
      canSelectRitualAtCharacterCreation(
        definitions[1],
        2,
      ).valid,
      false,
    )
  },
)

test(
  'el coste de Experiencia es nivel por 3',
  () => {
    assert.equal(
      getRitualExperienceCost(1),
      3,
    )

    assert.equal(
      getRitualExperienceCost(3),
      9,
    )

    assert.equal(
      getRitualExperienceCost(5),
      15,
    )
  },
)

test(
  'el tiempo mínimo de aprendizaje es el cuadrado del nivel en semanas',
  () => {
    assert.equal(
      getMinimumRitualLearningWeeks(1),
      1,
    )

    assert.equal(
      getMinimumRitualLearningWeeks(3),
      9,
    )

    assert.equal(
      getMinimumRitualLearningWeeks(5),
      25,
    )
  },
)

test(
  'añadir un Ritual evita duplicados y permite eliminarlo',
  () => {
    let ritualKeys = []

    ritualKeys =
      addKnownRitual(
        ritualKeys,
        'ritual-level-1',
      )

    ritualKeys =
      addKnownRitual(
        ritualKeys,
        'ritual-level-1',
      )

    assert.deepEqual(
      ritualKeys,
      [
        'ritual-level-1',
      ],
    )

    ritualKeys =
      removeKnownRitual(
        ritualKeys,
        'ritual-level-1',
      )

    assert.deepEqual(
      ritualKeys,
      [],
    )
  },
)

test(
  'normalización elimina Rituales inexistentes y duplicados',
  () => {
    const result =
      normalizeKnownRituals(
        definitions,
        [
          'ritual-level-1',
          'unknown',
          'ritual-level-1',
          'ritual-level-2',
        ],
        2,
      )

    assert.deepEqual(
      result,
      [
        'ritual-level-1',
        'ritual-level-2',
      ],
    )
  },
)

test(
  'normalización elimina Rituales por encima del nivel actual',
  () => {
    const result =
      normalizeKnownRituals(
        definitions,
        [
          'ritual-level-1',
          'ritual-level-2',
          'ritual-level-3',
        ],
        1,
      )

    assert.deepEqual(
      result,
      [
        'ritual-level-1',
      ],
    )
  },
)

test(
  'rechaza niveles inválidos al calcular XP y tiempo',
  () => {
    assert.throws(
      () =>
        getRitualExperienceCost(
          0,
        ),
      RangeError,
    )

    assert.throws(
      () =>
        getMinimumRitualLearningWeeks(
          6,
        ),
      RangeError,
    )
  },
)

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addKnownOblivionCeremony,
  canLearnOblivionCeremony,
  normalizeKnownOblivionCeremonies,
  removeKnownOblivionCeremony,
} from '../src/features/character-creation/domain/oblivion-ceremony-rules.ts'

const definitions = [
  {
    key: 'ceremony-level-1',
    name: 'Ceremonia técnica nivel 1',
    level: 1,
  },
  {
    key: 'ceremony-level-2',
    name: 'Ceremonia técnica nivel 2',
    level: 2,

    requirements: {
      prerequisitePowerKeys: [
        'oblivion-power-test',
      ],
    },
  },
]

test(
  'una Ceremonia no puede superar el nivel de Olvido',
  () => {
    assert.equal(
      canLearnOblivionCeremony(
        definitions[1],
        1,
        [
          'oblivion-power-test',
        ],
      ).valid,
      false,
    )

    assert.equal(
      canLearnOblivionCeremony(
        definitions[1],
        2,
        [
          'oblivion-power-test',
        ],
      ).valid,
      true,
    )
  },
)

test(
  'una Ceremonia respeta prerrequisitos de poderes',
  () => {
    assert.equal(
      canLearnOblivionCeremony(
        definitions[1],
        2,
        [],
      ).valid,
      false,
    )

    assert.equal(
      canLearnOblivionCeremony(
        definitions[1],
        2,
        [
          'oblivion-power-test',
        ],
      ).valid,
      true,
    )
  },
)

test(
  'añadir Ceremonias evita duplicados',
  () => {
    let keys = []

    keys =
      addKnownOblivionCeremony(
        keys,
        'ceremony-level-1',
      )

    keys =
      addKnownOblivionCeremony(
        keys,
        'ceremony-level-1',
      )

    assert.deepEqual(
      keys,
      [
        'ceremony-level-1',
      ],
    )
  },
)

test(
  'eliminar Ceremonias funciona correctamente',
  () => {
    const result =
      removeKnownOblivionCeremony(
        [
          'ceremony-level-1',
          'ceremony-level-2',
        ],
        'ceremony-level-1',
      )

    assert.deepEqual(
      result,
      [
        'ceremony-level-2',
      ],
    )
  },
)

test(
  'normalización elimina claves inexistentes y duplicadas',
  () => {
    const result =
      normalizeKnownOblivionCeremonies(
        definitions,
        [
          'ceremony-level-1',
          'unknown',
          'ceremony-level-1',
        ],
        1,
        [],
      )

    assert.deepEqual(
      result,
      [
        'ceremony-level-1',
      ],
    )
  },
)

test(
  'normalización elimina Ceremonias cuyos requisitos ya no se cumplen',
  () => {
    const result =
      normalizeKnownOblivionCeremonies(
        definitions,
        [
          'ceremony-level-2',
        ],
        2,
        [],
      )

    assert.deepEqual(
      result,
      [],
    )
  },
)

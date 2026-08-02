import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  normalizeDisciplinePowers,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const draftNormalization = await readFile(
  new URL(
    '../src/features/character-creation/domain/character-draft-normalization.ts',
    import.meta.url,
  ),
  'utf8',
)

const prerequisite = {
  key: 'celerity-prerequisite',
  disciplineKey: 'celerity',
  name: 'Poder previo',
  level: 1,
  active: true,
}

const dependent = {
  key: 'celerity-dependent',
  disciplineKey: 'celerity',
  name: 'Poder dependiente',
  level: 1,
  active: true,
  requirements: {
    prerequisitePowerKeys: [
      'celerity-prerequisite',
    ],
  },
}

test(
  '025-C elimina un Poder cuyo prerrequisito ya no existe',
  () => {
    const result = normalizeDisciplinePowers(
      [prerequisite, dependent],
      [
        {
          key: 'celerity',
          value: 2,
          powerKeys: ['celerity-dependent'],
        },
      ],
    )

    assert.deepEqual(result[0].powerKeys, [])
  },
)

test(
  '025-C conserva una dependencia satisfecha',
  () => {
    const powerKeys = [
      'celerity-prerequisite',
      'celerity-dependent',
    ]
    const result = normalizeDisciplinePowers(
      [prerequisite, dependent],
      [
        {
          key: 'celerity',
          value: 2,
          powerKeys,
        },
      ],
    )

    assert.deepEqual(result[0].powerKeys, powerKeys)
  },
)

test(
  '025-C elimina una Amalgama al perder la Disciplina requerida',
  () => {
    const amalgam = {
      key: 'celerity-amalgam',
      disciplineKey: 'celerity',
      name: 'Amalgama',
      level: 2,
      active: true,
      requirements: {
        amalgam: {
          disciplineKey: 'auspex',
          minimumLevel: 2,
        },
      },
    }

    const result = normalizeDisciplinePowers(
      [amalgam],
      [
        {
          key: 'celerity',
          value: 2,
          powerKeys: ['celerity-amalgam'],
        },
        {
          key: 'auspex',
          value: 1,
          powerKeys: [],
        },
      ],
    )

    assert.deepEqual(result[0].powerKeys, [])
  },
)

test(
  '025-C resuelve en cascada dependencias rotas',
  () => {
    const middle = {
      key: 'celerity-middle',
      disciplineKey: 'celerity',
      name: 'Poder intermedio',
      level: 1,
      active: true,
      requirements: {
        prerequisitePowerKeys: ['celerity-missing'],
      },
    }
    const final = {
      key: 'celerity-final',
      disciplineKey: 'celerity',
      name: 'Poder final',
      level: 1,
      active: true,
      requirements: {
        prerequisitePowerKeys: ['celerity-middle'],
      },
    }

    const result = normalizeDisciplinePowers(
      [middle, final],
      [
        {
          key: 'celerity',
          value: 2,
          powerKeys: [
            'celerity-middle',
            'celerity-final',
          ],
        },
      ],
    )

    assert.deepEqual(result[0].powerKeys, [])
  },
)

test(
  '025-C vuelve a validar tras limitar Poderes por puntuación',
  () => {
    const result = normalizeDisciplinePowers(
      [prerequisite, dependent],
      [
        {
          key: 'celerity',
          value: 1,
          powerKeys: [
            'celerity-dependent',
            'celerity-prerequisite',
          ],
        },
      ],
    )

    assert.deepEqual(result[0].powerKeys, [])
  },
)

test(
  '025-C integra la normalización en toda actualización del borrador',
  () => {
    assert.match(
      draftNormalization,
      /normalizeDisciplinePowers\(/,
    )
    assert.match(
      draftNormalization,
      /disciplinePowerDefinitions/,
    )
  },
)

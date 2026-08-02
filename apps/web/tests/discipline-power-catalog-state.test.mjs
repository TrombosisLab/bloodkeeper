import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'
import {
  getActiveDisciplinePowers,
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'
import {
  canLearnDisciplinePower,
  normalizeDisciplinePowers,
  validateSelectedPowers,
} from '../src/features/character-creation/domain/discipline-power-rules.ts'

const powerSelector = await readFile(
  new URL(
    '../src/features/character-creation/components/DisciplinePowerSelector.tsx',
    import.meta.url,
  ),
  'utf8',
)

const affinitySection = await readFile(
  new URL(
    '../src/features/character-creation/components/thin-blood/DisciplineAffinitySection.tsx',
    import.meta.url,
  ),
  'utf8',
)

const activePower = {
  key: 'celerity-active',
  disciplineKey: 'celerity',
  name: 'Poder activo',
  level: 1,
  active: true,
}

const inactivePower = {
  key: 'celerity-inactive',
  disciplineKey: 'celerity',
  name: 'Poder inactivo',
  level: 1,
  active: false,
}

const disciplines = [
  {
    key: 'celerity',
    value: 1,
    powerKeys: [],
  },
]

test(
  '025-B materializa el estado activo del catálogo canónico',
  () => {
    assert.equal(
      validateDisciplinePowerCatalog(
        disciplinePowerDefinitions,
      ).valid,
      true,
    )
    assert.equal(
      disciplinePowerDefinitions.every(
        (definition) =>
          typeof definition.active === 'boolean',
      ),
      true,
    )
  },
)

test(
  '025-B excluye los Poderes inactivos de las consultas',
  () => {
    assert.deepEqual(
      getActiveDisciplinePowers(
        [activePower, inactivePower],
        'celerity',
      ).map((power) => power.key),
      ['celerity-active'],
    )
  },
)

test(
  '025-B impide aprender o validar un Poder inactivo',
  () => {
    assert.equal(
      canLearnDisciplinePower(
        inactivePower,
        disciplines,
        [],
      ).valid,
      false,
    )

    assert.equal(
      validateSelectedPowers(
        [inactivePower],
        disciplines,
        'celerity',
        ['celerity-inactive'],
      ).valid,
      false,
    )
  },
)

test(
  '025-B elimina Poderes inactivos al normalizar cambios',
  () => {
    const result = normalizeDisciplinePowers(
      [inactivePower],
      [
        {
          ...disciplines[0],
          powerKeys: ['celerity-inactive'],
        },
      ],
    )

    assert.deepEqual(result[0].powerKeys, [])
  },
)

test(
  '025-B aplica el filtro activo en ambos selectores',
  () => {
    assert.match(
      powerSelector,
      /getActiveDisciplinePowers\(/,
    )
    assert.match(
      affinitySection,
      /getActiveDisciplinePowers\(/,
    )
  },
)

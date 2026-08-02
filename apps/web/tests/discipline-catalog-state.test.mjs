import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  disciplineDefinitions,
} from '../src/features/character-creation/data/discipline-definitions.ts'
import {
  filterActiveDisciplineKeys,
  validateDisciplineCatalog,
} from '../src/features/character-creation/domain/discipline-catalog-rules.ts'

const disciplineRules = await readFile(
  new URL(
    '../src/features/character-creation/domain/discipline-rules.ts',
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

test(
  '025-A exige un estado activo explícito en el catálogo',
  () => {
    assert.equal(
      validateDisciplineCatalog(
        disciplineDefinitions,
      ).valid,
      true,
    )
    assert.equal(
      disciplineDefinitions.every(
        (definition) =>
          typeof definition.active === 'boolean',
      ),
      true,
    )
  },
)

test(
  '025-A rechaza claves duplicadas, nombres vacíos y estados inválidos',
  () => {
    const result = validateDisciplineCatalog([
      {
        key: 'celerity',
        name: '',
        active: true,
      },
      {
        key: 'celerity',
        name: 'Celeridad duplicada',
        active: undefined,
      },
    ])

    assert.deepEqual(
      result.violations,
      [
        'DISCIPLINE_NAME_EMPTY',
        'DISCIPLINE_KEY_DUPLICATED',
        'DISCIPLINE_ACTIVE_STATE_INVALID',
      ],
    )
  },
)

test(
  '025-A filtra las Disciplinas inactivas sin alterar sus claves estables',
  () => {
    const definitions = [
      {
        key: 'celerity',
        name: 'Celeridad',
        active: false,
      },
      {
        key: 'potence',
        name: 'Potencia',
        active: true,
      },
    ]

    assert.deepEqual(
      filterActiveDisciplineKeys(
        definitions,
        ['celerity', 'potence'],
      ),
      ['potence'],
    )
    assert.equal(definitions[0].key, 'celerity')
  },
)

test(
  '025-A aplica el estado activo en reglas e interfaces de selección',
  () => {
    assert.match(
      disciplineRules,
      /filterActiveDisciplineKeys\(/,
    )
    assert.match(
      disciplineRules,
      /isDisciplineActive\(/,
    )
    assert.match(
      affinitySection,
      /definition\.active/,
    )
  },
)

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DISCIPLINE_POWER_ADVANCEMENT_RULES_REQUIRED,
  validateDisciplinePowerAcquisition,
} from '../src/features/character-creation/domain/discipline-power-acquisition-rules.ts'

const powerSelector = await readFile(
  new URL(
    '../src/features/character-creation/components/DisciplinePowerSelector.tsx',
    import.meta.url,
  ),
  'utf8',
)

const definitions = [
  {
    key: 'celerity-first',
    disciplineKey: 'celerity',
    name: 'Primer poder',
    level: 1,
    active: true,
  },
  {
    key: 'celerity-second',
    disciplineKey: 'celerity',
    name: 'Segundo poder',
    level: 2,
    active: true,
    requirements: {
      prerequisitePowerKeys: [
        'celerity-first',
      ],
    },
  },
]

const disciplines = [
  {
    key: 'celerity',
    value: 2,
    powerKeys: [],
  },
]

test(
  '025-F autoriza una adquisición válida durante la creación',
  () => {
    const result =
      validateDisciplinePowerAcquisition(
        definitions,
        disciplines,
        'celerity',
        'celerity-first',
        [],
        'characterCreation',
      )

    assert.equal(result.context, 'characterCreation')
    assert.equal(result.structurallyEligible, true)
    assert.equal(result.valid, true)
  },
)

test(
  '025-F aplica el límite inicial sólo al contexto de creación',
  () => {
    const result =
      validateDisciplinePowerAcquisition(
        definitions,
        [
          {
            key: 'celerity',
            value: 1,
            powerKeys: [],
          },
        ],
        'celerity',
        'celerity-second',
        ['celerity-first'],
        'characterCreation',
      )

    assert.equal(result.valid, false)
    assert.match(
      result.errors.join(' '),
      /creación permite 1 poderes/,
    )
  },
)

test(
  '025-F no reutiliza el reparto inicial como regla de evolución',
  () => {
    const result =
      validateDisciplinePowerAcquisition(
        definitions,
        disciplines,
        'celerity',
        'celerity-first',
        [],
        'characterAdvancement',
      )

    assert.equal(result.context, 'characterAdvancement')
    assert.equal(result.structurallyEligible, true)
    assert.equal(result.valid, false)
    assert.deepEqual(
      result.errors,
      [DISCIPLINE_POWER_ADVANCEMENT_RULES_REQUIRED],
    )
  },
)

test(
  '025-F conserva los requisitos estructurales en ambos contextos',
  () => {
    const result =
      validateDisciplinePowerAcquisition(
        definitions,
        disciplines,
        'celerity',
        'celerity-second',
        [],
        'characterAdvancement',
      )

    assert.equal(result.structurallyEligible, false)
    assert.match(
      result.errors.join(' '),
      /Falta el poder previo requerido/,
    )
    assert.ok(
      result.errors.includes(
        DISCIPLINE_POWER_ADVANCEMENT_RULES_REQUIRED,
      ),
    )
  },
)

test(
  '025-F el selector declara explícitamente el contexto de creación',
  () => {
    assert.match(
      powerSelector,
      /validateDisciplinePowerAcquisition\([\s\S]*?'characterCreation'/,
    )
  },
)

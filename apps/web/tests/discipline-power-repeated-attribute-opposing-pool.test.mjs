import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  validateDisciplinePowerCatalog,
} from '../src/features/character-creation/domain/discipline-power-catalog-rules.ts'

const catalog = JSON.parse(
  readFileSync(
    new URL(
      '../../../packages/character-rules/catalogs/discipline-powers.json',
      import.meta.url,
    ),
    'utf8',
  ),
)

const source =
  catalog.find(
    power =>
      power.key ===
        'blood-sorcery-extinguish-vitae',
  )

assert.ok(source)

const makePower = ({
  pool,
  opposingPool,
}) => ({
  ...source,
  key:
    'contract-repeated-attribute-opposing-pool',
  name:
    'Contrato de reserva opuesta repetida',
  disciplineKey: 'oblivion',
  mechanics: {
    systemSummary:
      'Fixture contractual de SPEC-025.A11-M2C.',
    activation: {
      kind: 'standalone',
    },
    rouseCost: {
      kind: 'none',
    },
    duration: {
      kind: 'singleUse',
    },
    checks: [
      {
        key: 'contract-check',
        role: 'activation',
        pool,
        resolution: {
          kind: 'opposed',
          opposingPool,
        },
      },
    ],
  },
})

const attr = key => ({
  kind: 'attribute',
  key,
})

const skill = key => ({
  kind: 'skill',
  key,
})

const discipline = key => ({
  kind: 'discipline',
  key,
})

const violationsFor = fixture =>
  validateDisciplinePowerCatalog(
    [fixture],
  ).violations

test(
  '025-A11-M2C admite exactamente un par de atributos idénticos en opposingPool',
  () => {
    const fixture =
      makePower({
        pool: [
          attr('intelligence'),
          discipline('oblivion'),
        ],
        opposingPool: [
          attr('stamina'),
          attr('stamina'),
        ],
      })

    assert.deepEqual(
      validateDisciplinePowerCatalog(
        [fixture],
      ),
      {
        valid: true,
        violations: [],
      },
    )
  },
)

test(
  '025-A11-M2C sigue rechazando duplicados en la reserva activa',
  () => {
    const fixture =
      makePower({
        pool: [
          attr('stamina'),
          attr('stamina'),
        ],
        opposingPool: [
          attr('resolve'),
          attr('composure'),
        ],
      })

    assert.deepEqual(
      violationsFor(
        fixture,
      ),
      [
        'POWER_MECHANICS_CHECK_POOL_TERM_DUPLICATED',
      ],
    )
  },
)

test(
  '025-A11-M2C sigue rechazando skills duplicadas en opposingPool',
  () => {
    const fixture =
      makePower({
        pool: [
          attr('intelligence'),
          discipline('oblivion'),
        ],
        opposingPool: [
          skill('medicine'),
          skill('medicine'),
        ],
      })

    assert.deepEqual(
      violationsFor(
        fixture,
      ),
      [
        'POWER_MECHANICS_CHECK_POOL_TERM_DUPLICATED',
      ],
    )
  },
)

test(
  '025-A11-M2C no permite tres atributos idénticos en opposingPool',
  () => {
    const fixture =
      makePower({
        pool: [
          attr('intelligence'),
          discipline('oblivion'),
        ],
        opposingPool: [
          attr('stamina'),
          attr('stamina'),
          attr('stamina'),
        ],
      })

    assert.deepEqual(
      violationsFor(
        fixture,
      ),
      [
        'POWER_MECHANICS_CHECK_POOL_TERM_DUPLICATED',
      ],
    )
  },
)

test(
  '025-A11-M2C no permite un duplicado de atributo acompañado de un tercer término',
  () => {
    const fixture =
      makePower({
        pool: [
          attr('intelligence'),
          discipline('oblivion'),
        ],
        opposingPool: [
          attr('stamina'),
          attr('stamina'),
          attr('composure'),
        ],
      })

    assert.deepEqual(
      violationsFor(
        fixture,
      ),
      [
        'POWER_MECHANICS_CHECK_POOL_TERM_DUPLICATED',
      ],
    )
  },
)

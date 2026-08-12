import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'
import { RequestMethod } from '@nestjs/common'

import { DiceController } from '../dist/dice/presentation/dice.controller.js'
import {
  InvalidDiceHistoryRequestError,
  decodeDiceHistoryCursor,
  encodeDiceHistoryCursor,
  parseDiceHistoryQuery,
  toDiceHistoryPageResponse,
} from '../dist/dice/presentation/dice-history.dto.js'

const actorId = '39c1801e-68fe-4c92-8795-723cac284bdf'
const chronicleId = 'c586fa12-50bc-44dd-a4d1-4bbdaec35d99'

test('039-B2 publica listado y detalle autenticados por GET', () => {
  const list = DiceController.prototype.history
  const detail = DiceController.prototype.historyDetail
  assert.equal(Reflect.getMetadata('path', list), 'history')
  assert.equal(Reflect.getMetadata('method', list), RequestMethod.GET)
  assert.equal(Reflect.getMetadata('path', detail), 'history/:rollId')
  assert.equal(Reflect.getMetadata('method', detail), RequestMethod.GET)
})

test('039-B2 valida filtros utiles y limita cada pagina a cincuenta', () => {
  assert.deepEqual(parseDiceHistoryQuery({
    actorId,
    chronicleId,
    source: 'manual',
    description: '  acechar  ',
    limit: '50',
  }), {
    actorId,
    chronicleId,
    source: 'manual',
    description: 'acechar',
    limit: 50,
    cursor: null,
  })
  assert.throws(
    () => parseDiceHistoryQuery({ limit: '51' }),
    InvalidDiceHistoryRequestError,
  )
  assert.throws(
    () => parseDiceHistoryQuery({ unknown: 'x' }),
    InvalidDiceHistoryRequestError,
  )
})

test('039-B2 cursor opaco conserva createdAt e id sin offset', () => {
  const cursor = {
    createdAt: new Date('2026-08-11T20:00:00.000Z'),
    id: actorId,
  }
  const encoded = encodeDiceHistoryCursor(cursor)
  assert.deepEqual(decodeDiceHistoryCursor(encoded), cursor)
  assert.throws(
    () => decodeDiceHistoryCursor('invalid'),
    InvalidDiceHistoryRequestError,
  )
})

test('039-B2 respuesta compacta pagina sin recalcular snapshots', () => {
  const record = {
    id: actorId,
    actorId,
    actorDisplayName: 'Trombosis',
    characterId: null,
    chronicleId: null,
    sessionId: null,
    rerollParentId: null,
    source: 'manual',
    visibility: 'contextual',
    description: 'Acechar',
    rulesVersion: 'v5r-spec-038-v1',
    pool: { finalPool: 3 },
    roll: { totalSuccesses: 2 },
    createdAt: new Date('2026-08-11T20:00:00.000Z'),
  }
  const response = toDiceHistoryPageResponse({
    items: [record],
    nextCursor: { createdAt: record.createdAt, id: record.id },
  })
  assert.equal(response.items[0].pool, record.pool)
  assert.equal(response.items[0].roll, record.roll)
  assert.equal(response.items[0].actorDisplayName, 'Trombosis')
  assert.equal(typeof response.nextCursor, 'string')
})

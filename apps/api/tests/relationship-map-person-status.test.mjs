import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyRelationMap, parseRelationMap, publishRelationCard } from '../dist/chronicles/domain/relationship-map.js'
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12,'0')
const graph = status => ({ ...emptyRelationMap(), cards: [{ id:id(10), pageId:id(1), kind:'npc', state:'hidden', title:'Elena', summary:'', narratorNote:'', x:32, y:32, ...(status === undefined ? {} : { personStatus:status }) }] })
test('person states are optional, persisted and validated in both scopes', () => {
  for (const status of [undefined,'active','deceased','missing']) for (const shared of [false,true]) assert.deepEqual(parseRelationMap(graph(status),shared),graph(status))
  for (const status of ['invalid',null,{},42]) assert.throws(() => parseRelationMap(graph(status),false))
})
test('publication does not leak the private person status', () => {
  const source=graph('deceased')
  const result=publishRelationCard(source,emptyRelationMap(),id(10),id(20))
  assert.equal(result.cards[0].personStatus,undefined)
  result.cards[0].personStatus='missing'
  assert.equal(source.cards[0].personStatus,'deceased')
})

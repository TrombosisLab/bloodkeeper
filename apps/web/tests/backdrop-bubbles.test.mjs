import test from 'node:test'
import assert from 'node:assert/strict'
import { projectBubbles, bubbleLines } from '../src/features/chronicles/domain/backdrop-bubbles.ts'
const group = (id, parentId = null) => ({ id, parentId, title: id, x: 0, y: 0, width: 640, height: 8000, summary: 'Contexto', references: [] })
const note = (id, groupId = null) => ({ id, groupId, title: id, x: 19000, y: -19000, text: '', status: 'idea', time: 'unspecified', knownBy: '', references: [] })
const state = () => ({ version: 2, groups: [group('world'), group('mission','world'), group('agenda','world'), group('other')], notes: [note('secret','agenda'),note('clue','mission'),note('free')], links: [{ id:'a',from:'secret',to:'clue',label:'causes',tentative:true },{id:'b',from:'clue',to:'other',label:'reveals',tentative:false}] })
test('overview renders exactly the actual roots and free notes, with compact independent bubbles', () => {
  const s=state(), before=JSON.stringify(s), view=projectBubbles(s,.8)
  assert.deepEqual(view.layers.map(g=>g.id),['world','other'])
  assert.deepEqual(view.notes.map(n=>n.id),['free'])
  assert.ok(view.layers.every(g=>g.width===640 && g.height===420 && !g.expanded))
  assert.equal(JSON.stringify(s),before)
  for(const count of [1,2,3,7,25]) {
    const v=projectBubbles({...s,groups:Array.from({length:count},(_,i)=>group('g'+i)),notes:[],links:[]},.8)
    assert.equal(v.layers.length,count)
    assert.equal(new Set(v.layers.map(g=>g.x+':'+g.y)).size,count)
  }
})
test('zoom progressively opens internal bubbles without changing parent geometry or saved positions', () => {
  const s=state(), near=projectBubbles(s,1.2), far=projectBubbles(s,.8), deep=projectBubbles(s,4)
  assert.equal(near.layers.find(g=>g.id==='world').expanded,true)
  assert.ok(near.layers.filter(g=>g.depth===1).every(g=>!g.expanded))
  assert.equal(near.notes.some(n=>n.id==='secret'),false)
  assert.equal(deep.notes.some(n=>n.id==='secret'),true)
  const shape=g=>[g.x,g.y,g.width,g.height]
  assert.deepEqual(shape(far.layers[0]),shape(near.layers[0]))
  const mission=near.layers.find(g=>g.id==='mission'),agenda=near.layers.find(g=>g.id==='agenda')
  assert.ok(mission.x+mission.width<=agenda.x)
  assert.ok(mission.y>=near.layers[0].y+near.layers[0].height*.23)
})
test('hidden endpoints aggregate to real visible layers and restore original directions and labels',()=>{
  const s=state(),far=projectBubbles(s,.8),near=projectBubbles(s,1.2),deep=projectBubbles(s,4)
  assert.deepEqual(far.links.map(l=>[l.from,l.to]),[['world','other']])
  assert.ok(near.links.some(l=>l.from==='agenda' && l.to==='mission'))
  assert.ok(deep.links.some(l=>l.from==='secret' && l.to==='clue' && l.tentative))
  assert.equal(deep.links.find(l=>l.from==='secret').originals[0].label,'causes')
  assert.deepEqual(projectBubbles(s,.8).links,far.links)
})
test('scoping enters arbitrarily deep layers without exposing unrelated branches',()=>{
  const s=state();let parent='mission'
  for(let i=0;i<40;i++){s.groups.push(group('nested'+i,parent));parent='nested'+i}
  s.notes.push(note('end',parent))
  const view=projectBubbles(s,1.2,'',parent)
  assert.deepEqual(view.layers.map(g=>g.id),[parent])
  assert.deepEqual(view.notes.map(n=>n.id),['end'])
  assert.equal(view.links.length,0)
})
test('story filtering and summaries do not invent membership or truncate normal titles into single fragments',()=>{
  const s=state();s.groups[1].references=[{kind:'story',id:'story'}]
  const view=projectBubbles(s,1.2,'story')
  assert.deepEqual(view.layers.map(g=>g.id),['world','mission'])
  assert.equal(view.links.length,0)
  const title='Coruña · memoria, poder y humanidad'
  assert.equal(bubbleLines(title,280,4).join(' '),title)
})

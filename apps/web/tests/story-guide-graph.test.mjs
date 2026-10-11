import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildStoryGraph, graphCardId, graphEntryId, storyGraphUrl } from '../src/features/chronicles/domain/story-guide-graph.ts'
import { loadStoryGraph } from '../src/features/chronicles/infrastructure/story-guide-graph.api.ts'
import { routeGuideConnections } from '../src/features/chronicles/domain/story-guide-routing.ts'

const card = (id, links = []) => ({ id, title: id, summary: '', narratorNote: '', kind: 'clue', state: 'hidden', x: 10, y: 20, appearances: [{ pageId: 'other', sourcePageId: 'first', x: 200, y: 400 }], storyLinks: links })
const edge = (id, from, to) => ({ id, from, to, label: 'Significado', color: 'gold' })

test('large cycles unfold into a compact grid without changing their saved topology', () => {
  const cards = Array.from({ length: 9 }, (_, i) => card('cycle-' + i))
  const connections = cards.map((c, i) => edge('loop-' + i, c.id, cards[(i + 1) % cards.length].id))
  const stories = [{ id: 'cycle-story', title: 'Cycle', type: 'main_arc', narratorGuide: { cards, connections } }]
  const before = JSON.stringify(stories)
  const graph = buildStoryGraph(stories)
  const actual = graph.nodes.filter(n => !n.entry)
  assert.equal(new Set(actual.map(n => n.x)).size, 3)
  assert.equal(new Set(actual.map(n => n.y)).size, 3)
  assert.ok(graph.bubbles[0].height <= 600)
  assert.equal(graph.edges.length, 9)
  assert.equal(JSON.stringify(stories), before)
})
test('42-card branching fixture preserves all 57 edges and has no accidental Domicilio-to-Torres shortcut', () => {
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/story-guide-graph-branches.json',import.meta.url),'utf8'))
  const graph=buildStoryGraph(fixture.stories)
  assert.equal(graph.nodes.filter(n=>!n.entry).length,42)
  assert.equal(graph.edges.length,57)
  assert.equal(graph.edges.filter(e=>e.cross).length,8)
  assert.equal(graph.edges.some(e=>e.from===graphCardId('GN1','GN1-T7')&&e.to===graphCardId('GN1','GN1-T14')),false)
  assert.equal(graph.edges.some(e=>e.from===graphCardId('GN1','GN1-T22')&&e.to===graphCardId('GN1','GN1-T16')),true)
  const routes=routeGuideConnections(graph.nodes,graph.edges.map(e=>({...e,label:''})))
  assert.equal(routes.size,57)
  for(const r of routes.values())for(let i=1;i<r.points.length;i++){
    const a=r.points[i-1],b=r.points[i]
    assert.ok(a.x===b.x||a.y===b.y,'Only orthogonal segments')
    for(const n of graph.nodes){
      // Endpoint segments are allowed to touch their own card border, never a card interior.
      assert.ok(!(a.x===b.x?a.x>n.x&&a.x<n.x+n.width&&Math.max(a.y,b.y)>n.y&&Math.min(a.y,b.y)<n.y+n.height:a.y>n.y&&a.y<n.y+n.height&&Math.max(a.x,b.x)>n.x&&Math.min(a.x,b.x)<n.x+n.width),'No route crosses a card')
    }
  }
})
const story = (id, cards = [], connections = [], type = 'secondary_arc') => ({ id, chronicleId: 'chronicle', title: id, type, narratorGuide: { cards, connections }, status: 'planned' })

test('preserves all cards once, directions, cycles, cross links and persisted appearances', () => {
  const stories = [story('main', [card('a', [{ id: 'l1', storyId: 'side', label: 'Inicio' }, { id: 'l2', storyId: 'side', cardId: 'a', label: 'Tarjeta exacta' }]), card('b')], [edge('ab', 'a', 'b'), edge('ba', 'b', 'a')], 'main_arc'), story('side', [card('a')])]
  const before = JSON.stringify(stories), graph = buildStoryGraph(stories)
  assert.equal(JSON.stringify(stories), before)
  assert.equal(graph.nodes.filter(n => !n.entry).length, 3)
  assert.equal(graph.edges.length, 4)
  assert.ok(graph.edges.some(e => e.from === graphCardId('main','a') && e.to === graphEntryId('side')))
  assert.ok(graph.edges.some(e => e.to === graphCardId('side','a')))
  assert.equal(graph.edges.filter(e => e.cross).length, 2)
  assert.equal(graph.edges.filter(e => e.from === graphEntryId('side')).length, 0)
})
test('does not invent connections for isolated cards, empty guides or unavailable links', () => {
  const graph = buildStoryGraph([story('main', [card('a', [{ id: 'missing', storyId: 'absent', label: 'Secret' }])]), story('isolated', [card('a'), card('b')]), { ...story('empty'), narratorGuide: null }])
  assert.equal(graph.bubbles.length, 3)
  assert.equal(graph.edges.length, 0)
  assert.equal(graph.warnings.length, 1)
  assert.equal(graph.nodes.find(n => n.id === graphEntryId('empty')).entry, true)
})
test('multiple main arcs can connect to each other and to secondary stories without merged links', () => {
  const graph = buildStoryGraph([story('first',[card('a',[{id:'link',storyId:'second',cardId:'b',label:'Otro arco'}])],[],'main_arc'),story('second',[card('b',[{id:'link',storyId:'side',label:'Rama'}])],[],'main_arc'),story('side')], 'second')
  assert.equal(graph.bubbles[0].id,'second')
  assert.equal(graph.edges.length,2)
  assert.equal(graph.bubbles.length,3)
})
test('bubbles and cards do not overlap, layout is deterministic and all routes are finite orthogonal paths', () => {
  const stories=[story('main',[card('a',[{id:'1',storyId:'side',label:'Rama'}]),card('b'),card('c')],[edge('1','a','b'),edge('2','b','c'),edge('3','c','a')],'main_arc'),story('side',[card('a'),card('b')]),story('alone')]
  const graph=buildStoryGraph(stories)
  assert.deepEqual(graph,buildStoryGraph(stories))
  for(let i=0;i<graph.bubbles.length;i++)for(let j=i+1;j<graph.bubbles.length;j++){
    const a=graph.bubbles[i],b=graph.bubbles[j]
    assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y))
  }
  const routes=routeGuideConnections(graph.nodes,graph.edges)
  assert.equal(routes.size,graph.edges.length)
  for(const r of routes.values()) {
    assert.ok(!/NaN|Infinity/.test(r.path))
    for(let i=1;i<r.points.length;i++) assert.ok(r.points[i].x===r.points[i-1].x||r.points[i].y===r.points[i-1].y)
  }
})
test('duplicate cards or duplicate stories fail instead of inventing a partial graph', () => {
  assert.throws(()=>buildStoryGraph([story('s',[card('a'),card('a')])]))
  assert.throws(()=>buildStoryGraph([story('s'),story('s')]))
})
test('new tab URL carries identifiers only and uses a separate route', () => {
  const url=new URL(storyGraphUrl('http://192.168.1.84:5173','c','s'))
  assert.equal(url.hash,'#/story-graph');assert.equal(url.searchParams.get('chronicleId'),'c')
  assert.deepEqual([...url.searchParams.keys()],['story-graph','chronicleId','storyId'])
})
const mock=(values)=>{const calls=[];return {calls,fetcher:async(url,init)=>{calls.push({url,init});const value=values.shift();if(value instanceof Response)return value;return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}})}}}
const chronicle={id:'chronicle',narratorId:'narrator',name:'Prueba'}
const notebook={canManage:true,viewerUserId:'narrator'}
test('authorized narrator loads every page using GET no-store and abort signal only', async()=>{
  const m=mock([chronicle,notebook,{items:[story('a')],nextOffset:1},{items:[story('b')],nextOffset:null}])
  const controller=new AbortController(), data=await loadStoryGraph('chronicle','narrator',controller.signal,m.fetcher)
  assert.equal(data.stories.length,2)
  assert.equal(m.calls.length,4)
  m.calls.forEach(c=>{assert.equal(c.init.method,'GET');assert.equal(c.init.cache,'no-store');assert.equal(c.init.signal,controller.signal)})
})
test('participant and outsider cannot read private stories; narrator with inactive permission is denied',async()=>{
  for(const user of ['player','outsider']){const m=mock([chronicle]);await assert.rejects(loadStoryGraph('chronicle',user,new AbortController().signal,m.fetcher));assert.equal(m.calls.length,1)}
  const m=mock([chronicle,{canManage:false,viewerUserId:'narrator'}]);await assert.rejects(loadStoryGraph('chronicle','narrator',new AbortController().signal,m.fetcher));assert.equal(m.calls.length,2)
})
test('server rejection, another chronicle, repeated page or invalid offset fail closed',async()=>{
  for(const values of [
    [new Response('',{status:403})],
    [chronicle,notebook,{items:[{...story('a'),chronicleId:'other'}],nextOffset:null}],
    [chronicle,notebook,{items:[story('a')],nextOffset:0}],
    [chronicle,notebook,{items:[story('a')],nextOffset:1},{items:[story('a')],nextOffset:null}],
  ]) {const m=mock(values);await assert.rejects(loadStoryGraph('chronicle','narrator',new AbortController().signal,m.fetcher))}
})
test('aborted request cannot return secrets',async()=>{
  const c=new AbortController();c.abort()
  const m=mock([chronicle]);await assert.rejects(loadStoryGraph('chronicle','narrator',c.signal,m.fetcher))
})
test('integration remains authenticated, read-only, safe for unsaved editor and resets selection on background',()=>{
  const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8')
  const page=read('features/chronicles/components/ChronicleStoryGraphPage.tsx'),main=read('main.tsx'),editor=read('features/chronicles/components/ChronicleStoryGuideWorkspace.tsx')
  assert.match(main,/<AuthenticationGate>[\s\S]*<App \/>/);assert.match(main,/graphRoute \? <ChronicleStoryGraphPage \/> : <ApplicationWorkspace \/>/)
  assert.match(editor,/target="_blank" rel="noopener noreferrer"/);assert.match(editor,/última versión guardada/)
  assert.match(page,/if \(!d.moved\) clear\(\)/);assert.match(page,/visibilitychange/)
  assert.doesNotMatch(page,/localStorage|sessionStorage|window\.opener|storyGateway\.update|onSave/)
})

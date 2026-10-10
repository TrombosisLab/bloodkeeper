import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { routeGuideConnections } from '../src/features/chronicles/domain/story-guide-routing.ts'
const box = (id,x,y,height=180) => ({id,x,y,width:260,height})
const edge = (id,from,to) => ({id,from,to})
test('routes vertically and backwards using facing sides, without mutating data', () => {
  const boxes=[box('a',32,32),box('b',32,350),box('c',700,32)]
  const edges=[edge('down','a','b'),edge('back','c','a')]
  const snapshot=JSON.stringify([boxes,edges]); const routes=routeGuideConnections(boxes,edges)
  assert.equal(routes.get('down').points[0].y,212)
  assert.equal(routes.get('down').points.at(-1).y,350)
  assert.equal(routes.get('back').points[0].x,700)
  assert.equal(routes.get('back').points.at(-1).x,292)
  assert.equal(JSON.stringify([boxes,edges]),snapshot)
})
test('goes around the intermediate obstacle', () => {
  const route=routeGuideConnections([box('a',32,32),box('obstacle',350,32),box('c',700,32)],[edge('e','a','c')]).get('e')
  for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i]
    assert.ok(!(a.y===b.y && a.y>32 && a.y<212 && Math.min(a.x,b.x)<610 && Math.max(a.x,b.x)>350))
  }
})
test('separates fan-out ports and is deterministic regardless of edge order', () => {
  const boxes=[box('a',32,32),box('b',700,32),box('c',700,350)]
  const edges=[edge('1','a','b'),edge('2','a','c')]
  const routes=routeGuideConnections(boxes,edges)
  assert.notDeepEqual(routes.get('1').points[0],routes.get('2').points[0])
  assert.deepEqual([...routes],[...routeGuideConnections(boxes,[...edges].reverse())])
})
test('handles measured heights, cycles, boundary overlap and missing endpoints', () => {
  const boxes=[box('a',0,0,240),box('b',0,300)]
  const routes=routeGuideConnections(boxes,[edge('1','a','b'),edge('2','b','a'),edge('3','a','missing')])
  assert.equal(routes.size,2); assert.equal(routes.get('1').points[0].y,240)
  for(const r of routes.values()) assert.ok(!/NaN|Infinity/.test(r.path))
  assert.equal(routeGuideConnections([box('a',0,0),box('b',0,0)],[edge('1','a','b')]).size,1)
})
test('labels avoid each other on a spacious fan-out and retain complete text', () => {
  const boxes=[box('a',32,32),box('b',700,32),box('c',700,350)]
  const edges=[{...edge('1','a','b'),label:'Una pista que abre una investigación secundaria con información importante'}, {...edge('2','a','c'),label:'Otra pista de investigación'}]
  const routes=routeGuideConnections(boxes,edges)
  const rect=r=>({x:r.labelX-Math.max(...r.labelLines.map(l=>l.length))*3.5-6,y:r.labelY-11,w:Math.max(...r.labelLines.map(l=>l.length))*7+12,h:r.labelLines.length*14+8})
  const a=rect(routes.get('1')),b=rect(routes.get('2'))
  assert.ok(a.x+a.w<=b.x || b.x+b.w<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y)
  for(const e of edges) assert.equal(routes.get(e.id).labelLines.join(' '),e.label)
})
test('selection only changes presentation; blank canvas clears focus and muted arrows remain visible', () => {
  const ui=readFileSync(new URL('../src/features/chronicles/components/ChronicleStoryGuideWorkspace.tsx',import.meta.url),'utf8')
  const css=readFileSync(new URL('../src/features/chronicles/components/chronicle-story-guide-workspace.css',import.meta.url),'utf8')
  assert.match(ui,/selectedId === connection.from \|\| selectedId === connection.to/)
  assert.match(ui,/closest\('\.story-guide-card'\)\) setSelectedId\(null\)/)
  assert.match(css,/g\.is-muted \{ opacity: \.32;/)
})
test('dense laboratory labels never overlap cards or previously placed labels', () => {
  const boxes=Array.from({length:9},(_,i)=>box(String(i),32+i%3*318,32+Math.floor(i/3)*240,i===8?232:169))
  const pairs=[[0,2],[0,3],[0,4],[0,5],[2,0],[2,3],[3,0],[3,6],[4,6],[5,6],[5,8],[6,7],[7,6],[7,0],[8,1]]
  const edges=pairs.map(([a,b],i)=>({...edge(String(i),String(a),String(b)),label:`Caso ${i} · Comprobar etiqueta legible`}))
  const routes=routeGuideConnections(boxes,edges)
  const rects=[]
  const overlaps=(a,b)=>a.x<b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y
  for(const route of routes.values()){
    const width=Math.max(...route.labelLines.map(l=>l.length))*8+16
    const rect={x:route.labelX-width/2,y:route.labelY-11,width,height:route.labelLines.length*14+8}
    assert.ok(!boxes.some(b=>overlaps(rect,b)), 'label hidden by card')
    assert.ok(!rects.some(b=>overlaps(rect,b)), 'labels overlap')
    rects.push(rect)
  }
  assert.equal(routes.size,15)
})

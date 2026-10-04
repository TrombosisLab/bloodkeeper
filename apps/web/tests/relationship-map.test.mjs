import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { relationTypes, relationColor, relationLabel, removeRelationCard } from '../src/features/chronicle-space/domain/relationship-map.ts'
import { normalizeGuidePages, continueGuideOnNewPage, guidePageCards, updateGuideCardPosition } from '../src/features/chronicles/domain/story-guide-pages.ts'
const map=()=>normalizeGuidePages({cards:[{id:'a',kind:'npc',state:'hidden',title:'Elena',summary:'Privado',narratorNote:'Privado',x:400,y:80,reference:{type:'NPC',id:'npc'}}],connections:[]})
test('fourteen presets have colors; custom type can choose one',()=>{
  assert.equal(relationTypes.length,14);assert.equal(new Set(relationTypes.map(t=>t.id)).size,14)
  for(const t of relationTypes) assert.match(relationColor({relationType:t.id}),/^#[a-f0-9]{6}$/i)
  assert.equal(relationColor({relationType:'custom',customColor:'#aabbcc'}),'#aabbcc')
  assert.equal(relationLabel({relationType:'friendship',label:''}),'Amistad / confianza')
})
test('continuation keeps canonical references and separate positions, without making new people',()=>{
  const before=map(),page=before.pages[0].id
  let after=continueGuideOnNewPage(before,'a',page,'b','Otra página')
  after=updateGuideCardPosition(after,'a','b',60,70)
  assert.equal(after.cards.length,1);assert.equal(after.cards[0].x,400)
  assert.equal(guidePageCards(after,'b')[0].x,60)
  assert.deepEqual(guidePageCards(after,'b')[0].reference,{type:'NPC',id:'npc'})
})
test('remove person also removes all incident relationships',()=>{
  const graph=map();graph.connections=[{id:'e',from:'a',to:'b',relationType:'love'}]
  const next=removeRelationCard(graph,'a');assert.equal(next.cards.length,0);assert.equal(next.connections.length,0)
})
const ui=readFileSync(new URL('../src/features/chronicle-space/components/RelationshipMaps.tsx',import.meta.url),'utf8')
test('other public maps are read-only and publication is disabled until private save',()=>{
  assert.match(ui,/scope === 'shared' && ownerId !== own\?\.ownerId/)
  assert.match(ui,/if \(!own \|\| dirty \|\| saving \|\| scope !== 'private'\)/)
  assert.match(ui,/disabled=\{dirty\|\|saving\}/)
  assert.match(ui,/onOpenReference\(selected.title,selected.reference!\.type,selected.reference!\.id\)/)
  assert.match(ui,/getRandomValues|relationId\(\)/)
})
test('map updates keep graph data out of local storage and respect server conflicts',()=>{
  assert.doesNotMatch(ui,/localStorage|sessionStorage/)
  const api=readFileSync(new URL('../src/features/chronicle-space/infrastructure/relationship-map.api.ts',import.meta.url),'utf8')
  assert.match(api,/credentials: 'include'/)
  assert.match(api,/JSON.stringify\(\{ revision, cardId, visible \}\)/)
  assert.doesNotMatch(api,/ownerId.*method: 'PATCH'/)
})
test('manual documents private/shared access and publication restrictions',()=>{
  const manual=readFileSync(new URL('../src/features/manual/components/ManualPage.tsx',import.meta.url),'utf8')
  assert.match(manual,/Relaciones: mapa privado y mapas compartidos/)
  assert.match(manual,/no se copian descripción, nota privada, relaciones, posiciones ni páginas/)
})

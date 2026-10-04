import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRelationMap, emptyRelationMap, publishRelationCard, removeRelationCard } from '../dist/chronicles/domain/relationship-map.js'
import { RelationshipMapController } from '../dist/chronicles/presentation/relationship-map.controller.js'
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12,'0')
const card = (n, fields={}) => ({ id:id(n), pageId:id(1), kind:'npc',state:'hidden',title:'Elena',summary:'Secreto en descripción',narratorNote:'Traición privada',x:420,y:160,...fields })
const privateMap = () => ({...emptyRelationMap(),cards:[card(10,{reference:{type:'NPC',id:id(90)}}),card(11)],connections:[{id:id(20),from:id(10),to:id(11),label:'Sospecha secreta',color:'rose',relationType:'suspicion',direction:'forward'}]})
test('publication copies only name and reference, not private graph data',()=>{
  const privateGraph=privateMap(), publicGraph=emptyRelationMap()
  const result=publishRelationCard(privateGraph,publicGraph,id(10),id(30))
  assert.equal(result.cards[0].summary,'');assert.equal(result.cards[0].narratorNote,'')
  assert.equal(result.cards[0].x,32);assert.equal(result.cards[0].appearances,undefined)
  assert.equal(result.connections.length,0);assert.equal(result.pages.length,1)
  assert.deepEqual(result.cards[0].reference,{type:'NPC',id:id(90)})
  assert.equal(privateGraph.cards[0].narratorNote,'Traición privada')
  assert.deepEqual(publishRelationCard(privateGraph,result,id(10),id(31)),result)
  assert.deepEqual(parseRelationMap(result,true),result)
})
test('retraction removes all appearances and associated public edges',()=>{
  const map=publishRelationCard(privateMap(),emptyRelationMap(),id(10),id(30))
  map.cards.push(card(31,{narratorNote:'',summary:''}))
  map.connections.push({id:id(40),from:id(30),to:id(31),label:'Amigos',color:'rose',relationType:'friendship',direction:'both'})
  const result=removeRelationCard(map,id(30));assert.equal(result.cards.length,1);assert.equal(result.connections.length,0)
})
test('presets, arrows, custom colors, multiple relations and continuation graphs validate',()=>{
  const map=privateMap();map.connections.push({...map.connections[0],id:id(21),relationType:'love',direction:'none'})
  map.connections.push({...map.connections[0],id:id(22),relationType:'custom',label:'Protege su secreto',customColor:'#aabbcc',direction:'both'})
  map.pages.push({id:id(2),title:'Otra página'});map.cards[0].appearances=[{pageId:id(2),sourcePageId:id(1),x:32,y:32}]
  assert.deepEqual(parseRelationMap(map,false),map)
})
test('invalid data and private fields in a shared map are rejected',()=>{
  assert.throws(()=>parseRelationMap(privateMap(),true))
  for(const fields of [{reference:{type:'NPC',id:'bad'}},{sourceId:id(3)},{x:NaN},{appearances:[{pageId:id(2),sourcePageId:id(2),x:32,y:32}]}]) {
    const map=privateMap();map.cards[0]={...map.cards[0],...fields};assert.throws(()=>parseRelationMap(map,false))
  }
  for(const fields of [{relationType:'evil'},{direction:'evil'},{relationType:'custom',label:''},{relationType:'custom',label:'X',customColor:'url(secret)'},{to:id(99)}]) {
    const map=privateMap();map.connections[0]={...map.connections[0],...fields};assert.throws(()=>parseRelationMap(map,false))
  }
  assert.throws(()=>parseRelationMap({...emptyRelationMap(),privateMap:privateMap()},true))
})
function fixture(actorId=id(100), narrator=id(100), members=[id(101)]) {
  const rows=new Map()
  const get=where=>rows.get(where.chronicleId_userId.userId)
  const db={chronicle:{findUnique:async()=>({narratorId:narrator,participants:members.map(userId=>({userId}))})},chronicleRelationshipMap:{
    findUnique:async({where,select})=>{const row=get(where); if(!row)return null;return select?Object.fromEntries(Object.keys(select).map(k=>[k,row[k]])):row},
    create:async({data})=>{if(rows.has(data.userId))throw Object.assign(new Error(),{code:'P2002'});const row=structuredClone(data);rows.set(data.userId,row);return row},
    updateMany:async({where,data})=>{const row=rows.get(where.userId);if(!row||row.revision!==where.revision)return {count:0};rows.set(where.userId,{...row,...data,revision:row.revision+1});return {count:1}},
    findMany:async({where})=>[...rows.values()].filter(r=>where.userId.in.includes(r.userId)).map(r=>({...r,user:{displayName:r.userId}})),
  }}
  return {controller:new RelationshipMapController(db),req:{user:{id:actorId,roles:['admin','narrator']}},rows}
}
test('only active chronicle members can access any map; global roles do not bypass membership',async()=>{
  const {controller,req}=fixture(id(999))
  await assert.rejects(()=>controller.me(id(50),req),e=>e.getStatus()===403)
  await assert.rejects(()=>controller.shared(id(50),id(100),req),e=>e.getStatus()===403)
  await assert.rejects(()=>controller.save(id(50),'private',req,{revision:0,map:emptyRelationMap()}),e=>e.getStatus()===403)
  await assert.rejects(()=>controller.me(id(50),{}),e=>e.getStatus()===401)
})
test('private maps are only returned to their owner, shared responses never contain them',async()=>{
  const {controller,req,rows}=fixture()
  rows.set(id(101),{userId:id(101),revision:1,privateMap:privateMap(),sharedMap:emptyRelationMap()})
  const own=await controller.me(id(50),req);assert.equal(own.privateMap.cards.length,0)
  const shared=await controller.shared(id(50),id(101),req)
  assert.equal(shared.privateMap,undefined);assert.doesNotMatch(JSON.stringify(shared),/Traición|Sospecha secreta/)
  await assert.rejects(()=>controller.shared(id(50),id(999),req),e=>e.getStatus()===403)
})
test('save derives owner from authentication and refuses forged owner/scope/revision',async()=>{
  const {controller,req,rows}=fixture(id(101))
  const result=await controller.save(id(50),'private',req,{revision:0,map:privateMap()})
  assert.equal(result.ownerId,id(101));assert.equal(rows.has(id(100)),false)
  await assert.rejects(()=>controller.save(id(50),'private',req,{revision:1,map:privateMap(),ownerId:id(100)}),e=>e.getStatus()===400)
  await assert.rejects(()=>controller.save(id(50),'private',req,{revision:0,map:privateMap()}),e=>e.getStatus()===409)
  await assert.rejects(()=>controller.save(id(50),'evil',req,{revision:1,map:privateMap()}),e=>e.getStatus()===400)
})
test('publication, independent public edits and retraction persist without leaking the private map',async()=>{
  const {controller,req}=fixture(id(101))
  await controller.save(id(50),'private',req,{revision:0,map:privateMap()})
  let row=await controller.publication(id(50),req,{revision:1,cardId:id(10),visible:true})
  const publicCard=row.sharedMap.cards[0]
  assert.equal(publicCard.narratorNote,'');assert.equal(row.sharedMap.connections.length,0)
  row.sharedMap.cards[0].title='Nombre público';row.sharedMap.cards[0].summary='Descripción pública'
  row=await controller.save(id(50),'shared',req,{revision:2,map:row.sharedMap})
  assert.equal(row.privateMap.cards[0].title,'Elena')
  row=await controller.publication(id(50),req,{revision:3,cardId:id(10),visible:false})
  assert.equal(row.sharedMap.cards.length,0);assert.equal(row.privateMap.cards.length,2)
})
test('removing a private source retracts its publication; provenance cannot be forged',async()=>{
  const {controller,req}=fixture()
  await controller.save(id(50),'private',req,{revision:0,map:privateMap()})
  const row=await controller.publication(id(50),req,{revision:1,cardId:id(10),visible:true})
  const tampered=structuredClone(row.sharedMap);tampered.cards[0].sourceId=id(11)
  await assert.rejects(()=>controller.save(id(50),'shared',req,{revision:2,map:tampered}),e=>e.getStatus()===400)
  const next=await controller.save(id(50),'private',req,{revision:2,map:removeRelationCard(row.privateMap,id(10))})
  assert.equal(next.sharedMap.cards.length,0)
})
test('shared selector omits empty maps and retired owners',async()=>{
  const {controller,req,rows}=fixture()
  const graph=publishRelationCard(privateMap(),emptyRelationMap(),id(10),id(30))
  rows.set(id(100),{userId:id(100),sharedMap:emptyRelationMap(),privateMap:privateMap()})
  rows.set(id(101),{userId:id(101),sharedMap:graph,privateMap:privateMap()})
  rows.set(id(999),{userId:id(999),sharedMap:graph,privateMap:privateMap()})
  assert.deepEqual(await controller.list(id(50),req),[{ownerId:id(101),name:id(101)}])
})
test('optimistic locking refuses an update lost to another session',async()=>{
  const {controller,req,rows}=fixture()
  await controller.save(id(50),'private',req,{revision:0,map:privateMap()})
  controller.database.chronicleRelationshipMap.updateMany=async()=>({count:0})
  await assert.rejects(()=>controller.save(id(50),'private',req,{revision:1,map:emptyRelationMap()}),e=>e.getStatus()===409)
  assert.equal(rows.get(id(100)).privateMap.cards.length,2)
})

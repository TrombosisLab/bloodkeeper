import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bubbleOverviewView, MIN_BUBBLE_SCALE, projectBubbles } from '../src/features/chronicles/domain/backdrop-bubbles.ts'
const group=(id,parentId=null)=>({id,parentId,title:id,x:0,y:0,width:640,height:420,references:[]})
test('17 root elements fit the full overview below 40 percent on desktop and mobile',()=>{
 const state={version:2,groups:Array.from({length:17},(_,i)=>group('g'+i)),notes:[],links:[]}
 const view=projectBubbles(state,.01),before=JSON.stringify(state)
 for(const viewport of [{width:1180,height:480},{width:390,height:320}]){
  const camera=bubbleOverviewView(view.layers,viewport)
  assert.ok(camera.scale<.4 && camera.scale>=MIN_BUBBLE_SCALE)
  for(const layer of view.layers){
   assert.ok(layer.x*camera.scale+camera.x>=23)
   assert.ok(layer.y*camera.scale+camera.y>=23)
   assert.ok((layer.x+layer.width)*camera.scale+camera.x<=viewport.width-23)
   assert.ok((layer.y+layer.height)*camera.scale+camera.y<=viewport.height-23)
  }
 }
 assert.equal(JSON.stringify(state),before)
})
test('one or two roots still fit naturally without expanding them on arrival',()=>{
 const box=id=>({id,x:0,y:0,width:640,height:420})
 assert.equal(bubbleOverviewView([box('a')],{width:1180,height:700}).scale,.8)
 assert.ok(bubbleOverviewView([box('a'),{...box('b'),x:760}],{width:1180,height:480}).scale>=.4)
})
test('a crowded layer does not unfold until its child titles have enough room',()=>{
 const state={version:2,groups:[group('root'),...Array.from({length:25},(_,i)=>group('child'+i,'root'))],notes:[],links:[]}
 const before=JSON.stringify(state)
 assert.equal(projectBubbles(state,1.2).layers.length,1)
 const opened=projectBubbles(state,4)
 assert.equal(opened.layers.length,26)
 for(const layer of opened.layers.filter(g=>g.depth===1)){
  assert.ok(layer.width*4>=140);assert.ok(layer.height*4>=95)
 }
 assert.equal(JSON.stringify(state),before)
})
test('small bubbles retain an identifying label and wheel rebinds for automatic/manual mode',()=>{
 const component=readFileSync(new URL('../src/features/chronicles/components/BackdropBubbleLabel.tsx',import.meta.url),'utf8')
 assert.doesNotMatch(component,/return null/)
 assert.match(component,/data-compact-label/)
 const workspace=readFileSync(new URL('../src/features/chronicles/components/ChronicleBackdropWorkspace.tsx',import.meta.url),'utf8')
 assert.equal(MIN_BUBBLE_SCALE,.03)
 assert.doesNotMatch(workspace,/automatic \? MIN_BUBBLE_SCALE : \.03/)
 assert.match(workspace,/Math.max\(MIN_BUBBLE_SCALE/)
 assert.match(workspace,/denied, automatic\]/)
 assert.match(workspace,/passive: false/)
})

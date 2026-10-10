import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
test('legend and selector share all four existing color values without rewriting data',()=>{
 const ui=read('../src/features/chronicles/components/ChronicleStoryGuideWorkspace.tsx')
 for(const [value,label] of [['rose','Peligro'],['gold','Pista'],['blue','Desplazamiento'],['green','Alternativa']]) assert.match(ui,new RegExp(`value: '${value}', label: '[^']*${label}`))
 assert.match(ui,/<details className="story-guide__color-legend">/)
 assert.match(ui,/Leyenda de flechas/)
 assert.match(ui,/Las flechas anteriores conservan su color/)
 assert.match(ui,/colors\.map\(color =>/)
})
test('manual explains legacy colors, card types and privacy',()=>{
 const manual=read('../src/features/manual/components/ManualPage.tsx')
 for(const text of ['significado de los colores de las flechas','mantienen su color original','No se reclasifican','no alteran permisos','los colores de las tarjetas siguen distinguiendo su tipo']) assert.ok(manual.includes(text),text)
})

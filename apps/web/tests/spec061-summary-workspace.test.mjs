import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const component=readFileSync(new URL('../src/features/chronicles/components/ChronicleSummaryWorkspace.tsx',import.meta.url),'utf8')
test('SPEC-061-B2 resume datos reales en tres zonas',()=>{for(const value of [/Historias activas/,/Actividad reciente/,/Pulso de la cr(?:ó|&oacute;)nica/,/gateway\.sessions/,/storyGateway\.list/,/gateway\.events/])assert.match(component,value)})
test('SPEC-061-B2 ofrece atajos hacia los espacios existentes',()=>{for(const value of ["onNavigate('sessions')","onNavigate('stories')","onNavigate('timeline')"])assert.equal(component.includes(value),true)})

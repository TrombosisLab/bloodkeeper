import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const component=readFileSync(new URL('../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx',import.meta.url),'utf8')
const detail=readFileSync(new URL('../src/features/chronicles/components/ChronicleDetail.tsx',import.meta.url),'utf8')
test('SPEC-061-C ofrece búsqueda filtros y selección de participantes',()=>{for(const value of ['Buscar participantes','Todos los roles','Todos los estados','selectedId','Personaje asociado','Permisos en la crónica'])assert.equal(component.includes(value),true)})
test('SPEC-061-C reutiliza incorporación y retirada seguras existentes',()=>{assert.equal(detail.includes('ChronicleParticipantsWorkspace'),true);assert.equal(component.includes('onOpenAdmin'),true);assert.equal(component.includes('onRetire'),true)})
test('SPEC-061-C muestra la experiencia canónica del personaje asociado',()=>{assert.match(component,/createCharacterExperienceGateway/);assert.match(component,/experience\?\.total/);assert.match(component,/experience\?\.available/);assert.match(component,/experienceGateway\.load/)})

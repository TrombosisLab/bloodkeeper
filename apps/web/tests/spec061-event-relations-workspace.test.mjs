import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const panel=readFileSync(new URL('../src/features/chronicles/components/ChronicleEventRelationsPanel.tsx',import.meta.url),'utf8')
const api=readFileSync(new URL('../src/features/chronicles/infrastructure/chronicle-event-relations.api.ts',import.meta.url),'utf8')
test('SPEC-061-F2B relaciona Evento con Personajes PNJ y Localizaciones',()=>{for(const value of ['Personajes','PNJ','Localizaciones','characterIds','npcIds','locationIds','Guardar vínculos'])assert.equal(panel.includes(value),true)})
test('SPEC-061-F2B usa la API privada de relaciones y preserva archivo',()=>{assert.equal(api.includes('/relations'),true);assert.equal(panel.includes("event.status==='active'"),true)})

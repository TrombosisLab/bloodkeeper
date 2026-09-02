import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const controller=readFileSync(new URL('../src/chronicles/presentation/chronicle-event-relations.controller.ts',import.meta.url),'utf8')
const useCase=readFileSync(new URL('../src/chronicles/application/manage-chronicle-event-relations.use-case.ts',import.meta.url),'utf8')
test('SPEC-061-F2 publica lectura y reemplazo de relaciones de Evento',()=>{assert.equal(controller.includes("events/:eventId/relations"),true);assert.equal(controller.includes('@Get()'),true);assert.equal(controller.includes('@Patch()'),true);assert.equal(controller.includes('CHRONICLE_EVENT_PERMISSION_DENIED'),true)})
test('SPEC-061-F2 limita relaciones a recursos de la Crónica y reemplaza atómicamente',()=>{for(const value of ['chronicleEventCharacter.deleteMany','chronicleEventNpc.deleteMany','chronicleEventLocation.deleteMany','$transaction','chronicleId'])assert.equal(useCase.includes(value),true)})

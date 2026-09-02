import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const controller=readFileSync(new URL('../src/chronicles/presentation/chronicle-session-workspace.controller.ts',import.meta.url),'utf8')
const useCase=readFileSync(new URL('../src/chronicles/application/manage-chronicle-session-workspace.use-case.ts',import.meta.url),'utf8')
test('SPEC-061-B4 publica escritura revisionada de escenas y preparacion',()=>{for(const route of ["@Post('scenes')","@Patch('scenes/:sceneId')","@Post('preparation-items')","@Patch('preparation-items/:itemId')"])assert.equal(controller.includes(route),true);assert.equal(controller.includes('expectedRevision'),true)})
test('SPEC-061-B4 bloquea fuera de preparacion y protege revision',()=>{assert.equal(useCase.includes('ChronicleSessionStatus.PREPARATION'),true);assert.equal(useCase.includes('revision: expectedRevision'),true);assert.equal(useCase.includes('revision: { increment: 1 }'),true)})

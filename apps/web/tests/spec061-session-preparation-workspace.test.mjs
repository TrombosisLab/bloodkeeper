import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const component=readFileSync(new URL('../src/features/chronicles/components/ChronicleSessionPreparationWorkspace.tsx',import.meta.url),'utf8')
const api=readFileSync(new URL('../src/features/chronicles/infrastructure/chronicle-session-workspace.api.ts',import.meta.url),'utf8')
const panel=readFileSync(new URL('../src/features/chronicles/components/ChronicleSessionPanel.tsx',import.meta.url),'utf8')
const preparationCss=readFileSync(new URL('../src/features/chronicles/components/chronicle-session-preparation-workspace.css',import.meta.url),'utf8')
test('SPEC-061-E1 integra escenas y preparacion persistentes',()=>{for(const value of ['Escenas de la sesión','Lista de preparación','createScene','updateScene','createPreparationItem','updatePreparationItem'])assert.equal((component+api).includes(value),true)})
test('SPEC-061-E1 conserva contexto y solo lectura terminal',()=>{assert.equal(component.includes('ChronicleSessionContextPanel'),true);assert.equal(component.includes("session.status==='preparation'"),true);assert.equal(panel.includes('ChronicleSessionPreparationWorkspace'),true)})

test('SPEC-061-E1 mantiene checks compactos y alineados a la izquierda',()=>{assert.equal(preparationCss.includes('session-preparation-compact-checkbox-layout-v1'),true);assert.equal(preparationCss.includes('grid-template-columns: 1rem minmax(0, 1fr)'),true);assert.equal(preparationCss.includes("input[type='checkbox']"),true)})

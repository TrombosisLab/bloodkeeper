import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const panel=readFileSync(new URL('../src/features/chronicles/components/ChronicleSessionPanel.tsx',import.meta.url),'utf8')
const side=readFileSync(new URL('../src/features/chronicles/components/ChronicleSessionOperationalSidebar.tsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/features/chronicles/components/chronicle-session-panel.css',import.meta.url),'utf8')
test('SPEC-061-E2 dispone navegador trabajo y contexto',()=>{assert.equal(css.includes('minmax(16rem, 0.27fr)'),true);assert.equal(css.includes('minmax(17rem, 0.32fr)'),true);assert.equal(panel.includes('ChronicleSessionOperationalSidebar'),true)})
test('SPEC-061-E2 muestra métricas reales y privacidad',()=>{for(const value of ['workspace?.scenes.length','workspace?.progress','characterCount','Privacidad'])assert.equal(side.includes(value),true)})

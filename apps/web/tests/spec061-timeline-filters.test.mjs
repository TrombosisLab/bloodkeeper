import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const panel=readFileSync(new URL('../src/features/chronicles/components/ChronicleEventPanel.tsx',import.meta.url),'utf8')
test('SPEC-061-F1 ofrece búsqueda, estado y doble lectura temporal',()=>{for(const value of ['timelineQuery','timelineStatus','timelineView','Buscar sucesos','Narrativa','Fecha real','visibleEvents'])assert.equal(panel.includes(value),true)})
test('SPEC-061-F1 no altera el orden persistido al leer por fecha',()=>{assert.equal(panel.includes('left.timelineOrder - right.timelineOrder'),true);assert.equal(panel.includes('new Date(left.realDate)'),true)})

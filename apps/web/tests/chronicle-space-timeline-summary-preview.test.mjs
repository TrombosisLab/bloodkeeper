import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')
const start = component.indexOf('<div className="timeline">')
const end = component.indexOf('<section className="timeline-independent">', start)
assert.notEqual(start, -1, 'Se encuentra la cronología')
assert.notEqual(end, -1, 'Se encuentra el cierre de la cronología')
const timeline = component.slice(start, end)

test('la tarjeta muestra un avance de 160 caracteres y despliega el resumen completo', () => {
  assert.match(timeline, /<p>\{session\.summary \? \(session\.summary\.length > 160 \? session\.summary\.slice\(0, 160\)\.trimEnd\(\) \+ '…' : session\.summary\) : 'Esta sesión todavía no tiene un resumen\.'\}<\/p>/)
  assert.match(timeline, /session\.summary && session\.summary\.length > 160 \? <details className="timeline-card__summary"><summary>Leer resumen completo<\/summary><p>\{session\.summary\}<\/p><\/details> : null/)
  assert.doesNotMatch(timeline, /<details className="timeline-card__summary" open/)
})

test('fecha, estado y anotaciones siguen dentro de la tarjeta junto al resumen plegable', () => {
  const metadata = timeline.match(/<small className="timeline-card__meta">([\s\S]*?)<\/small>/)?.[1]
  assert.ok(metadata, 'la tarjeta conserva su bloque de metadatos')
  assert.match(metadata, /session\.status === 'completed'/)
  assert.match(metadata, /session\.realDate/)
  assert.match(timeline, /timeline-card__note-count/)
  assert.match(timeline, /timeline-card__notes/)
  assert.match(timeline, /Abrir sesión/)
  assert.match(styles, /INVESTIGATION_TIMELINE_SUMMARY_DISCLOSURE_V1/)
  assert.match(styles, /\.timeline-card__summary summary[^}]*cursor:\s*pointer/)
})

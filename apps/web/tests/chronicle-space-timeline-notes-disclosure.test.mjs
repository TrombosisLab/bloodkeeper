import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')
const start = component.indexOf('<div className="timeline">')
const end = component.indexOf('<section className="timeline-independent">', start)
assert.notEqual(start, -1)
assert.notEqual(end, -1)
const timeline = component.slice(start, end)

test('el contador de anotaciones permanece visible y su lista se despliega al pedirla', () => {
  assert.match(timeline, /<span className="timeline-card__note-count">\{sessionNotes\.length \?/)
  assert.match(timeline, /<details className="timeline-card__notes"><summary>\{sessionNotes\.length === 1 \? 'ANOTACIÓN DE LA SESIÓN' : 'ANOTACIONES DE LA SESIÓN'\}<\/summary>/)
  assert.match(timeline, /\{sessionNotes\.map\(\(note\) => <button className="timeline-note"/)
  assert.doesNotMatch(timeline, /<details className="timeline-card__notes" open/)
  assert.match(styles, /\.timeline-card__notes>summary\{[^}]*cursor:pointer/)
})

test('la acción de abrir sesión se conserva después del bloque plegable', () => {
  assert.match(timeline, /<\/details> : null}<\/div><div className="timeline-card__aside">[\s\S]*Abrir sesión/)
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const timelineStart = component.indexOf('<div className="timeline">')
const timelineEnd = component.indexOf('<section className="timeline-independent">', timelineStart)
const timeline = component.slice(timelineStart, timelineEnd)

test('la cronología distingue la fecha real de juego de las fechas narrativas del resumen', () => {
  assert.ok(timelineStart >= 0 && timelineEnd > timelineStart)
  const metadata = timeline.match(/<small className="timeline-card__meta">([\s\S]*?)<\/small>/)?.[1]
  assert.ok(metadata, 'la fecha de juego se muestra en los metadatos')
  assert.match(metadata, /session\.realDate \? dateLabel\(session\.realDate\) : 'Sin fecha'/)
  assert.doesNotMatch(metadata, /session\.summary/)
})

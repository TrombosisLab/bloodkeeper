import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')
const marker = 'BLOODKEEPER_TIMELINE_CARD_METADATA_QOL_V2'

test('la tarjeta prioriza el estado y presenta una fecha breve o «Sin fecha»', () => {
  assert.match(component, /<small className="timeline-card__meta"><span>\{session\.status === 'completed' \? 'Completada' : session\.status === 'preparation' \? 'En preparación' : 'Archivada'\}<\/span><span aria-hidden="true">·<\/span><span>\{session\.realDate \? dateLabel\(session\.realDate\) : 'Sin fecha'\}<\/span><\/small>/)
  assert.doesNotMatch(component, /Fecha de juego sin registrar/)
})

test('los metadatos ya no heredan el énfasis en mayúsculas de la tarjeta', () => {
  const metadataStyle = styles.slice(styles.lastIndexOf(marker))
  assert.match(metadataStyle, /\.timeline-card small\.timeline-card__meta\{[^}]*text-transform:none/)
  assert.match(metadataStyle, /flex-wrap:wrap/)
  assert.match(metadataStyle, /\.timeline-card small\.timeline-card__meta span:first-child\{[^}]*font-weight:750/)
})

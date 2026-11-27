import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [participants, styles] = await Promise.all([
  source('../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx'),
  source('../src/features/chronicles/components/chronicle-participants-workspace.css'),
])

test('en móvil se puede alternar entre directorio y detalle sin cambiar el escritorio', () => {
  assert.match(participants, /mobileDetailOpen \? ' chronicle-participants-workspace--mobile-detail'/)
  assert.match(participants, /className="participant-mobile-back"[\s\S]*?← Participantes/)
  assert.match(participants, /setMobileDetailOpen\(isMobile\)/)
  assert.match(styles, /@media \(max-width: 780px\)[\s\S]*?chronicle-participants-workspace__detail,[\s\S]*?display:none/)
  assert.match(styles, /chronicle-participants-workspace--mobile-detail[\s\S]*?__detail,[\s\S]*?display:grid/)
})

test('los retratos usan el acceso de imagen de la crónica y conservan una silueta de respaldo', () => {
  assert.match(participants, /\/api\/chronicles\/\$\{encodeURIComponent\(chronicleId\)\}\/assets\/CHARACTER\/\$\{encodeURIComponent\(character\.characterId\)\}\/image/)
  assert.match(participants, /alt=\{`Retrato de \$\{character\.name/)
  assert.match(participants, /onError=\{\(\) => setImageFailed\(true\)\}/)
  assert.match(participants, /itemCharacter \? <ParticipantCharacterPortrait/)
  assert.match(participants, /<ParticipantCharacterPortrait chronicleId=\{chronicleId\} character=\{character\}/)
  assert.match(participants, /character-status-block"><ParticipantCharacterPortrait/)
  assert.match(styles, /\.participant-character-portrait img\{[^}]*object-fit:cover/)
})

test('los filtros quedan etiquetados y las métricas/permisos se compactan en móvil', () => {
  assert.match(participants, /className="participant-filter"><span>Rol<\/span>/)
  assert.match(participants, /className="participant-filter"><span>Estado<\/span>/)
  assert.match(participants, /className="participant-permissions-toggle"[^>]*aria-expanded=\{accessExpanded\}/)
  assert.match(styles, /@media \(max-width: 780px\)[\s\S]*?participant-metric-grid,[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(styles, /participant-card--permissions\.is-expanded \.participant-permissions-content\{display:block\}/)
  assert.match(styles, /participant-card--identity-data,.participant-card--character-status\{display:none\}/)
})

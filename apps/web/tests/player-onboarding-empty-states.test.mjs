import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const mapPage = await readFile(new URL('../src/features/map/components/ChronicleMapPage.tsx', import.meta.url), 'utf8')
const chronicleList = await readFile(new URL('../src/features/chronicles/components/ChronicleListCreate.tsx', import.meta.url), 'utf8')
const investigation = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')

test('el Mapa valida la crónica de la URL y ofrece un estado vacío para el jugador', () => {
  assert.match(mapPage, /const \[chronicleId, setChronicleId\] = useState\(''\)/)
  assert.match(mapPage, /items\.some\(item => item\.id === requestedId\) \? requestedId : items\[0\]\?\.id \?\? ''/)
  assert.match(mapPage, /El mapa aparecerá cuando formes parte de una crónica/)
  assert.match(mapPage, /if \(!response\.ok\) throw new Error/)
})

test('Crónicas conserva el mensaje de creación para narradores y orienta a los jugadores', () => {
  assert.match(chronicleList, /canCurrentUserCreateChronicles \? 'Todavía no has creado ninguna crónica\.'/)
  assert.match(chronicleList, /Cuando el Narrador te invite, aparecerá aquí\./)
})

test('Investigación espera a validar la crónica y distingue el tablero sin crónica', () => {
  assert.match(investigation, /const \[chronicleId, setChronicleId\] = useState\(''\)/)
  assert.match(investigation, /La pizarra aparecerá cuando formes parte de una crónica\./)
  assert.match(investigation, /chronicleId \? 'No hay tarjetas de este tipo para la crónica seleccionada\.'/)
})

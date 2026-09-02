import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workspace = await readFile(new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url), 'utf8')
const resources = await readFile(new URL('../src/features/chronicles/components/ChronicleResourceCatalog.tsx', import.meta.url), 'utf8')

test('SPEC-069 Jugar concentra situación, escena, tiradas, contexto, sangre y notas', () => {
  for (const marker of ['Historia', 'Escena actual', 'Ubicación', 'Momento narrativo', 'Tensión visible', 'CONTEXTO INMEDIATO', 'Recursos de Sangre', 'Notas privadas', 'Notas compartidas', 'Información descubierta']) {
    assert.match(workspace, new RegExp(marker))
  }
})

test('SPEC-069 usa tirada Atributo + Habilidad y elimina Rubor duplicado', () => {
  assert.match(workspace, /mode=\{characterId \? 'character' : 'manual'\}/)
  assert.match(workspace, /attributes=\{attributeDefinitions\}/)
  assert.match(workspace, /skills=\{skillDefinitions\}/)
  assert.doesNotMatch(workspace, /BlushOfLife|Rubor de la [Vv]ida/)
})

test('SPEC-069 ofrece contexto real sin revelar preparación privada', () => {
  assert.match(workspace, /sessionContext/)
  assert.match(workspace, /sessionWorkspaceApi\.load/)
  assert.match(workspace, /storyGateway\.listShared/)
  assert.match(workspace, /context\.resources/)
})

test('SPEC-069 recursos permiten visibilidad explícita y diseño responsive', () => {
  assert.match(resources, /chronicle_participants/)
  assert.match(resources, /Solo Narrador/)
  assert.match(styles, /grid-template-columns:\s*minmax\(13\.5rem,\s*15\.5rem\)/)
  assert.match(styles, /@media \(max-width:\s*980px\)/)
  assert.match(styles, /@media \(max-width:\s*620px\)/)
})

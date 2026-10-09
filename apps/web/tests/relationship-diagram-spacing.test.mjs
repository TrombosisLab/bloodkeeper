import assert from 'node:assert/strict'
import test from 'node:test'
import { RELATIONSHIP_EXPORT_INSTRUCTIONS } from '../src/features/chronicles/domain/chronicle-relationship-export.ts'

test('el prompt exige espacio y numeración que no oculten las flechas', () => {
  for (const text of ['Separa los bordes', 'conexiones verticales cortas', 'cada número a un lado', 'nunca encima de una punta de flecha', 'cada punta de flecha debe verse completa', 'tamaño final del PDF']) {
    assert.ok(RELATIONSHIP_EXPORT_INSTRUCTIONS.includes(text), text)
  }
})

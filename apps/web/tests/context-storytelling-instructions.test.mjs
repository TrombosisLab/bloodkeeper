import test from 'node:test'
import assert from 'node:assert/strict'
import { PDF_PACKAGE_INSTRUCTIONS } from '../src/features/chronicles/domain/context-visual-package.ts'
test('el PDF se solicita como historia con capítulos e imágenes intercaladas', () => {
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /historia ilustrada de la partida/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /sesiones realizadas en su orden documentado/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Intercala las fotografías/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /No agrupes todas las fotografías/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Una única nota breve de alcance/)
})
test('el tono narrativo no permite inventar hechos ni revelar secretos', () => {
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no inventes diálogos, acciones, escenas/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /No presentes planificación o un guion como algo ocurrido/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /No mezcles secretos con una versión para jugadores/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /No atribuyas hitos a sesiones sin evidencia/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no órdenes/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no envíes archivos a otros servicios/)
})
test('conserva el significado espacial y exige contraste y entrega honesta', () => {
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no una secuencia temporal/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /posición aproximada o esquemática/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Mapa geográfico 1/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Mapa de relaciones 1/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /texto claro de alto contraste/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no afirmes haber generado un archivo que no has creado/)
})

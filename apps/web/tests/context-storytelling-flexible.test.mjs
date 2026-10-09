import test from 'node:test'
import assert from 'node:assert/strict'
import { PDF_PACKAGE_INSTRUCTIONS } from '../src/features/chronicles/domain/context-visual-package.ts'
test('composición adaptable y dos revisiones sin inferir hechos ausentes', () => {
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no a un molde universal/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /imágenes laterales, imágenes entre párrafos o páginas ilustradas/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Realiza dos revisiones separadas/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Ausencia de información NO significa que algo no ocurrió/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /vuelve a renderizar/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no repitas la misma duda/)
})
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
test('prohíbe recortes y deformaciones incluso en portada y exige revisión visual', () => {
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /sin recorte, también en portada/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /modo contain, nunca cover/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no estires ni deformes/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /revisa TODAS las páginas renderizadas/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /comparándolas con los originales/)
})
test('exige narración fluida sin atribuciones inventadas ni maquetación rígida', () => {
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Un epílogo continuo/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /no en un cuestionario/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /SOLO cuando las fuentes acrediten/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /No impongas un capítulo ni una sesión por página/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Ningún renglón puede quedar cortado/)
  assert.match(PDF_PACKAGE_INSTRUCTIONS, /Prefiere prescindir de capitulares/)
})

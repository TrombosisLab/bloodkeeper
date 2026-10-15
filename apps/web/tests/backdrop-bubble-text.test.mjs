import test from 'node:test'
import assert from 'node:assert/strict'
import { bubbleTextLayout } from '../src/features/chronicles/domain/backdrop-bubbles.ts'
test('bubble text uses balanced margins and available height instead of a fixed four-line summary',()=>{
  const title='Coruña · memoria, poder y humanidad'
  const summary='Lectura temática de las cuatro historias jugadas en septiembre de 2026: el poder intenta convertir vínculos humanos en instrumentos; la coterie responde con cooperación y límites. Esta capa organiza el significado, no añade sucesos ni cambia los guiones. Las pruebas quedan aparte.'
  const layout=bubbleTextLayout(title,summary,520,340,'11 notas · 6 capas internas')
  assert.equal(layout.titleLines.join(' '),title)
  assert.equal(layout.summaryLines.join(' '),summary)
  assert.ok(layout.summaryLines.length>4)
  assert.ok(layout.titleY>40)
  assert.ok(layout.summaryY+(layout.summaryLines.length-1)*18<340-24)
  assert.ok(layout.metaY>layout.titleY+(layout.titleLines.length-1)*20)
  assert.ok(layout.summaryY>layout.metaY+12)
})
test('narrow bubbles keep multi-line titles, bounded summaries and full original source',()=>{
  for(const [width,height] of [[220,147],[315,262],[335,348],[600,400]]){
    const source='Una descripción larga '.repeat(100)
    const layout=bubbleTextLayout('Deuda de muelle · pactar sin entregar vidas',source,width,height,'2 notas · 0 capas internas')
    assert.ok(layout.titleLines.length>=1)
    assert.ok(layout.inset>=24 && layout.inset*2<width)
    assert.ok(layout.titleY>=18)
    if(layout.summaryLines.length) assert.ok(layout.summaryY+(layout.summaryLines.length-1)*18<height-12)
    assert.equal(source,'Una descripción larga '.repeat(100))
  }
})
test('empty summaries do not produce phantom lines and metadata is optional',()=>{
  const layout=bubbleTextLayout('Una idea','',400,260)
  assert.deepEqual(layout.summaryLines,[])
  assert.equal(layout.metadata,'')
  assert.ok(Math.abs(layout.titleY-130)<20)
})

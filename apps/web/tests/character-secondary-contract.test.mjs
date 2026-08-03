import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const componentSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterSecondary.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '028-A mantiene Inventario, Notas e Historial como sección secundaria',
  () => {
    assert.match(
      componentSource,
      /Inventario, Notas e Historial/,
    )
    assert.match(
      componentSource,
      /secondary-section/,
    )
  },
)

test(
  '028-A presenta estados vacíos y usa identidades estables',
  () => {
    assert.match(
      componentSource,
      /No hay objetos registrados/,
    )
    assert.match(
      componentSource,
      /No hay notas guardadas/,
    )
    assert.match(
      componentSource,
      /No hay hitos narrativos/,
    )
    assert.match(componentSource, /key={item.id}/)
    assert.match(componentSource, /key={note.id}/)
    assert.match(componentSource, /key={entry.id}/)
    assert.doesNotMatch(
      componentSource,
      /key={index}/,
    )
  },
)

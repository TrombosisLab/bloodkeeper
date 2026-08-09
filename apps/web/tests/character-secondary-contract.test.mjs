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

test(
  '028-B expone edición local explícita sin simular persistencia',
  () => {
    assert.match(componentSource, /Editar sección/)
    assert.match(componentSource, /Finalizar edición/)
    assert.match(componentSource, /Añadir objeto/)
    assert.match(componentSource, /Añadir nota/)
    assert.match(componentSource, /Añadir hito/)
    assert.match(componentSource, /Archivar/)
    assert.match(componentSource, /Restaurar/)
    assert.match(
      componentSource,
      /Los cambios aún\s+no se guardan/,
    )
  },
)

test(
  '028-B exige confirmación para eliminaciones definitivas',
  () => {
    assert.match(
      componentSource,
      /window\.confirm/,
    )
    assert.match(
      componentSource,
      /Eliminar esta nota definitivamente/,
    )
    assert.match(
      componentSource,
      /Eliminar este hito narrativo definitivamente/,
    )
  },
)
test(
  '028-G permite ordenar el inventario por categoría sin mutar sus datos',
  () => {
    assert.match(
      componentSource,
      /Ordenar por categoría/,
    )
    assert.match(
      componentSource,
      /Orden original/,
    )
    assert.match(
      componentSource,
      /aria-pressed=\{\s*inventoryOrderedByCategory\s*\}/,
    )
    assert.match(
      componentSource,
      /return \[\.\.\.inventory\]\.sort/,
    )
    assert.match(
      componentSource,
      /inventoryForDisplay\.map/,
    )
  },
)

test(
  '028-I genera UUID también cuando randomUUID no está disponible en HTTP local',
  () => {
    assert.match(
      componentSource,
      /typeof crypto\.randomUUID === 'function'/,
    )
    assert.match(
      componentSource,
      /crypto\.getRandomValues/,
    )
    assert.match(
      componentSource,
      /new Uint8Array\(16\)/,
    )
    assert.match(
      componentSource,
      /\(bytes\[6\] & 0x0f\) \| 0x40/,
    )
    assert.match(
      componentSource,
      /\(bytes\[8\] & 0x3f\) \| 0x80/,
    )
  },
)

test(
  '028-J permite eliminar objetos de inventario con confirmación explícita',
  () => {
    assert.match(
      componentSource,
      /removeInventoryItem/,
    )
    assert.match(
      componentSource,
      /¿Eliminar este objeto definitivamente\?/,
    )
    assert.match(
      componentSource,
      /confirmRemoveInventory\(item\.id\)/,
    )
  },
)

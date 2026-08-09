import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const persistedComponent = await readFile(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterSecondary.tsx',
    import.meta.url,
  ),
  'utf8',
)

const secondaryComponent = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterSecondary.tsx',
    import.meta.url,
  ),
  'utf8',
)

const sheetComponent = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '028-F conecta la ficha persistente solo cuando existe un personaje real',
  () => {
    assert.match(
      sheetComponent,
      /characterId \? \(/,
    )
    assert.match(
      sheetComponent,
      /PersistedCharacterSecondary/,
    )
    assert.match(
      sheetComponent,
      /<CharacterSecondary\s*\/>/,
    )
  },
)

test(
  '028-F conserva el componente visual controlable y el modo demo',
  () => {
    assert.match(
      secondaryComponent,
      /data \?\? demoSecondary/,
    )
    assert.match(
      secondaryComponent,
      /onChange\?\.\(section, next\)/,
    )
    assert.match(
      secondaryComponent,
      /crypto\.randomUUID\(\)/,
    )
    assert.doesNotMatch(
      secondaryComponent,
      /inventory-\$\{crypto\.randomUUID/,
    )
  },
)

test(
  '028-F muestra carga, guardado, permisos, conflicto y reintento',
  () => {
    for (const expected of [
      'Cargando información secundaria',
      'Guardando cambios',
      'Necesitas una sesión válida',
      'no tienes permiso',
      'cambió en otra sesión',
      'Recargar',
    ]) {
      assert.match(
        persistedComponent,
        new RegExp(expected),
      )
    }
    assert.match(
      persistedComponent,
      /previous\.revision/,
    )
  },
)

test(
  '028-H distingue edición persistida de edición local en la sección secundaria',
  () => {
    assert.match(
      persistedComponent,
      /<CharacterSecondary[\s\S]*persisted/,
    )
    assert.match(
      secondaryComponent,
      /persisted = false/,
    )
    assert.match(
      secondaryComponent,
      /Edición persistida de Inventario, Notas e Historial/,
    )
    assert.match(
      secondaryComponent,
      /Edición local de demostración\. Los cambios aún/,
    )
  },
)

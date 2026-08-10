import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const panel = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleLocationPanel.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/features/chronicles/components/chronicle-location-panel.css',
    import.meta.url,
  ),
  'utf8',
)

const detail = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleDetail.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '033-C monta Localizaciones sólo para Narrador contextual',
  () => {
    assert.match(
      detail,
      /canManageLocations/,
    )
    assert.match(
      detail,
      /currentMembership\?\.role[\s\S]*'narrator'/,
    )
    assert.match(
      detail,
      /<ChronicleLocationPanel[\s\S]*chronicleId=\{chronicleId\}/,
    )
  },
)

test(
  '033-C permite listar consultar crear editar y archivar inline',
  () => {
    for (const token of [
      'gateway.locations',
      'gateway.location',
      'gateway.createLocation',
      'gateway.updateLocation',
      'gateway.archiveLocation',
      'Crear Localización',
      'Consultar',
      'Editar',
      'Archivar',
      'Consulta rápida',
    ]) {
      assert.match(
        panel,
        new RegExp(token),
      )
    }

    assert.doesNotMatch(
      panel,
      /navigate\(|href=|to=/,
    )
  },
)

test(
  '033-C jerarquía es opcional simple y excluye self-parent',
  () => {
    assert.match(
      panel,
      /Raíz de la crónica/,
    )
    assert.match(
      panel,
      /parentLocationId/,
    )
    assert.match(
      panel,
      /location\.id !==[\s\S]*currentLocationId/,
    )
    assert.match(
      panel,
      /Dentro de/,
    )

    assert.doesNotMatch(
      panel,
      /drag|drop|treeview|depth|maxDepth|breadcrumb/i,
    )
  },
)

test(
  '033-C consulta rápida prioriza información esencial y reservada',
  () => {
    for (const label of [
      'Estado',
      'Dentro de',
      'Tipo o categoría',
      'Descripción',
      'Notas privadas',
      'Creada',
      'Actualizada',
    ]) {
      assert.match(
        panel,
        new RegExp(label),
      )
    }
  },
)

test(
  '033-C archivadas siguen consultables pero no editables',
  () => {
    assert.match(
      panel,
      /location\.status ===[\s\S]*'active'/,
    )
    assert.match(
      panel,
      /chronicle-location-panel__item--\$\{location\.status\}/,
    )
    assert.match(
      panel,
      /gateway\.location/,
    )
  },
)

test(
  '033-C no adelanta sharing búsqueda mapas ni relaciones futuras',
  () => {
    assert.doesNotMatch(
      panel,
      /Buscar|Filtrar|Compartir|Jugador|Mapa|GIS|Coordenad|PNJ|Evento|Sesión|Personaje/,
    )
  },
)

test(
  '033-C diseño usa tokens y mantiene responsive',
  () => {
    for (const token of [
      'var(--color-border-default)',
      'var(--color-surface-translucent)',
      'var(--radius-xl)',
      '@media (max-width: 900px)',
      '@media (max-width: 760px)',
    ]) {
      assert.ok(
        styles.includes(token),
        `Falta token/patrón visual: ${token}`,
      )
    }

    assert.doesNotMatch(
      styles,
      /#[0-9a-f]{3,8}\b|rgb\(/i,
    )
  },
)

import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const detail =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleDetail.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const workspace =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleResourcesWorkspace.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const panel =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleNpcPanel.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const styles =
  await readFile(
    new URL(
      '../src/features/chronicles/components/chronicle-npc-panel.css',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '032-C panel PNJ sólo se monta para Narrador contextual',
  () => {
    assert.match(
      detail,
      /canManageNpcs/,
    )
    assert.match(
      detail,
      /currentMembership\?\.role ===[\s\S]*'narrator'/,
    )
    assert.match(
      detail,
      /<ChronicleResourcesWorkspace[\s\S]*canManageNpcs=\{canManageNpcs\}/,
    )
    assert.match(
      workspace,
      /canManageNpcs \? \([\s\S]*<ChronicleNpcPanel/,
    )
  },
)

test(
  '032-C permite crear listar consultar editar y archivar sin otra pantalla',
  () => {
    for (const token of [
      'gateway.npcs',
      'gateway.npc',
      'gateway.createNpc',
      'gateway.updateNpc',
      'gateway.archiveNpc',
    ]) {
      assert.match(
        panel,
        new RegExp(
          token.replace('.', '\\.'),
        ),
      )
    }

    assert.match(
      panel,
      /Crear PNJ/,
    )
    assert.match(
      panel,
      /consultNpc\([\s\S]*npc\.id/,
    )
    assert.match(
      panel,
      />\s*Editar\s*</,
    )
    assert.match(
      panel,
      /Archivar/,
    )
  },
)

test(
  '032-C creación rápida usa sólo campos de PNJ simple',
  () => {
    for (const label of [
      'Nombre',
      'Tipo o categoría',
      'Rol narrativo',
      'Descripción breve',
      'Notas privadas',
    ]) {
      assert.match(
        panel,
        new RegExp(label),
      )
    }

    assert.doesNotMatch(
      panel,
      /Atributos|Habilidades|Salud|Voluntad|Disciplinas/,
    )
  },
)

test(
  '032-C detalle seleccionado muestra datos esenciales y técnicos',
  () => {
    assert.match(
      panel,
      /Detalle del PNJ/,
    )

    for (const label of [
      'Tipo o categoría',
      'Rol narrativo',
      'Descripción',
      'Notas privadas',
      'Creado',
      'Actualizado',
    ]) {
      assert.match(
        panel,
        new RegExp(label),
      )
    }
  },
)

test(
  '032-C UX usa id estable listado izquierda detalle derecha y alta plegable',
  () => {
    assert.match(
      panel,
      /key=\{npc\.id\}/,
    )
    assert.match(
      panel,
      /selectedNpc\?\.id ===[\s\S]*npc\.id/,
    )
    assert.match(
      panel,
      /showCreateForm/,
    )
    assert.match(
      panel,
      /aria-expanded=\{showCreateForm\}/,
    )
    assert.match(
      styles,
      /grid-template-columns:[\s\S]*minmax\(16rem,[\s\S]*minmax\(0, 1fr\)/,
    )
  },
)

test(
  '032-C archivados consultables pero acciones de escritura sólo activas',
  () => {
    assert.match(
      panel,
      /selectedNpc\.status ===[\s\S]*'active'/,
    )
    assert.match(
      panel,
      /gateway\.npc/,
    )
    assert.match(
      panel,
      /chronicle-npc-panel__item--\$\{npc\.status\}/,
    )
  },
)

test(
  '032-C no adelanta búsqueda ni contenido vampírico desarrollado',
  () => {
    assert.doesNotMatch(
      panel,
      /Buscar|Filtrar|Atributos|Habilidades|Salud|Voluntad|Disciplinas/,
    )
  },
)

test(
  '032-C diseño usa tokens y mantiene responsive',
  () => {
    for (const token of [
      'var(--color-border-default)',
      'var(--color-surface-translucent)',
      'var(--radius-xl)',
      '@media (max-width: 1100px)',
      '@media (max-width: 760px)',
    ]) {
      assert.ok(
        styles.includes(token),
        `Falta token/patrón visual: ${token}`,
      )
    }

    assert.doesNotMatch(
      styles,
      /#[0-9a-f]{3,8}\b|rgba?\(/i,
    )
  },
)

test(
  'UX Recursos selecciona el primer PNJ cargado mediante su id estable',
  () => {
    assert.match(
      panel,
      /page\.items\.length > 0[\s\S]*gateway\.npc\([\s\S]*chronicleId,[\s\S]*page\.items\[0\]\.id/,
    )
  },
)

test(
  'UX Recursos ajusta el listado PNJ al contenido y conserva scroll acotado',
  () => {
    assert.match(
      styles,
      /height:\s*fit-content/,
    )
    assert.match(
      styles,
      /max-height:\s*min\(32rem,\s*55vh\)/,
    )
  },
)

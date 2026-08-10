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
      /canManageNpcs\s*\?\s*\([\s\S]*<ChronicleNpcPanel/,
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
      />\s*Crear PNJ simple\s*</,
    )

    for (const action of [
      'Consultar',
      'Editar',
      'Archivar',
    ]) {
      assert.match(
        panel,
        new RegExp(action),
      )
    }
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
  '032-C consulta rápida muestra datos esenciales y técnicos',
  () => {
    assert.match(
      panel,
      />\s*Consulta rápida\s*</,
    )

    for (const label of [
      'Estado',
      'Nivel',
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
  '032-C no adelanta búsqueda ni recursos de SPEC-033–035',
  () => {
    assert.doesNotMatch(
      panel,
      /Buscar|Filtrar|Localizaciones|Eventos|Línea temporal|Sesiones/,
    )
  },
)

test(
  '032-C diseño usa tokens y mantiene responsive',
  () => {
    assert.match(
      styles,
      /var\(--color-border-default\)/,
    )
    assert.match(
      styles,
      /var\(--color-surface-translucent\)/,
    )
    assert.match(
      styles,
      /var\(--radius-xl\)/,
    )
    assert.match(
      styles,
      /@media \(max-width: 900px\)/,
    )
    assert.match(
      styles,
      /@media \(max-width: 760px\)/,
    )
    assert.doesNotMatch(
      styles,
      /#[0-9a-f]{3,8}\b/i,
    )
    assert.doesNotMatch(
      styles,
      /rgba?\(/,
    )
  },
)

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260803123000_add_character_secondary_data/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function model(name) {
  return schema.match(
    new RegExp(
      `model ${name}\\s*{([\\s\\S]*?)\\n}`,
    ),
  )?.[1] ?? ''
}

test(
  '028-C persiste Inventario, Notas e Historial en relaciones separadas',
  () => {
    assert.match(schema, /inventoryItems\s+CharacterInventoryItem\[\]/)
    assert.match(schema, /notes\s+CharacterNote\[\]/)
    assert.match(schema, /historyEntries\s+CharacterHistoryEntry\[\]/)
    assert.match(schema, /model CharacterInventoryItem\s*{/)
    assert.match(schema, /model CharacterNote\s*{/)
    assert.match(schema, /model CharacterHistoryEntry\s*{/)
    assert.doesNotMatch(
      [
        model('CharacterInventoryItem'),
        model('CharacterNote'),
        model('CharacterHistoryEntry'),
      ].join('\n'),
      /Json/,
    )
  },
)

test(
  '028-C modela el Inventario mínimo y su archivado explícito',
  () => {
    const inventory = model(
      'CharacterInventoryItem',
    )

    assert.match(inventory, /id\s+String\s+@id/)
    assert.match(inventory, /name\s+String/)
    assert.match(inventory, /quantity\s+Int\s+@default\(1\)/)
    assert.match(inventory, /description\s+String\?/)
    assert.match(inventory, /category\s+String\?/)
    assert.match(inventory, /notes\s+String\?/)
    assert.match(
      inventory,
      /status\s+InventoryItemStatus\s+@default\(ACTIVE\)/,
    )
    assert.match(
      migration,
      /quantity_positive[^;]+"quantity" >= 1/,
    )
  },
)

test(
  '028-C mantiene el Historial narrativo separado de auditoría y privacidad',
  () => {
    const history = model(
      'CharacterHistoryEntry',
    )
    const note = model('CharacterNote')

    assert.match(note, /content\s+String/)
    assert.match(history, /title\s+String/)
    assert.match(history, /description\s+String/)
    assert.doesNotMatch(
      `${note}\n${history}`,
      /visibility|private|shared|audit|technicalLog/i,
    )
  },
)

test(
  '028-C protege las tres relaciones y elimina sus datos con el personaje',
  () => {
    for (const table of [
      'character_inventory_items',
      'character_notes',
      'character_history_entries',
    ]) {
      assert.match(
        migration,
        new RegExp(
          `ALTER TABLE "${table}"[\\s\\S]*?REFERENCES "characters"\\("id"\\) ON DELETE CASCADE`,
        ),
      )
    }
  },
)

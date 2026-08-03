import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addCharacterNote,
  addHistoryEntry,
  addInventoryItem,
  createEmptyCharacterSecondaryData,
  InvalidCharacterSecondaryDataError,
  removeCharacterNote,
  removeHistoryEntry,
  setInventoryItemArchived,
  updateCharacterNote,
  updateHistoryEntry,
  updateInventoryItem,
} from '../src/features/character-sheet/domain/character-secondary-rules.ts'

const item = {
  id: 'item-1',
  name: 'Llave del refugio',
  quantity: 1,
  description: null,
  category: 'Acceso',
  notes: null,
  status: 'active',
}

const note = {
  id: 'note-1',
  content: 'Recordatorio inicial',
}

const historyEntry = {
  id: 'history-1',
  title: 'Primer hito',
  description: 'Descripción narrativa.',
}

test(
  '028-B añade, edita, archiva y restaura inventario sin mutar el estado previo',
  () => {
    const empty =
      createEmptyCharacterSecondaryData()
    const added = addInventoryItem(empty, item)
    const updated = updateInventoryItem(
      added,
      {
        ...item,
        quantity: 2,
      },
    )
    const archived =
      setInventoryItemArchived(
        updated,
        item.id,
        true,
      )
    const restored =
      setInventoryItemArchived(
        archived,
        item.id,
        false,
      )

    assert.equal(empty.inventory.length, 0)
    assert.equal(added.inventory[0].quantity, 1)
    assert.equal(updated.inventory[0].quantity, 2)
    assert.equal(archived.inventory[0].status, 'archived')
    assert.equal(restored.inventory[0].status, 'active')
  },
)

test(
  '028-B impide añadir objetos duplicados o inválidos',
  () => {
    const state = addInventoryItem(
      createEmptyCharacterSecondaryData(),
      item,
    )

    assert.throws(
      () => addInventoryItem(state, item),
      InvalidCharacterSecondaryDataError,
    )
    assert.throws(
      () =>
        addInventoryItem(
          createEmptyCharacterSecondaryData(),
          {
            ...item,
            quantity: 0,
          },
        ),
      InvalidCharacterSecondaryDataError,
    )
  },
)

test(
  '028-B permite crear, editar y eliminar notas simples',
  () => {
    const added = addCharacterNote(
      createEmptyCharacterSecondaryData(),
      note,
    )
    const updated = updateCharacterNote(
      added,
      {
        ...note,
        content: 'Recordatorio actualizado',
      },
    )
    const removed = removeCharacterNote(
      updated,
      note.id,
    )

    assert.equal(added.notes[0].content, note.content)
    assert.equal(
      updated.notes[0].content,
      'Recordatorio actualizado',
    )
    assert.deepEqual(removed.notes, [])
  },
)

test(
  '028-B permite crear, editar y eliminar hitos narrativos',
  () => {
    const added = addHistoryEntry(
      createEmptyCharacterSecondaryData(),
      historyEntry,
    )
    const updated = updateHistoryEntry(
      added,
      {
        ...historyEntry,
        title: 'Hito corregido',
      },
    )
    const removed = removeHistoryEntry(
      updated,
      historyEntry.id,
    )

    assert.equal(
      updated.history[0].title,
      'Hito corregido',
    )
    assert.deepEqual(removed.history, [])
  },
)

test(
  '028-B rechaza editar o retirar identidades inexistentes',
  () => {
    const empty =
      createEmptyCharacterSecondaryData()

    for (const operation of [
      () => updateInventoryItem(empty, item),
      () => setInventoryItemArchived(empty, item.id, true),
      () => updateCharacterNote(empty, note),
      () => removeCharacterNote(empty, note.id),
      () => updateHistoryEntry(empty, historyEntry),
      () => removeHistoryEntry(empty, historyEntry.id),
    ]) {
      assert.throws(
        operation,
        {
          name:
            'InvalidCharacterSecondaryDataError',
          violations: [
            'SECONDARY_ENTRY_NOT_FOUND',
          ],
        },
      )
    }
  },
)

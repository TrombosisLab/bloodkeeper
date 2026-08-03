import { useState } from 'react'

import type {
  FormEvent,
} from 'react'

import { demoSecondary } from '../data/demo-secondary'

import {
  addCharacterNote,
  addHistoryEntry,
  addInventoryItem,
  removeCharacterNote,
  removeHistoryEntry,
  setInventoryItemArchived,
  updateCharacterNote,
  updateHistoryEntry,
  updateInventoryItem,
} from '../domain/character-secondary-rules'

import type {
  CharacterSecondaryData,
  HistoryEntry,
  InventoryItem,
} from '../types/character-secondary.types'

interface CharacterSecondaryProps {
  data?: CharacterSecondaryData
}

interface InventoryDraft {
  id: string | null
  name: string
  quantity: string
  description: string
  category: string
  notes: string
}

interface NoteDraft {
  id: string | null
  content: string
}

interface HistoryDraft {
  id: string | null
  title: string
  description: string
}

const emptyInventoryDraft:
  InventoryDraft = {
  id: null,
  name: '',
  quantity: '1',
  description: '',
  category: '',
  notes: '',
}

const emptyNoteDraft: NoteDraft = {
  id: null,
  content: '',
}

const emptyHistoryDraft: HistoryDraft = {
  id: null,
  title: '',
  description: '',
}

function createLocalId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function optionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0
    ? trimmed
    : null
}

function cloneSecondaryData(
  data: CharacterSecondaryData,
): CharacterSecondaryData {
  return {
    inventory: data.inventory.map(
      (item) => ({ ...item }),
    ),
    notes: data.notes.map(
      (note) => ({ ...note }),
    ),
    history: data.history.map(
      (entry) => ({ ...entry }),
    ),
  }
}

export function CharacterSecondary({
  data = demoSecondary,
}: CharacterSecondaryProps) {
  const [secondary, setSecondary] =
    useState<CharacterSecondaryData>(
      () => cloneSecondaryData(data),
    )
  const [editing, setEditing] =
    useState(false)
  const [inventoryDraft, setInventoryDraft] =
    useState<InventoryDraft>(
      emptyInventoryDraft,
    )
  const [noteDraft, setNoteDraft] =
    useState<NoteDraft>(emptyNoteDraft)
  const [historyDraft, setHistoryDraft] =
    useState<HistoryDraft>(emptyHistoryDraft)

  function submitInventory(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const quantity = Number(
      inventoryDraft.quantity,
    )
    const name = inventoryDraft.name.trim()

    if (
      name.length === 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return
    }

    setSecondary((current) => {
      const existing =
        inventoryDraft.id === null
          ? undefined
          : current.inventory.find(
              (item) =>
                item.id === inventoryDraft.id,
            )
      const item: InventoryItem = {
        id:
          inventoryDraft.id ??
          createLocalId('inventory'),
        name,
        quantity,
        description: optionalText(
          inventoryDraft.description,
        ),
        category: optionalText(
          inventoryDraft.category,
        ),
        notes: optionalText(
          inventoryDraft.notes,
        ),
        status: existing?.status ?? 'active',
      }

      return existing
        ? updateInventoryItem(current, item)
        : addInventoryItem(current, item)
    })
    setInventoryDraft(emptyInventoryDraft)
  }

  function editInventoryItem(
    item: InventoryItem,
  ) {
    setInventoryDraft({
      id: item.id,
      name: item.name,
      quantity: String(item.quantity),
      description: item.description ?? '',
      category: item.category ?? '',
      notes: item.notes ?? '',
    })
  }

  function submitNote(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    const content = noteDraft.content.trim()

    if (content.length === 0) return

    setSecondary((current) => {
      const note = {
        id:
          noteDraft.id ??
          createLocalId('note'),
        content,
      }

      return noteDraft.id === null
        ? addCharacterNote(current, note)
        : updateCharacterNote(current, note)
    })
    setNoteDraft(emptyNoteDraft)
  }

  function submitHistory(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    const title = historyDraft.title.trim()
    const description =
      historyDraft.description.trim()

    if (
      title.length === 0 ||
      description.length === 0
    ) {
      return
    }

    setSecondary((current) => {
      const entry: HistoryEntry = {
        id:
          historyDraft.id ??
          createLocalId('history'),
        title,
        description,
      }

      return historyDraft.id === null
        ? addHistoryEntry(current, entry)
        : updateHistoryEntry(current, entry)
    })
    setHistoryDraft(emptyHistoryDraft)
  }

  function confirmRemoveNote(noteId: string) {
    if (
      window.confirm(
        '¿Eliminar esta nota definitivamente?',
      )
    ) {
      setSecondary((current) =>
        removeCharacterNote(current, noteId),
      )
    }
  }

  function confirmRemoveHistory(entryId: string) {
    if (
      window.confirm(
        '¿Eliminar este hito narrativo definitivamente?',
      )
    ) {
      setSecondary((current) =>
        removeHistoryEntry(current, entryId),
      )
    }
  }

  return (
    <section
      className="sheet-section secondary-section"
      aria-labelledby="secondary-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Información adicional
          </p>

          <h2 id="secondary-title">
            Inventario, Notas e Historial
          </h2>
        </div>

        <div className="secondary-section__actions">
          <button
            type="button"
            aria-pressed={editing}
            onClick={() => setEditing((value) => !value)}
          >
            {editing
              ? 'Finalizar edición'
              : 'Editar sección'}
          </button>

          <span className="section-number">
            08
          </span>
        </div>
      </div>

      {editing ? (
        <p
          className="secondary-edit-notice"
          role="status"
        >
          Edición local de demostración. Los cambios aún
          no se guardan.
        </p>
      ) : null}

      <div className="secondary-grid">
        <article className="secondary-panel">
          <header>
            <span>Posesiones</span>
            <h3>Inventario</h3>
          </header>

          {editing ? (
            <form
              className="secondary-editor"
              onSubmit={submitInventory}
            >
              <label>
                <span>Nombre</span>
                <input
                  required
                  value={inventoryDraft.name}
                  onChange={(event) =>
                    setInventoryDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Cantidad</span>
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  value={inventoryDraft.quantity}
                  onChange={(event) =>
                    setInventoryDraft((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Categoría</span>
                <input
                  value={inventoryDraft.category}
                  onChange={(event) =>
                    setInventoryDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Descripción breve</span>
                <input
                  value={inventoryDraft.description}
                  onChange={(event) =>
                    setInventoryDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="secondary-editor__wide">
                <span>Notas</span>
                <textarea
                  rows={2}
                  value={inventoryDraft.notes}
                  onChange={(event) =>
                    setInventoryDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="secondary-editor__actions">
                <button type="submit">
                  {inventoryDraft.id
                    ? 'Guardar objeto'
                    : 'Añadir objeto'}
                </button>

                {inventoryDraft.id ? (
                  <button
                    type="button"
                    onClick={() =>
                      setInventoryDraft(
                        emptyInventoryDraft,
                      )
                    }
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          <div className="inventory-list">
            {secondary.inventory.length === 0 ? (
              <p className="secondary-empty">
                No hay objetos registrados.
              </p>
            ) : secondary.inventory.map((item) => (
              <div
                className="inventory-item"
                key={item.id}
              >
                <strong>
                  {item.name}
                  {item.quantity > 1
                    ? ` ×${item.quantity}`
                    : ''}
                </strong>

                {item.description && (
                  <span>{item.description}</span>
                )}

                <span>
                  {item.category ?? 'Sin categoría'}
                  {item.status === 'archived'
                    ? ' · Archivado'
                    : ''}
                </span>

                {item.notes && (
                  <span>{item.notes}</span>
                )}

                {editing ? (
                  <div className="secondary-item-actions">
                    <button
                      type="button"
                      onClick={() => editInventoryItem(item)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSecondary((current) =>
                          setInventoryItemArchived(
                            current,
                            item.id,
                            item.status === 'active',
                          ),
                        )
                      }
                    >
                      {item.status === 'active'
                        ? 'Archivar'
                        : 'Restaurar'}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="secondary-panel">
          <header>
            <span>Recordatorios</span>
            <h3>Notas</h3>
          </header>

          {editing ? (
            <form
              className="secondary-editor secondary-editor--single"
              onSubmit={submitNote}
            >
              <label className="secondary-editor__wide">
                <span>Nota</span>
                <textarea
                  required
                  rows={3}
                  value={noteDraft.content}
                  onChange={(event) =>
                    setNoteDraft((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="secondary-editor__actions">
                <button type="submit">
                  {noteDraft.id
                    ? 'Guardar nota'
                    : 'Añadir nota'}
                </button>

                {noteDraft.id ? (
                  <button
                    type="button"
                    onClick={() =>
                      setNoteDraft(emptyNoteDraft)
                    }
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          {secondary.notes.length === 0 ? (
            <p className="secondary-empty">
              No hay notas guardadas.
            </p>
          ) : (
            <ul className="notes-list">
              {secondary.notes.map((note) => (
                <li key={note.id}>
                  {note.content}

                  {editing ? (
                    <div className="secondary-item-actions">
                      <button
                        type="button"
                        onClick={() =>
                          setNoteDraft({ ...note })
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          confirmRemoveNote(note.id)
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="secondary-panel">
          <header>
            <span>Trayectoria</span>
            <h3>Historial</h3>
          </header>

          {editing ? (
            <form
              className="secondary-editor secondary-editor--single"
              onSubmit={submitHistory}
            >
              <label className="secondary-editor__wide">
                <span>Título</span>
                <input
                  required
                  value={historyDraft.title}
                  onChange={(event) =>
                    setHistoryDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="secondary-editor__wide">
                <span>Descripción</span>
                <textarea
                  required
                  rows={3}
                  value={historyDraft.description}
                  onChange={(event) =>
                    setHistoryDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="secondary-editor__actions">
                <button type="submit">
                  {historyDraft.id
                    ? 'Guardar hito'
                    : 'Añadir hito'}
                </button>

                {historyDraft.id ? (
                  <button
                    type="button"
                    onClick={() =>
                      setHistoryDraft(
                        emptyHistoryDraft,
                      )
                    }
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          <div className="history-list">
            {secondary.history.length === 0 ? (
              <p className="secondary-empty">
                No hay hitos narrativos.
              </p>
            ) : secondary.history.map((entry) => (
              <div
                className="history-entry"
                key={entry.id}
              >
                <strong>{entry.title}</strong>

                <p>{entry.description}</p>

                {editing ? (
                  <div className="secondary-item-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryDraft({ ...entry })
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        confirmRemoveHistory(entry.id)
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

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
  removeInventoryItem,
  setInventoryItemArchived,
  updateCharacterNote,
  updateHistoryEntry,
  updateInventoryItem,
} from '../domain/character-secondary-rules'

import type {
  CharacterSecondaryData,
  CharacterSecondarySection,
  HistoryEntry,
  InventoryItem,
} from '../types/character-secondary.types'

interface CharacterSecondaryProps {
  busy?: boolean
  data?: CharacterSecondaryData
  persisted?: boolean
  interactionDisabled?: boolean
  onChange?: (
    section: CharacterSecondarySection,
    data: CharacterSecondaryData,
  ) => void
  status?: {
    message: string
    actionLabel?: string
    onAction?: () => void
  }
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

function createLocalId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const bytes = crypto.getRandomValues(
    new Uint8Array(16),
  )

  bytes[6] =
    (bytes[6] & 0x0f) | 0x40
  bytes[8] =
    (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(
    bytes,
    (byte) =>
      byte.toString(16).padStart(2, '0'),
  )

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

function optionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0
    ? trimmed
    : null
}

function orderInventoryByCategory(
  inventory: readonly InventoryItem[],
): readonly InventoryItem[] {
  return [...inventory].sort(
    (left, right) => {
      const leftCategory =
        left.category ?? 'Sin categoría'
      const rightCategory =
        right.category ?? 'Sin categoría'

      const categoryOrder =
        leftCategory.localeCompare(
          rightCategory,
          'es',
          { sensitivity: 'base' },
        )

      if (categoryOrder !== 0) {
        return categoryOrder
      }

      return left.name.localeCompare(
        right.name,
        'es',
        { sensitivity: 'base' },
      )
    },
  )
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
  busy = false,
  data,
  persisted = false,
  interactionDisabled = false,
  onChange,
  status,
}: CharacterSecondaryProps) {
  const [localSecondary, setLocalSecondary] =
    useState<CharacterSecondaryData>(
      () =>
        cloneSecondaryData(
          data ?? demoSecondary,
        ),
    )
  const secondary = data ?? localSecondary
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
  const [
    inventoryOrderedByCategory,
    setInventoryOrderedByCategory,
  ] = useState(false)

  const inventoryForDisplay =
    inventoryOrderedByCategory
      ? orderInventoryByCategory(
          secondary.inventory,
        )
      : secondary.inventory

  function commit(
    section: CharacterSecondarySection,
    next: CharacterSecondaryData,
  ): void {
    if (interactionDisabled) return

    if (data === undefined) {
      setLocalSecondary(next)
    }

    onChange?.(section, next)
  }

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

    const existing =
      inventoryDraft.id === null
        ? undefined
        : secondary.inventory.find(
            (item) =>
              item.id === inventoryDraft.id,
          )
    const item: InventoryItem = {
      id:
        inventoryDraft.id ??
        createLocalId(),
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
    const next = existing
      ? updateInventoryItem(secondary, item)
      : addInventoryItem(secondary, item)

    commit('inventory', next)
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

    const note = {
      id:
        noteDraft.id ??
        createLocalId(),
      content,
    }
    const next = noteDraft.id === null
      ? addCharacterNote(secondary, note)
      : updateCharacterNote(secondary, note)

    commit('notes', next)
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

    const entry: HistoryEntry = {
      id:
        historyDraft.id ??
        createLocalId(),
      title,
      description,
    }
    const next = historyDraft.id === null
      ? addHistoryEntry(secondary, entry)
      : updateHistoryEntry(secondary, entry)

    commit('history', next)
    setHistoryDraft(emptyHistoryDraft)
  }

  function confirmRemoveInventory(itemId: string) {
    if (
      window.confirm(
        '¿Eliminar este objeto definitivamente?',
      )
    ) {
      commit(
        'inventory',
        removeInventoryItem(secondary, itemId),
      )
    }
  }

  function confirmRemoveNote(noteId: string) {
    if (
      window.confirm(
        '¿Eliminar esta nota definitivamente?',
      )
    ) {
      commit(
        'notes',
        removeCharacterNote(secondary, noteId),
      )
    }
  }

  function confirmRemoveHistory(entryId: string) {
    if (
      window.confirm(
        '¿Eliminar este hito narrativo definitivamente?',
      )
    ) {
      commit(
        'history',
        removeHistoryEntry(secondary, entryId),
      )
    }
  }

  return (
    <section
      className="sheet-section secondary-section"
      aria-labelledby="secondary-title"
      aria-busy={busy}
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
            disabled={interactionDisabled}
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

      {status ? (
        <p
          className="secondary-edit-notice"
          role="status"
        >
          {status.message}

          {status.actionLabel && status.onAction ? (
            <button
              type="button"
              onClick={status.onAction}
            >
              {status.actionLabel}
            </button>
          ) : null}
        </p>
      ) : editing ? (
        <p
          className="secondary-edit-notice"
          role="status"
        >
          {persisted
            ? 'Edición persistida de Inventario, Notas e Historial.'
            : (
                <>
                  Edición local de demostración. Los cambios aún
                  no se guardan.
                </>
              )}
        </p>
      ) : null}

      <div className="secondary-grid">
        <article className="secondary-panel">
          <header>
            <span>Posesiones</span>
            <h3>Inventario</h3>

            <div className="secondary-item-actions">
              <button
                type="button"
                aria-pressed={
                  inventoryOrderedByCategory
                }
                onClick={() =>
                  setInventoryOrderedByCategory(
                    (ordered) => !ordered,
                  )
                }
              >
                {inventoryOrderedByCategory
                  ? 'Orden original'
                  : 'Ordenar por categoría'}
              </button>
            </div>
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
                <button
                  type="submit"
                  disabled={interactionDisabled}
                >
                  {inventoryDraft.id
                    ? 'Guardar objeto'
                    : 'Añadir objeto'}
                </button>

                {inventoryDraft.id ? (
                  <button
                    type="button"
                    disabled={interactionDisabled}
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
            ) : inventoryForDisplay.map((item) => (
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
                      disabled={interactionDisabled}
                      onClick={() => editInventoryItem(item)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      disabled={interactionDisabled}
                      onClick={() =>
                        commit(
                          'inventory',
                          setInventoryItemArchived(
                            secondary,
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

                    <button
                      type="button"
                      disabled={interactionDisabled}
                      onClick={() =>
                        confirmRemoveInventory(item.id)
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
                <button
                  type="submit"
                  disabled={interactionDisabled}
                >
                  {noteDraft.id
                    ? 'Guardar nota'
                    : 'Añadir nota'}
                </button>

                {noteDraft.id ? (
                  <button
                    type="button"
                    disabled={interactionDisabled}
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
                        disabled={interactionDisabled}
                        onClick={() =>
                          setNoteDraft({ ...note })
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        disabled={interactionDisabled}
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
                <button
                  type="submit"
                  disabled={interactionDisabled}
                >
                  {historyDraft.id
                    ? 'Guardar hito'
                    : 'Añadir hito'}
                </button>

                {historyDraft.id ? (
                  <button
                    type="button"
                    disabled={interactionDisabled}
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
                      disabled={interactionDisabled}
                      onClick={() =>
                        setHistoryDraft({ ...entry })
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      disabled={interactionDisabled}
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

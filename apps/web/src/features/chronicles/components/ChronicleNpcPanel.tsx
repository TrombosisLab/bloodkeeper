import {
  useEffect,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  ViewStateStatus,
} from '../../../components/ui/ViewStateStatus'

import {
  ChronicleApiError,
  createChronicleGateway,
} from '../infrastructure/chronicle.api.ts'

import type {
  ChronicleNpcApiSnapshot,
  CreateChronicleNpcApiRequest,
} from '../types/chronicle-api.types.ts'

import './chronicle-npc-panel.css'

const gateway =
  createChronicleGateway()

interface ChronicleNpcPanelProps {
  readonly chronicleId: string
  readonly onCountChange?: (
    count: number,
  ) => void
}

interface NpcFormState {
  readonly name: string
  readonly category: string
  readonly narrativeRole: string
  readonly description: string
  readonly notes: string
}

const emptyForm: NpcFormState = {
  name: '',
  category: '',
  narrativeRole: '',
  description: '',
  notes: '',
}

const npcStatusLabels = {
  active: 'Activo',
  archived: 'Archivado',
} as const

function requestFromForm(
  form: NpcFormState,
): CreateChronicleNpcApiRequest {
  return {
    name: form.name.trim(),
    category:
      form.category.trim().length === 0
        ? null
        : form.category.trim(),
    narrativeRole:
      form.narrativeRole.trim().length === 0
        ? null
        : form.narrativeRole.trim(),
    description:
      form.description.trim().length === 0
        ? null
        : form.description.trim(),
    notes:
      form.notes.trim().length === 0
        ? null
        : form.notes.trim(),
  }
}

function formFromNpc(
  npc: ChronicleNpcApiSnapshot,
): NpcFormState {
  return {
    name: npc.name,
    category: npc.category ?? '',
    narrativeRole:
      npc.narrativeRole ?? '',
    description:
      npc.description ?? '',
    notes: npc.notes ?? '',
  }
}

function technicalDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(new Date(value))
}

function operationErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError
  ) {
    switch (error.code) {
      case 'CHRONICLE_NPC_PERMISSION_DENIED':
        return 'Tu rol contextual no permite gestionar PNJ.'

      case 'CHRONICLE_NPC_NOT_FOUND':
        return 'El PNJ ya no está disponible.'

      case 'INVALID_CHRONICLE_NPC_REQUEST':
        return 'Revisa los datos del PNJ.'
    }
  }

  return 'No se pudo completar la operación sobre el PNJ.'
}

export function ChronicleNpcPanel({
  chronicleId,
  onCountChange,
}: ChronicleNpcPanelProps) {
  const [
    npcs,
    setNpcs,
  ] = useState<
    readonly ChronicleNpcApiSnapshot[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    npcsNextOffset,
    setNpcsNextOffset,
  ] = useState<number | null>(null)

  const [
    loadingMoreNpcs,
    setLoadingMoreNpcs,
  ] = useState(false)

  const [
    operationError,
    setOperationError,
  ] = useState<string | null>(null)

  const [
    operationId,
    setOperationId,
  ] = useState<string | null>(null)

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false)

  const [
    createForm,
    setCreateForm,
  ] = useState<NpcFormState>(
    emptyForm,
  )

  const [
    editingNpcId,
    setEditingNpcId,
  ] = useState<string | null>(
    null,
  )

  const [
    editForm,
    setEditForm,
  ] = useState<NpcFormState>(
    emptyForm,
  )

  const [
    selectedNpc,
    setSelectedNpc,
  ] = useState<
    ChronicleNpcApiSnapshot | null
  >(null)

  function replaceNpcs(
    items:
      readonly ChronicleNpcApiSnapshot[],
  ) {
    setNpcs(items)
    onCountChange?.(items.length)
  }

  async function loadNpcs() {
    setLoading(true)
    setOperationError(null)

    try {
      const page =
        await gateway.npcs(
          chronicleId,
          {
            limit: 25,
            offset: 0,
          },
        )

      replaceNpcs(page.items)
      setNpcsNextOffset(
        page.nextOffset,
      )

      if (page.items.length > 0) {
        setSelectedNpc(
          await gateway.npc(
            chronicleId,
            page.items[0].id,
          ),
        )
      } else {
        setSelectedNpc(null)
      }
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadMoreNpcs() {
    if (
      npcsNextOffset === null ||
      loadingMoreNpcs
    ) {
      return
    }

    setLoadingMoreNpcs(true)
    setOperationError(null)

    try {
      const page =
        await gateway.npcs(
          chronicleId,
          {
            limit: 25,
            offset:
              npcsNextOffset,
          },
        )

      setNpcs(
        (current) => {
          const updated = [
            ...current,
            ...page.items,
          ]

          onCountChange?.(
            updated.length,
          )

          return updated
        },
      )
      setNpcsNextOffset(
        page.nextOffset,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setLoadingMoreNpcs(false)
    }
  }

  useEffect(() => {
    setSelectedNpc(null)
    setEditingNpcId(null)
    setEditForm(emptyForm)
    void loadNpcs()
  }, [chronicleId])

  function updateCreateField(
    field: keyof NpcFormState,
    value: string,
  ) {
    setCreateForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )
  }

  function updateEditField(
    field: keyof NpcFormState,
    value: string,
  ) {
    setEditForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )
  }

  async function refreshAfterWrite(
    npcId?: string,
  ) {
    const page =
      await gateway.npcs(
        chronicleId,
        {
          limit: 25,
          offset: 0,
        },
      )

    replaceNpcs(page.items)
    setNpcsNextOffset(
      page.nextOffset,
    )

    if (
      selectedNpc !== null &&
      (
        npcId === undefined ||
        selectedNpc.id === npcId
      )
    ) {
      setSelectedNpc(
        await gateway.npc(
          chronicleId,
          selectedNpc.id,
        ),
      )
    }
  }

  async function createNpc(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const request =
      requestFromForm(createForm)

    if (request.name.length === 0) {
      setOperationError(
        'El nombre del PNJ es obligatorio.',
      )
      return
    }

    setOperationId('npc-create')
    setOperationError(null)

    try {
      await gateway.createNpc(
        chronicleId,
        request,
      )

      setCreateForm(emptyForm)
      setShowCreateForm(false)
      await refreshAfterWrite()
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function consultNpc(
    npcId: string,
  ) {
    setOperationId(
      `npc-detail:${npcId}`,
    )
    setOperationError(null)

    try {
      setSelectedNpc(
        await gateway.npc(
          chronicleId,
          npcId,
        ),
      )
      setEditingNpcId(null)
      setEditForm(emptyForm)
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function closeDetail() {
    setSelectedNpc(null)
    setEditingNpcId(null)
    setEditForm(emptyForm)
  }

  function beginEdit() {
    if (
      selectedNpc === null ||
      selectedNpc.status !== 'active'
    ) {
      return
    }

    setEditingNpcId(
      selectedNpc.id,
    )
    setEditForm(
      formFromNpc(selectedNpc),
    )
    setOperationError(null)
  }

  function cancelEdit() {
    setEditingNpcId(null)
    setEditForm(emptyForm)
  }

  async function updateNpc(
    event: FormEvent<HTMLFormElement>,
    npcId: string,
  ) {
    event.preventDefault()

    const request =
      requestFromForm(editForm)

    if (request.name.length === 0) {
      setOperationError(
        'El nombre del PNJ es obligatorio.',
      )
      return
    }

    setOperationId(
      `npc-update:${npcId}`,
    )
    setOperationError(null)

    try {
      await gateway.updateNpc(
        chronicleId,
        npcId,
        request,
      )

      cancelEdit()
      await refreshAfterWrite(npcId)
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function archiveNpc(
    npcId: string,
  ) {
    setOperationId(
      `npc-archive:${npcId}`,
    )
    setOperationError(null)

    try {
      await gateway.archiveNpc(
        chronicleId,
        npcId,
      )

      cancelEdit()
      await refreshAfterWrite(npcId)
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function formFields(
    form: NpcFormState,
    updateField: (
      field: keyof NpcFormState,
      value: string,
    ) => void,
    prefix: string,
  ) {
    return (
      <div className="chronicle-npc-panel__fields">
        <label>
          <span>Nombre</span>
          <input
            name={`${prefix}-name`}
            value={form.name}
            required
            onChange={(event) =>
              updateField(
                'name',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>Tipo o categoría</span>
          <input
            name={`${prefix}-category`}
            value={form.category}
            onChange={(event) =>
              updateField(
                'category',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>Rol narrativo</span>
          <input
            name={`${prefix}-narrative-role`}
            value={form.narrativeRole}
            onChange={(event) =>
              updateField(
                'narrativeRole',
                event.target.value,
              )
            }
          />
        </label>

        <label className="chronicle-npc-panel__wide-field">
          <span>Descripción breve</span>
          <textarea
            name={`${prefix}-description`}
            rows={3}
            value={form.description}
            onChange={(event) =>
              updateField(
                'description',
                event.target.value,
              )
            }
          />
        </label>

        <label className="chronicle-npc-panel__wide-field">
          <span>Notas privadas</span>
          <textarea
            name={`${prefix}-notes`}
            rows={3}
            value={form.notes}
            onChange={(event) =>
              updateField(
                'notes',
                event.target.value,
              )
            }
          />
        </label>
      </div>
    )
  }

  const editingSelected =
    selectedNpc !== null &&
    editingNpcId === selectedNpc.id

  return (
    <section
      className="chronicle-npc-panel"
      aria-label="Gestión de PNJ"
    >
      <button
        type="button"
        className="chronicle-npc-panel__create-launcher"
        aria-expanded={showCreateForm}
        aria-controls="chronicle-npc-create-panel"
        onClick={() =>
          setShowCreateForm(
            (current) => !current,
          )
        }
      >
        <span>
          <strong>Crear PNJ</strong>
          <small>
            Añade un PNJ simple a esta crónica.
          </small>
        </span>

        <span aria-hidden="true">
          {showCreateForm ? '−' : '+'}
        </span>
      </button>

      {showCreateForm ? (
        <form
          id="chronicle-npc-create-panel"
          className="chronicle-npc-panel__create"
          aria-labelledby="chronicle-npc-create-title"
          onSubmit={createNpc}
        >
          <div className="chronicle-npc-panel__create-heading">
            <h3 id="chronicle-npc-create-title">
              Nuevo PNJ
            </h3>

            <button
              type="button"
              className="chronicle-npc-panel__compact-action"
              onClick={() => {
                setShowCreateForm(false)
                setCreateForm(emptyForm)
              }}
            >
              Cancelar
            </button>
          </div>

          {formFields(
            createForm,
            updateCreateField,
            'create-npc',
          )}

          <button
            type="submit"
            disabled={
              operationId === 'npc-create'
            }
          >
            {operationId === 'npc-create'
              ? 'Creando…'
              : 'Crear PNJ'}
          </button>
        </form>
      ) : null}

      {operationError !== null ? (
        <p
          className="chronicle-npc-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

      <div className="chronicle-npc-panel__workspace">
        <aside
          className="chronicle-npc-panel__browser"
          aria-label="Listado de PNJ"
        >
          <div className="chronicle-npc-panel__browser-heading">
            <h3>Listado de PNJ</h3>
            <span>{npcs.length}</span>
          </div>

          {loading ? (
            <ViewStateStatus
              state="loading"
              className="chronicle-npc-panel__message"
            >
              Cargando PNJ…
            </ViewStateStatus>
          ) : npcs.length === 0 ? (
            <p className="chronicle-npc-panel__empty">
              No hay PNJ registrados en esta crónica.
            </p>
          ) : (
            <ul className="chronicle-npc-panel__list">
              {npcs.map((npc) => {
                const consulting =
                  operationId ===
                  `npc-detail:${npc.id}`

                const selected =
                  selectedNpc?.id ===
                  npc.id

                return (
                  <li
                    key={npc.id}
                    className={
                      'chronicle-npc-panel__item ' +
                      `chronicle-npc-panel__item--${npc.status} ` +
                      (
                        selected
                          ? 'chronicle-npc-panel__item--selected'
                          : ''
                      )
                    }
                  >
                    <button
                      type="button"
                      className="chronicle-npc-panel__select"
                      disabled={consulting}
                      aria-pressed={selected}
                      onClick={() =>
                        void consultNpc(
                          npc.id,
                        )
                      }
                    >
                      <span className="chronicle-npc-panel__select-title">
                        {npc.name}
                      </span>

                      <span className="chronicle-npc-panel__select-meta">
                        {npc.category ??
                          npc.narrativeRole ??
                          'PNJ simple'}
                      </span>

                      <span className="chronicle-npc-panel__select-footer">
                        <span>
                          {npc.narrativeRole ??
                            'Sin rol narrativo'}
                        </span>

                        <span className="chronicle-npc-panel__state">
                          {
                            npcStatusLabels[
                              npc.status
                            ]
                          }
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {npcsNextOffset !== null ? (
            <button
              type="button"
              className="chronicle-npc-panel__load-more"
              onClick={() =>
                void loadMoreNpcs()
              }
              disabled={loadingMoreNpcs}
            >
              {loadingMoreNpcs
                ? 'Cargando más PNJ…'
                : 'Cargar más PNJ'}
            </button>
          ) : null}
        </aside>

        <div className="chronicle-npc-panel__detail">
          {selectedNpc === null ? (
            <div className="chronicle-npc-panel__detail-empty">
              <span>PNJ</span>
              <h3>Selecciona un PNJ</h3>
              <p>
                Elige una entrada del listado para consultar sus datos privados y acciones.
              </p>
            </div>
          ) : (
            <>
              <div className="chronicle-npc-panel__detail-heading">
                <div>
                  <span>
                    Detalle del PNJ
                  </span>
                  <h3>
                    {selectedNpc.name}
                  </h3>
                </div>

                <div className="chronicle-npc-panel__detail-heading-actions">
                  <span className="chronicle-npc-panel__state">
                    {
                      npcStatusLabels[
                        selectedNpc.status
                      ]
                    }
                  </span>

                  <button
                    type="button"
                    className="chronicle-npc-panel__compact-action"
                    onClick={closeDetail}
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {editingSelected ? (
                <form
                  className="chronicle-npc-panel__edit"
                  onSubmit={(event) =>
                    void updateNpc(
                      event,
                      selectedNpc.id,
                    )
                  }
                >
                  {formFields(
                    editForm,
                    updateEditField,
                    `edit-${selectedNpc.id}`,
                  )}

                  <div className="chronicle-npc-panel__actions">
                    <button
                      type="submit"
                      disabled={
                        operationId ===
                        `npc-update:${selectedNpc.id}`
                      }
                    >
                      {operationId ===
                      `npc-update:${selectedNpc.id}`
                        ? 'Guardando…'
                        : 'Guardar cambios'}
                    </button>

                    <button
                      type="button"
                      className="chronicle-npc-panel__compact-action"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <dl className="chronicle-npc-panel__detail-grid">
                    <div>
                      <dt>Tipo o categoría</dt>
                      <dd>
                        {selectedNpc.category ??
                          'Sin categoría'}
                      </dd>
                    </div>

                    <div>
                      <dt>Rol narrativo</dt>
                      <dd>
                        {selectedNpc.narrativeRole ??
                          'Sin rol narrativo'}
                      </dd>
                    </div>

                    <div className="chronicle-npc-panel__detail-wide">
                      <dt>Descripción</dt>
                      <dd>
                        {selectedNpc.description ??
                          'Sin descripción'}
                      </dd>
                    </div>

                    <div className="chronicle-npc-panel__detail-wide">
                      <dt>Notas privadas</dt>
                      <dd>
                        {selectedNpc.notes ??
                          'Sin notas'}
                      </dd>
                    </div>

                    <div>
                      <dt>Creado</dt>
                      <dd>
                        {technicalDate(
                          selectedNpc.createdAt,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Actualizado</dt>
                      <dd>
                        {technicalDate(
                          selectedNpc.updatedAt,
                        )}
                      </dd>
                    </div>
                  </dl>

                  {selectedNpc.status ===
                  'active' ? (
                    <div className="chronicle-npc-panel__actions">
                      <button
                        type="button"
                        className="chronicle-npc-panel__compact-action"
                        onClick={beginEdit}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="chronicle-npc-panel__compact-action"
                        disabled={
                          operationId ===
                          `npc-archive:${selectedNpc.id}`
                        }
                        onClick={() =>
                          void archiveNpc(
                            selectedNpc.id,
                          )
                        }
                      >
                        {operationId ===
                        `npc-archive:${selectedNpc.id}`
                          ? 'Archivando…'
                          : 'Archivar'}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

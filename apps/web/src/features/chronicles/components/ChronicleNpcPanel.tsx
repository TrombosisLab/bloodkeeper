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
}: ChronicleNpcPanelProps) {
  const [npcs, setNpcs] =
    useState<
      readonly ChronicleNpcApiSnapshot[]
    >([])

  const [loading, setLoading] =
    useState(true)

  const [
    operationError,
    setOperationError,
  ] = useState<string | null>(null)

  const [
    operationId,
    setOperationId,
  ] = useState<string | null>(null)

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

  async function loadNpcs() {
    setLoading(true)
    setOperationError(null)

    try {
      setNpcs(
        await gateway.npcs(
          chronicleId,
        ),
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
    const updated =
      await gateway.npcs(
        chronicleId,
      )

    setNpcs(updated)

    if (
      selectedNpc !== null &&
      (
        npcId === undefined ||
        selectedNpc.id === npcId
      )
    ) {
      const refreshed =
        updated.find(
          (npc) =>
            npc.id === selectedNpc.id,
        )

      setSelectedNpc(
        refreshed ?? null,
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
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function beginEdit(
    npc: ChronicleNpcApiSnapshot,
  ) {
    if (npc.status !== 'active') {
      return
    }

    setEditingNpcId(npc.id)
    setEditForm(
      formFromNpc(npc),
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

      if (editingNpcId === npcId) {
        cancelEdit()
      }

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

  return (
    <section
      className="chronicle-npc-panel"
      aria-labelledby="chronicle-npcs-title"
    >
      <div className="chronicle-npc-panel__heading">
        <div>
          <span>
            Información privada del Narrador
          </span>
          <h2 id="chronicle-npcs-title">
            PNJ
          </h2>
        </div>

        <span className="chronicle-npc-panel__count">
          {npcs.length}
        </span>
      </div>

      <form
        className="chronicle-npc-panel__create"
        aria-labelledby="chronicle-npc-create-title"
        onSubmit={createNpc}
      >
        <h3 id="chronicle-npc-create-title">
          Crear PNJ simple
        </h3>

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

      {operationError !== null ? (
        <p
          className="chronicle-npc-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

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
            const updating =
              operationId ===
              `npc-update:${npc.id}`
            const archiving =
              operationId ===
              `npc-archive:${npc.id}`
            const editing =
              editingNpcId === npc.id

            return (
              <li
                key={npc.id}
                className={
                  'chronicle-npc-panel__item ' +
                  `chronicle-npc-panel__item--${npc.status}`
                }
              >
                <div className="chronicle-npc-panel__item-heading">
                  <div>
                    <strong>
                      {npc.name}
                    </strong>

                    <span>
                      {npc.category ??
                        npc.narrativeRole ??
                        'PNJ simple'}
                    </span>
                  </div>

                  <span className="chronicle-npc-panel__state">
                    {
                      npcStatusLabels[
                        npc.status
                      ]
                    }
                  </span>
                </div>

                {editing ? (
                  <form
                    className="chronicle-npc-panel__edit"
                    onSubmit={(event) =>
                      void updateNpc(
                        event,
                        npc.id,
                      )
                    }
                  >
                    {formFields(
                      editForm,
                      updateEditField,
                      `edit-${npc.id}`,
                    )}

                    <div className="chronicle-npc-panel__actions">
                      <button
                        type="submit"
                        disabled={updating}
                      >
                        {updating
                          ? 'Guardando…'
                          : 'Guardar'}
                      </button>

                      <button
                        type="button"
                        className="chronicle-npc-panel__compact-action"
                        disabled={updating}
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="chronicle-npc-panel__actions">
                    <button
                      type="button"
                      className="chronicle-npc-panel__compact-action"
                      disabled={consulting}
                      onClick={() =>
                        void consultNpc(
                          npc.id,
                        )
                      }
                    >
                      {consulting
                        ? 'Consultando…'
                        : 'Consultar'}
                    </button>

                    {npc.status ===
                    'active' ? (
                      <>
                        <button
                          type="button"
                          className="chronicle-npc-panel__compact-action"
                          onClick={() =>
                            beginEdit(npc)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="chronicle-npc-panel__compact-action"
                          disabled={archiving}
                          onClick={() =>
                            void archiveNpc(
                              npc.id,
                            )
                          }
                        >
                          {archiving
                            ? 'Archivando…'
                            : 'Archivar'}
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {selectedNpc !== null ? (
        <section
          className="chronicle-npc-panel__detail"
          aria-labelledby="chronicle-npc-detail-title"
        >
          <div className="chronicle-npc-panel__detail-heading">
            <div>
              <span>Consulta rápida</span>
              <h3 id="chronicle-npc-detail-title">
                {selectedNpc.name}
              </h3>
            </div>

            <button
              type="button"
              className="chronicle-npc-panel__compact-action"
              onClick={() =>
                setSelectedNpc(null)
              }
            >
              Cerrar detalle
            </button>
          </div>

          <dl className="chronicle-npc-panel__detail-grid">
            <div>
              <dt>Estado</dt>
              <dd>
                {
                  npcStatusLabels[
                    selectedNpc.status
                  ]
                }
              </dd>
            </div>

            <div>
              <dt>Nivel</dt>
              <dd>Simple</dd>
            </div>

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
        </section>
      ) : null}
    </section>
  )
}

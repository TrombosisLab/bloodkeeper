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
  ChronicleLocationApiSnapshot,
  CreateChronicleLocationApiRequest,
} from '../types/chronicle-api.types.ts'

import './chronicle-location-panel.css'

const gateway =
  createChronicleGateway()

interface ChronicleLocationPanelProps {
  readonly chronicleId: string
  readonly onCountChange?: (
    count: number,
  ) => void
}

interface LocationFormState {
  readonly name: string
  readonly category: string
  readonly description: string
  readonly narratorNotes: string
  readonly parentLocationId: string
}

const emptyForm: LocationFormState = {
  name: '',
  category: '',
  description: '',
  narratorNotes: '',
  parentLocationId: '',
}

const locationStatusLabels = {
  active: 'Activa',
  archived: 'Archivada',
} as const

function optionalText(
  value: string,
): string | null {
  const trimmed = value.trim()

  return trimmed.length === 0
    ? null
    : trimmed
}

function requestFromForm(
  form: LocationFormState,
): CreateChronicleLocationApiRequest {
  return {
    name: form.name.trim(),
    category:
      optionalText(form.category),
    description:
      optionalText(form.description),
    narratorNotes:
      optionalText(
        form.narratorNotes,
      ),
    parentLocationId:
      form.parentLocationId.length === 0
        ? null
        : form.parentLocationId,
  }
}

function formFromLocation(
  location: ChronicleLocationApiSnapshot,
): LocationFormState {
  return {
    name: location.name,
    category: location.category ?? '',
    description:
      location.description ?? '',
    narratorNotes:
      location.narratorNotes ?? '',
    parentLocationId:
      location.parentLocationId ?? '',
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
      case 'CHRONICLE_LOCATION_PERMISSION_DENIED':
        return 'Tu rol contextual no permite gestionar Localizaciones.'

      case 'CHRONICLE_LOCATION_NOT_FOUND':
        return 'La Localización ya no está disponible.'

      case 'CHRONICLE_LOCATION_PARENT_NOT_FOUND':
        return 'La Localización padre ya no está disponible en esta crónica.'

      case 'CHRONICLE_LOCATION_HIERARCHY_CYCLE':
        return 'La relación de contención crearía un ciclo.'

      case 'INVALID_CHRONICLE_LOCATION_REQUEST':
        return 'Revisa los datos de la Localización.'
    }
  }

  return 'No se pudo completar la operación sobre la Localización.'
}

export function ChronicleLocationPanel({
  chronicleId,
  onCountChange,
}: ChronicleLocationPanelProps) {
  const [
    locations,
    setLocations,
  ] = useState<
    readonly ChronicleLocationApiSnapshot[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(true)

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
  ] = useState<LocationFormState>(
    emptyForm,
  )

  const [
    editingLocationId,
    setEditingLocationId,
  ] = useState<string | null>(
    null,
  )

  const [
    editForm,
    setEditForm,
  ] = useState<LocationFormState>(
    emptyForm,
  )

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState<
    ChronicleLocationApiSnapshot | null
  >(null)

  function replaceLocations(
    items:
      readonly ChronicleLocationApiSnapshot[],
  ) {
    setLocations(items)
    onCountChange?.(items.length)
  }

  async function loadLocations() {
    setLoading(true)
    setOperationError(null)

    try {
      const loadedLocations =
        await gateway.locations(
          chronicleId,
        )

      replaceLocations(
        loadedLocations,
      )

      if (loadedLocations.length > 0) {
        setSelectedLocation(
          await gateway.location(
            chronicleId,
            loadedLocations[0].id,
          ),
        )
      } else {
        setSelectedLocation(null)
      }
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSelectedLocation(null)
    setEditingLocationId(null)
    setEditForm(emptyForm)
    void loadLocations()
  }, [chronicleId])

  function updateCreateField(
    field: keyof LocationFormState,
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
    field: keyof LocationFormState,
    value: string,
  ) {
    setEditForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )
  }

  function locationName(
    locationId: string | null,
  ): string {
    if (locationId === null) {
      return 'Raíz de la crónica'
    }

    return (
      locations.find(
        (location) =>
          location.id === locationId,
      )?.name ??
      'Localización no disponible'
    )
  }

  async function refreshAfterWrite(
    locationId?: string,
  ) {
    const updated =
      await gateway.locations(
        chronicleId,
      )

    replaceLocations(updated)

    if (
      selectedLocation !== null &&
      (
        locationId === undefined ||
        selectedLocation.id ===
          locationId
      )
    ) {
      const refreshed =
        updated.find(
          (location) =>
            location.id ===
            selectedLocation.id,
        )

      setSelectedLocation(
        refreshed ?? null,
      )
    }
  }

  async function createLocation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const request =
      requestFromForm(createForm)

    if (request.name.length === 0) {
      setOperationError(
        'El nombre de la Localización es obligatorio.',
      )
      return
    }

    setOperationId(
      'location-create',
    )
    setOperationError(null)

    try {
      await gateway.createLocation(
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

  async function consultLocation(
    locationId: string,
  ) {
    setOperationId(
      `location-detail:${locationId}`,
    )
    setOperationError(null)

    try {
      setSelectedLocation(
        await gateway.location(
          chronicleId,
          locationId,
        ),
      )
      setEditingLocationId(null)
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
    setSelectedLocation(null)
    setEditingLocationId(null)
    setEditForm(emptyForm)
  }

  function beginEdit() {
    if (
      selectedLocation === null ||
      selectedLocation.status !==
        'active'
    ) {
      return
    }

    setEditingLocationId(
      selectedLocation.id,
    )
    setEditForm(
      formFromLocation(
        selectedLocation,
      ),
    )
    setOperationError(null)
  }

  function cancelEdit() {
    setEditingLocationId(null)
    setEditForm(emptyForm)
  }

  async function updateLocation(
    event: FormEvent<HTMLFormElement>,
    locationId: string,
  ) {
    event.preventDefault()

    const request =
      requestFromForm(editForm)

    if (request.name.length === 0) {
      setOperationError(
        'El nombre de la Localización es obligatorio.',
      )
      return
    }

    setOperationId(
      `location-update:${locationId}`,
    )
    setOperationError(null)

    try {
      await gateway.updateLocation(
        chronicleId,
        locationId,
        request,
      )

      cancelEdit()
      await refreshAfterWrite(
        locationId,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  async function archiveLocation(
    locationId: string,
  ) {
    setOperationId(
      `location-archive:${locationId}`,
    )
    setOperationError(null)

    try {
      await gateway.archiveLocation(
        chronicleId,
        locationId,
      )

      cancelEdit()
      await refreshAfterWrite(
        locationId,
      )
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function parentOptions(
    currentLocationId?: string,
  ) {
    return locations.filter(
      (location) =>
        location.id !==
        currentLocationId,
    )
  }

  function formFields(
    form: LocationFormState,
    updateField: (
      field: keyof LocationFormState,
      value: string,
    ) => void,
    prefix: string,
    currentLocationId?: string,
  ) {
    return (
      <div className="chronicle-location-panel__fields">
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
          <span>Dentro de</span>
          <select
            name={`${prefix}-parent`}
            value={
              form.parentLocationId
            }
            onChange={(event) =>
              updateField(
                'parentLocationId',
                event.target.value,
              )
            }
          >
            <option value="">
              Raíz de la crónica
            </option>

            {parentOptions(
              currentLocationId,
            ).map(
              (location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.name}
                  {location.status ===
                  'archived'
                    ? ' — Archivada'
                    : ''}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="chronicle-location-panel__wide-field">
          <span>Descripción</span>
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

        <label className="chronicle-location-panel__wide-field">
          <span>Notas privadas</span>
          <textarea
            name={`${prefix}-narrator-notes`}
            rows={3}
            value={form.narratorNotes}
            onChange={(event) =>
              updateField(
                'narratorNotes',
                event.target.value,
              )
            }
          />
        </label>
      </div>
    )
  }

  const editingSelected =
    selectedLocation !== null &&
    editingLocationId ===
      selectedLocation.id

  return (
    <section
      className="chronicle-location-panel"
      aria-label="Gestión de Localizaciones"
    >
      <button
        type="button"
        className="chronicle-location-panel__create-launcher"
        aria-expanded={showCreateForm}
        aria-controls="chronicle-location-create-panel"
        onClick={() =>
          setShowCreateForm(
            (current) => !current,
          )
        }
      >
        <span>
          <strong>
            Crear Localización
          </strong>
          <small>
            Añade una localización y, si procede, asígnala dentro de otra.
          </small>
        </span>

        <span aria-hidden="true">
          {showCreateForm ? '−' : '+'}
        </span>
      </button>

      {showCreateForm ? (
        <form
          id="chronicle-location-create-panel"
          className="chronicle-location-panel__create"
          aria-labelledby="chronicle-location-create-title"
          onSubmit={createLocation}
        >
          <div className="chronicle-location-panel__create-heading">
            <h3 id="chronicle-location-create-title">
              Nueva Localización
            </h3>

            <button
              type="button"
              className="chronicle-location-panel__compact-action"
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
            'create-location',
          )}

          <button
            type="submit"
            disabled={
              operationId ===
              'location-create'
            }
          >
            {operationId ===
            'location-create'
              ? 'Creando…'
              : 'Crear Localización'}
          </button>
        </form>
      ) : null}

      {operationError !== null ? (
        <p
          className="chronicle-location-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

      <div className="chronicle-location-panel__workspace">
        <aside
          className="chronicle-location-panel__browser"
          aria-label="Listado de Localizaciones"
        >
          <div className="chronicle-location-panel__browser-heading">
            <h3>Localizaciones</h3>
            <span>
              {locations.length}
            </span>
          </div>

          {loading ? (
            <ViewStateStatus
              state="loading"
              className="chronicle-location-panel__message"
            >
              Cargando Localizaciones…
            </ViewStateStatus>
          ) : locations.length === 0 ? (
            <p className="chronicle-location-panel__empty">
              No hay Localizaciones registradas en esta crónica.
            </p>
          ) : (
            <ul className="chronicle-location-panel__list">
              {locations.map(
                (location) => {
                  const consulting =
                    operationId ===
                    `location-detail:${location.id}`

                  const selected =
                    selectedLocation?.id ===
                    location.id

                  return (
                    <li
                      key={location.id}
                      className={
                        'chronicle-location-panel__item ' +
                        `chronicle-location-panel__item--${location.status} ` +
                        (
                          selected
                            ? 'chronicle-location-panel__item--selected'
                            : ''
                        )
                      }
                    >
                      <button
                        type="button"
                        className="chronicle-location-panel__select"
                        disabled={consulting}
                        aria-pressed={selected}
                        onClick={() =>
                          void consultLocation(
                            location.id,
                          )
                        }
                      >
                        <span className="chronicle-location-panel__select-title">
                          {location.name}
                        </span>

                        <span className="chronicle-location-panel__select-meta">
                          {location.category ??
                            'Sin categoría'}
                        </span>

                        <span className="chronicle-location-panel__select-footer">
                          <span>
                            {location.parentLocationId ===
                            null
                              ? 'Raíz de la crónica'
                              : `Dentro de ${locationName(
                                  location.parentLocationId,
                                )}`}
                          </span>

                          <span className="chronicle-location-panel__state">
                            {
                              locationStatusLabels[
                                location.status
                              ]
                            }
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                },
              )}
            </ul>
          )}
        </aside>

        <div className="chronicle-location-panel__detail">
          {selectedLocation === null ? (
            <div className="chronicle-location-panel__detail-empty">
              <span>Localización</span>
              <h3>
                Selecciona una Localización
              </h3>
              <p>
                Elige una entrada del listado para consultar su jerarquía, información privada y acciones.
              </p>
            </div>
          ) : (
            <>
              <div className="chronicle-location-panel__detail-heading">
                <div>
                  <span>
                    Detalle de la Localización
                  </span>
                  <h3>
                    {selectedLocation.name}
                  </h3>
                </div>

                <div className="chronicle-location-panel__detail-heading-actions">
                  <span className="chronicle-location-panel__state">
                    {
                      locationStatusLabels[
                        selectedLocation.status
                      ]
                    }
                  </span>

                  <button
                    type="button"
                    className="chronicle-location-panel__compact-action"
                    onClick={closeDetail}
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {editingSelected ? (
                <form
                  className="chronicle-location-panel__edit"
                  onSubmit={(event) =>
                    void updateLocation(
                      event,
                      selectedLocation.id,
                    )
                  }
                >
                  {formFields(
                    editForm,
                    updateEditField,
                    `edit-${selectedLocation.id}`,
                    selectedLocation.id,
                  )}

                  <div className="chronicle-location-panel__actions">
                    <button
                      type="submit"
                      disabled={
                        operationId ===
                        `location-update:${selectedLocation.id}`
                      }
                    >
                      {operationId ===
                      `location-update:${selectedLocation.id}`
                        ? 'Guardando…'
                        : 'Guardar cambios'}
                    </button>

                    <button
                      type="button"
                      className="chronicle-location-panel__compact-action"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <dl className="chronicle-location-panel__detail-grid">
                    <div>
                      <dt>Tipo o categoría</dt>
                      <dd>
                        {selectedLocation.category ??
                          'Sin categoría'}
                      </dd>
                    </div>

                    <div>
                      <dt>Dentro de</dt>
                      <dd>
                        {locationName(
                          selectedLocation.parentLocationId,
                        )}
                      </dd>
                    </div>

                    <div className="chronicle-location-panel__detail-wide">
                      <dt>Descripción</dt>
                      <dd>
                        {selectedLocation.description ??
                          'Sin descripción'}
                      </dd>
                    </div>

                    <div className="chronicle-location-panel__detail-wide">
                      <dt>Notas privadas</dt>
                      <dd>
                        {selectedLocation.narratorNotes ??
                          'Sin notas'}
                      </dd>
                    </div>

                    <div>
                      <dt>Creada</dt>
                      <dd>
                        {technicalDate(
                          selectedLocation.createdAt,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Actualizada</dt>
                      <dd>
                        {technicalDate(
                          selectedLocation.updatedAt,
                        )}
                      </dd>
                    </div>
                  </dl>

                  {selectedLocation.status ===
                  'active' ? (
                    <div className="chronicle-location-panel__actions">
                      <button
                        type="button"
                        className="chronicle-location-panel__compact-action"
                        onClick={beginEdit}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="chronicle-location-panel__compact-action"
                        disabled={
                          operationId ===
                          `location-archive:${selectedLocation.id}`
                        }
                        onClick={() =>
                          void archiveLocation(
                            selectedLocation.id,
                          )
                        }
                      >
                        {operationId ===
                        `location-archive:${selectedLocation.id}`
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

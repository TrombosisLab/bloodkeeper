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
}: ChronicleLocationPanelProps) {
  const [
    locations,
    setLocations,
  ] = useState<
    readonly ChronicleLocationApiSnapshot[]
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

  async function loadLocations() {
    setLoading(true)
    setOperationError(null)

    try {
      setLocations(
        await gateway.locations(
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

    setLocations(updated)

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
    } catch (error: unknown) {
      setOperationError(
        operationErrorMessage(error),
      )
    } finally {
      setOperationId(null)
    }
  }

  function beginEdit(
    location: ChronicleLocationApiSnapshot,
  ) {
    if (
      location.status !== 'active'
    ) {
      return
    }

    setEditingLocationId(
      location.id,
    )
    setEditForm(
      formFromLocation(location),
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

      if (
        editingLocationId ===
        locationId
      ) {
        cancelEdit()
      }

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

  return (
    <section
      className="chronicle-location-panel"
      aria-labelledby="chronicle-locations-title"
    >
      <div className="chronicle-location-panel__heading">
        <div>
          <span>
            Información privada del Narrador
          </span>
          <h2 id="chronicle-locations-title">
            Localizaciones
          </h2>
        </div>

        <span className="chronicle-location-panel__count">
          {locations.length}
        </span>
      </div>

      <form
        className="chronicle-location-panel__create"
        aria-labelledby="chronicle-location-create-title"
        onSubmit={createLocation}
      >
        <h3 id="chronicle-location-create-title">
          Crear Localización
        </h3>

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

      {operationError !== null ? (
        <p
          className="chronicle-location-panel__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

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
              const updating =
                operationId ===
                `location-update:${location.id}`
              const archiving =
                operationId ===
                `location-archive:${location.id}`
              const editing =
                editingLocationId ===
                location.id

              return (
                <li
                  key={location.id}
                  className={
                    'chronicle-location-panel__item ' +
                    `chronicle-location-panel__item--${location.status}`
                  }
                >
                  <div className="chronicle-location-panel__item-heading">
                    <div>
                      <strong>
                        {location.name}
                      </strong>

                      <span>
                        {location.parentLocationId ===
                        null
                          ? (
                              location.category ??
                              'Localización raíz'
                            )
                          : `Dentro de ${locationName(
                              location.parentLocationId,
                            )}`}
                      </span>
                    </div>

                    <span className="chronicle-location-panel__state">
                      {
                        locationStatusLabels[
                          location.status
                        ]
                      }
                    </span>
                  </div>

                  {editing ? (
                    <form
                      className="chronicle-location-panel__edit"
                      onSubmit={(event) =>
                        void updateLocation(
                          event,
                          location.id,
                        )
                      }
                    >
                      {formFields(
                        editForm,
                        updateEditField,
                        `edit-${location.id}`,
                        location.id,
                      )}

                      <div className="chronicle-location-panel__actions">
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
                          className="chronicle-location-panel__compact-action"
                          disabled={updating}
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="chronicle-location-panel__actions">
                      <button
                        type="button"
                        className="chronicle-location-panel__compact-action"
                        disabled={consulting}
                        onClick={() =>
                          void consultLocation(
                            location.id,
                          )
                        }
                      >
                        {consulting
                          ? 'Consultando…'
                          : 'Consultar'}
                      </button>

                      {location.status ===
                      'active' ? (
                        <>
                          <button
                            type="button"
                            className="chronicle-location-panel__compact-action"
                            onClick={() =>
                              beginEdit(
                                location,
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="chronicle-location-panel__compact-action"
                            disabled={archiving}
                            onClick={() =>
                              void archiveLocation(
                                location.id,
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
            },
          )}
        </ul>
      )}

      {selectedLocation !== null ? (
        <section
          className="chronicle-location-panel__detail"
          aria-labelledby="chronicle-location-detail-title"
        >
          <div className="chronicle-location-panel__detail-heading">
            <div>
              <span>Consulta rápida</span>
              <h3 id="chronicle-location-detail-title">
                {selectedLocation.name}
              </h3>
            </div>

            <button
              type="button"
              className="chronicle-location-panel__compact-action"
              onClick={() =>
                setSelectedLocation(null)
              }
            >
              Cerrar detalle
            </button>
          </div>

          <dl className="chronicle-location-panel__detail-grid">
            <div>
              <dt>Estado</dt>
              <dd>
                {
                  locationStatusLabels[
                    selectedLocation.status
                  ]
                }
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

            <div>
              <dt>Tipo o categoría</dt>
              <dd>
                {selectedLocation.category ??
                  'Sin categoría'}
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
        </section>
      ) : null}
    </section>
  )
}

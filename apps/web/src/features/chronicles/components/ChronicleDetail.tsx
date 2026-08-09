import {
  useEffect,
  useState,
} from 'react'

import {
  ChronicleApiError,
  createChronicleGateway,
} from '../infrastructure/chronicle.api.ts'

import type {
  ChronicleApiSnapshot,
  ChronicleApiStatus,
} from '../types/chronicle-api.types.ts'

import { ViewStateStatus } from '../../../components/ui/ViewStateStatus'

import './chronicle-detail.css'

const gateway =
  createChronicleGateway()

const statusLabels:
  Readonly<Record<ChronicleApiStatus, string>> = {
    preparation: 'Preparación',
    active: 'Activa',
    archived: 'Archivada',
  }

interface ChronicleDetailProps {
  readonly chronicleId: string
  readonly onBack: () => void
}

function detailErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ChronicleApiError
  ) {
    if (
      error.code ===
      'CHRONICLE_NOT_FOUND'
    ) {
      return 'La crónica no está disponible.'
    }

    if (
      error.code ===
        'AUTHENTICATION_REQUIRED' ||
      error.code ===
        'CHRONICLE_PERMISSION_DENIED'
    ) {
      return 'No tienes permiso para consultar esta crónica.'
    }
  }

  return 'No se pudo cargar la crónica.'
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

export function ChronicleDetail({
  chronicleId,
  onBack,
}: ChronicleDetailProps) {
  const [
    chronicle,
    setChronicle,
  ] = useState<
    ChronicleApiSnapshot | null
  >(null)

  const [loading, setLoading] =
    useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const loaded =
          await gateway.get(
            chronicleId,
          )

        if (!cancelled) {
          setChronicle(loaded)
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setChronicle(null)
          setError(
            detailErrorMessage(
              loadError,
            ),
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [chronicleId])

  if (loading) {
    return (
      <section className="chronicle-detail">
        <ViewStateStatus
          state="loading"
          className="chronicle-detail__message"
        >
          Cargando crónica…
        </ViewStateStatus>
      </section>
    )
  }

  if (
    error !== null ||
    chronicle === null
  ) {
    return (
      <section className="chronicle-detail">
        <div
          className="chronicle-detail__message chronicle-detail__message--error"
          data-view-state="error"
          role="alert"
          aria-live="assertive"
        >
          <p>
            {error ??
              'No se pudo cargar la crónica.'}
          </p>

          <button
            type="button"
            onClick={onBack}
          >
            Volver a crónicas
          </button>
        </div>
      </section>
    )
  }

  return (
    <section
      className="chronicle-detail"
      aria-labelledby="chronicle-detail-title"
      data-view-state="content"
    >
      <header className="chronicle-detail__header">
        <div>
          <span className="chronicle-detail__eyebrow">
            Crónica
          </span>

          <h1 id="chronicle-detail-title">
            {chronicle.name}
          </h1>
        </div>

        <button
          type="button"
          onClick={onBack}
        >
          Volver a crónicas
        </button>
      </header>

      <section
        className="chronicle-detail__summary"
        aria-labelledby="chronicle-summary-title"
      >
        <div className="chronicle-detail__summary-heading">
          <h2 id="chronicle-summary-title">
            Resumen
          </h2>

          <span className="chronicle-detail__status">
            {
              statusLabels[
                chronicle.status
              ]
            }
          </span>
        </div>

        {chronicle.description !==
        null ? (
          <p className="chronicle-detail__description">
            {chronicle.description}
          </p>
        ) : (
          <p className="chronicle-detail__empty">
            Sin descripción o premisa.
          </p>
        )}

        <dl className="chronicle-detail__metadata">
          <div>
            <dt>Creada</dt>
            <dd>
              {technicalDate(
                chronicle.createdAt,
              )}
            </dd>
          </div>

          <div>
            <dt>Última actualización</dt>
            <dd>
              {technicalDate(
                chronicle.updatedAt,
              )}
            </dd>
          </div>
        </dl>
      </section>
    </section>
  )
}

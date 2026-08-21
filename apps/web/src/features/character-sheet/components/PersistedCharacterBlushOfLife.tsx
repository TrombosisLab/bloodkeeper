import {
  useRef,
  useState,
} from 'react'

import {
  CharacterBlushOfLifeApiError,
  createCharacterBlushOfLifeGateway,
  createCharacterBlushOfLifeOperationId,
} from '../infrastructure/character-blush-of-life.api'

import type {
  CharacterBlushOfLifeResult,
} from '../types/character-blush-of-life-persistence.types'

interface PersistedCharacterBlushOfLifeProps {
  readonly characterId: string
  readonly revision: number
  readonly hunger: number
  readonly result:
    CharacterBlushOfLifeResult | null
  readonly onApplied: (
    result:
      CharacterBlushOfLifeResult,
  ) => void
  readonly onConflictReload: () => void
}

type Status =
  | 'ready'
  | 'submitting'
  | 'retryable'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'rejected'
  | 'error'

const blushOfLifeGateway =
  createCharacterBlushOfLifeGateway()

function messageFor(
  status: Status,
): string | null {
  switch (status) {
    case 'submitting':
      return 'Resolviendo Rubor de la Vida…'
    case 'retryable':
      return 'No se pudo confirmar el resultado. Puedes reintentar sin duplicar la operación.'
    case 'unauthorized':
      return 'Tu sesión ya no está disponible.'
    case 'forbidden':
      return 'No tienes permiso para usar Rubor de la Vida con este personaje.'
    case 'not-found':
      return 'El personaje ya no está disponible.'
    case 'conflict':
      return 'La ficha ha cambiado. Recárgala antes de volver a intentarlo.'
    case 'rejected':
      return 'Rubor de la Vida no puede resolverse en el estado actual del personaje.'
    case 'error':
      return 'No se pudo resolver Rubor de la Vida.'
    default:
      return null
  }
}

function BlushResult({
  result,
}: {
  readonly result:
    CharacterBlushOfLifeResult
}) {
  if (
    result.outcome ===
      'rouseExempted'
  ) {
    return (
      <div
        className="blush-of-life__result blush-of-life__result--exempted"
        role="status"
        aria-live="polite"
      >
        <strong>
          Control omitido por Discrasia
        </strong>
        <span>
          Rubor de la Vida no requirió
          Control de Enardecimiento.
        </span>
        <span>
          Hambre{' '}
          {result.hungerBefore}
          {' → '}
          {result.hungerAfter}
        </span>
      </div>
    )
  }

  return (
    <div
      className="blush-of-life__result"
      role="status"
      aria-live="polite"
    >
      <strong>
        {result.rouse.success
          ? 'Éxito'
          : 'Fallo'}
      </strong>

      <div
        className="rouse-check__dice"
        aria-label={`Resultado del Control de Enardecimiento: ${result.rouse.selectedResult}`}
      >
        {result.rouse.rolls.map(
          (roll, index) => (
            <span
              className={[
                'rouse-check__die',
                roll ===
                  result.rouse
                    .selectedResult
                  ? 'rouse-check__die--selected'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={`${index}-${roll}`}
            >
              {roll}
            </span>
          ),
        )}
      </div>

      <span>
        Hambre{' '}
        {result.rouse.hungerBefore}
        {' → '}
        {result.rouse.hungerAfter}
      </span>
    </div>
  )
}

export function PersistedCharacterBlushOfLife({
  characterId,
  revision,
  hunger,
  result,
  onApplied,
  onConflictReload,
}: PersistedCharacterBlushOfLifeProps) {
  const [
    status,
    setStatus,
  ] =
    useState<Status>('ready')

  const operationIdRef =
    useRef<string | null>(
      null,
    )

  const submittingRef =
    useRef(false)

  const apply = async () => {
    if (
      submittingRef.current
    ) {
      return
    }

    submittingRef.current =
      true
    setStatus('submitting')

    const operationId =
      operationIdRef.current ??
      createCharacterBlushOfLifeOperationId()

    operationIdRef.current =
      operationId

    try {
      const next =
        await blushOfLifeGateway
          .useBlushOfLife(
            characterId,
            {
              expectedRevision:
                revision,
              operationId,
            },
          )

      operationIdRef.current =
        null
      setStatus('ready')
      onApplied(next)
    } catch (error: unknown) {
      if (
        error instanceof
          CharacterBlushOfLifeApiError
      ) {
        if (
          error.status === 0 ||
          error.status >= 500
        ) {
          setStatus(
            'retryable',
          )
          return
        }

        operationIdRef.current =
          null

        switch (
          error.status
        ) {
          case 401:
            setStatus(
              'unauthorized',
            )
            return
          case 403:
            setStatus(
              'forbidden',
            )
            return
          case 404:
            setStatus(
              'not-found',
            )
            return
          case 409:
            setStatus(
              'conflict',
            )
            return
          case 400:
          case 422:
            setStatus(
              'rejected',
            )
            return
          default:
            setStatus(
              'error',
            )
            return
        }
      }

      operationIdRef.current =
        null
      setStatus('error')
    } finally {
      submittingRef.current =
        false
    }
  }

  const message =
    messageFor(status)

  return (
    <section
      className="blush-of-life"
      aria-labelledby="blush-of-life-title"
    >
      <div className="blush-of-life__heading">
        <div>
          <h4 id="blush-of-life-title">
            Rubor de la Vida
          </h4>
          <p>
            El servidor resuelve el
            Control y cualquier exención
            activa.
          </p>
        </div>

        <button
          className="character-sheet__action-button"
          type="button"
          disabled={
            status ===
              'submitting'
          }
          onClick={() => {
            void apply()
          }}
        >
          {status ===
            'submitting'
            ? 'Resolviendo…'
            : status ===
                'retryable'
              ? 'Reintentar Rubor'
              : 'Usar Rubor'}
        </button>
      </div>

      {hunger === 5 ? (
        <p className="blush-of-life__hunger-five-note">
          Hambre 5: el servidor
          comprobará primero si una
          Discrasia te exime del Control.
        </p>
      ) : null}

      {message !== null ? (
        <p
          className="blush-of-life__message"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      {status ===
        'conflict' ? (
        <button
          className="character-sheet__secondary-button"
          type="button"
          onClick={
            onConflictReload
          }
        >
          Recargar ficha
        </button>
      ) : null}

      {result !== null ? (
        <BlushResult
          result={result}
        />
      ) : null}
    </section>
  )
}

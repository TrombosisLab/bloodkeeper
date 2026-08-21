import {
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  CharacterRouseCheckApiError,
  createCharacterRouseCheckGateway,
  createCharacterRouseCheckOperationId,
} from '../infrastructure/character-rouse-check.api'

import type {
  CharacterRouseCheckGateway,
  CharacterRouseCheckResult,
} from '../types/character-rouse-check-persistence.types'

interface PersistedCharacterRouseCheckProps {
  characterId: string
  revision: number
  hunger: number
  result?: CharacterRouseCheckResult | null
  gateway?: CharacterRouseCheckGateway
  onApplied: (
    result: CharacterRouseCheckResult,
  ) => void
  onConflictReload?: () => void
}

type SubmissionState =
  | 'ready'
  | 'submitting'
  | 'retryable'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'rejected'
  | 'error'

function submissionForError(
  error: unknown,
): SubmissionState {
  if (
    error instanceof
      CharacterRouseCheckApiError
  ) {
    if (
      error.status === 0 ||
      error.status >= 500
    ) {
      return 'retryable'
    }

    if (error.status === 401) {
      return 'unauthorized'
    }

    if (error.status === 403) {
      return 'forbidden'
    }

    if (error.status === 404) {
      return 'not-found'
    }

    if (error.status === 409) {
      return 'conflict'
    }

    if (
      error.status === 400 ||
      error.status === 422
    ) {
      return 'rejected'
    }
  }

  return 'error'
}

function messageForSubmission(
  state: SubmissionState,
): string | null {
  switch (state) {
    case 'submitting':
      return 'Resolviendo Control de Enardecimiento…'
    case 'retryable':
      return 'No se confirmó el resultado. Puedes reintentar la misma operación sin duplicarla.'
    case 'unauthorized':
      return 'La sesión ya no permite realizar el Control.'
    case 'forbidden':
      return 'No tienes permiso para realizar el Control de este personaje.'
    case 'not-found':
      return 'El personaje ya no está disponible.'
    case 'conflict':
      return 'La ficha cambió en otra operación. Recárgala antes de realizar un nuevo Control.'
    case 'rejected':
      return 'El Control no está disponible para el estado actual del personaje.'
    case 'error':
      return 'No se pudo realizar el Control de Enardecimiento.'
    case 'ready':
      return null
  }
}

function resultLabel(
  result: CharacterRouseCheckResult,
): string {
  return result.success
    ? 'Éxito'
    : 'Fallo'
}

export function PersistedCharacterRouseCheck({
  characterId,
  revision,
  hunger,
  result = null,
  gateway,
  onApplied,
  onConflictReload,
}: PersistedCharacterRouseCheckProps) {
  const resolvedGateway =
    useMemo(
      () =>
        gateway ??
        createCharacterRouseCheckGateway(),
      [gateway],
    )

  const [submission, setSubmission] =
    useState<SubmissionState>('ready')

  const submittingRef =
    useRef(false)

  const operationIdRef =
    useRef<string | null>(null)

  const hungerMaximum =
    hunger >= 5

  const message =
    messageForSubmission(submission)

  const retry =
    submission === 'retryable'

  async function execute(): Promise<void> {
    if (
      hungerMaximum ||
      submittingRef.current
    ) {
      return
    }

    submittingRef.current = true
    setSubmission('submitting')

    try {
      const operationId =
        operationIdRef.current ??
        createCharacterRouseCheckOperationId()

      operationIdRef.current =
        operationId

      const nextResult =
        await resolvedGateway.execute(
          characterId,
          {
            expectedRevision: revision,
            operationId,
            reason: 'other',
          },
        )

      operationIdRef.current = null
      setSubmission('ready')
      onApplied(nextResult)
    } catch (error: unknown) {
      const nextSubmission =
        submissionForError(error)

      if (nextSubmission !== 'retryable') {
        operationIdRef.current = null
      }

      setSubmission(nextSubmission)
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <div
      className="rouse-check"
      data-rouse-check="manual"
    >
      <div className="rouse-check__toolbar">
        <div>
          <strong>
            Control de Enardecimiento
          </strong>

          <span>
            Realiza un Control manual sin abrir
            el constructor general de dados.
          </span>
        </div>

        <button
          type="button"
          className="rouse-check__action"
          disabled={
            hungerMaximum ||
            submission === 'submitting'
          }
          aria-describedby={
            hungerMaximum
              ? 'rouse-check-hunger-five'
              : undefined
          }
          onClick={() => void execute()}
        >
          {submission === 'submitting'
            ? 'Resolviendo…'
            : retry
              ? 'Reintentar Control'
              : 'Realizar Control'}
        </button>
      </div>

      {hungerMaximum ? (
        <p
          id="rouse-check-hunger-five"
          className="rouse-check__notice"
          role="status"
        >
          No disponible con Hambre 5. No
          puedes iniciar voluntariamente un
          Control de Enardecimiento.
        </p>
      ) : null}

      {result !== null ? (
        <div
          className="rouse-check__result"
          role="status"
          aria-live="polite"
          data-rouse-result={
            result.success
              ? 'success'
              : 'failure'
          }
        >
          <div className="rouse-check__result-heading">
            <div>
              <span>Último Control</span>
              <strong>
                {resultLabel(result)}
              </strong>
            </div>

            <span>
              Hambre {result.hungerBefore}
              {' → '}
              {result.hungerAfter}
            </span>
          </div>

          <div
            className="rouse-check__dice"
            aria-label="Dados del último Control de Enardecimiento"
          >
            {result.rolls.map(
              (roll, index) => (
                <span
                  key={`${index}:${roll}`}
                  className={
                    roll ===
                    result.selectedResult
                      ? (
                          'rouse-check__die ' +
                          'rouse-check__die--selected'
                        )
                      : 'rouse-check__die'
                  }
                  aria-label={
                    `Dado ${index + 1}: ${roll}`
                  }
                >
                  {roll}
                </span>
              ),
            )}
          </div>

          {result.rolls.length > 1 ? (
            <small>
              Resultado usado:
              {' '}
              {result.selectedResult}
            </small>
          ) : null}
        </div>
      ) : null}

      {message !== null ? (
        <div
          className="rouse-check__message"
          role="status"
          aria-live="polite"
        >
          <span>{message}</span>

          {submission === 'conflict' &&
          onConflictReload !== undefined ? (
            <button
              type="button"
              className="rouse-check__reload"
              onClick={onConflictReload}
            >
              Recargar ficha
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

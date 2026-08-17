import {
  useMemo,
  useState,
} from 'react'

import {
  CharacterEmbraceApiError,
  createCharacterEmbraceGateway,
} from '../infrastructure/character-embrace.api.ts'

import type {
  CharacterEmbraceGateway,
} from '../infrastructure/character-embrace.api.ts'

interface PersistedCharacterEmbraceProps {
  readonly characterId: string
  readonly revision: number
  readonly gateway?: CharacterEmbraceGateway
  readonly onEmbraced: () => void
}

type EmbraceUiState =
  | 'ready'
  | 'saving'
  | 'unauthorized'
  | 'permission'
  | 'not-found'
  | 'conflict'
  | 'already-embraced'
  | 'archived'
  | 'creation-mode'
  | 'human-profile'
  | 'error'

function stateForError(
  error: unknown,
): EmbraceUiState {
  if (
    !(error instanceof CharacterEmbraceApiError)
  ) {
    return 'error'
  }

  switch (error.code) {
    case 'AUTHENTICATION_REQUIRED':
      return 'unauthorized'

    case 'CHARACTER_EMBRACE_PERMISSION_DENIED':
      return 'permission'

    case 'CHARACTER_NOT_FOUND':
      return 'not-found'

    case 'CHARACTER_REVISION_CONFLICT':
      return 'conflict'

    case 'CHARACTER_ALREADY_EMBRACED':
      return 'already-embraced'

    case 'CHARACTER_ARCHIVED':
      return 'archived'

    case 'CHARACTER_CREATION_MODE_INCOMPATIBLE':
      return 'creation-mode'

    case 'CHARACTER_HUMAN_PROFILE_INCOMPLETE':
      return 'human-profile'

    default:
      return 'error'
  }
}

function messageForState(
  state: EmbraceUiState,
): string | null {
  switch (state) {
    case 'ready':
      return null

    case 'saving':
      return 'Aplicando el Abrazo…'

    case 'unauthorized':
      return 'La sesión ha caducado. Vuelve a identificarte.'

    case 'permission':
      return 'No tienes permiso para decidir el Abrazo de este personaje.'

    case 'not-found':
      return 'El personaje ya no está disponible.'

    case 'conflict':
      return 'La ficha cambió en otra operación. Recárgala antes de intentar el Abrazo.'

    case 'already-embraced':
      return 'El personaje ya ha recibido el Abrazo.'

    case 'archived':
      return 'Un personaje archivado no puede recibir el Abrazo.'

    case 'creation-mode':
      return 'El Abrazo sólo está disponible para personajes procedentes de Sesión 0.'

    case 'human-profile':
      return 'El perfil humano todavía no cumple los requisitos que el backend exige para el Abrazo.'

    case 'error':
      return 'No se pudo completar el Abrazo.'
  }
}

export function PersistedCharacterEmbrace({
  characterId,
  revision,
  gateway,
  onEmbraced,
}: PersistedCharacterEmbraceProps) {
  const resolvedGateway =
    useMemo(
      () =>
        gateway ??
        createCharacterEmbraceGateway(),
      [gateway],
    )

  const [state, setState] =
    useState<EmbraceUiState>('ready')

  const [confirming, setConfirming] =
    useState(false)

  const busy =
    state === 'saving'

  const message =
    messageForState(state)

  async function embrace(): Promise<void> {
    if (busy) return

    setState('saving')

    try {
      await resolvedGateway.embrace(
        characterId,
        revision,
      )

      setConfirming(false)
      setState('ready')
      onEmbraced()
    } catch (error: unknown) {
      setState(
        stateForError(error),
      )
    }
  }

  return (
    <section
      className="sheet-section embrace-section"
      aria-labelledby="embrace-title"
      aria-busy={busy}
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Sesión 0
          </p>

          <h2 id="embrace-title">
            Abrazo
          </h2>
        </div>

        <span className="section-number">
          08
        </span>
      </div>

      <div className="embrace-section__content">
        <p>
          El Abrazo transforma este mismo personaje
          en vampiro y conserva su Humanidad actual.
          Las decisiones vampíricas que no estén
          resueltas permanecerán pendientes.
        </p>

        {message !== null ? (
          <p
            className="embrace-section__message"
            role={
              busy
                ? 'status'
                : 'alert'
            }
            aria-live={
              busy
                ? 'polite'
                : 'assertive'
            }
          >
            {message}
          </p>
        ) : null}

        {!confirming ? (
          <button
            type="button"
            className="embrace-section__primary"
            disabled={busy}
            onClick={() => {
              setState('ready')
              setConfirming(true)
            }}
          >
            Iniciar Abrazo
          </button>
        ) : (
          <div
            className="embrace-section__confirmation"
            role="alert"
          >
            <strong>
              Confirmar transición irreversible
            </strong>

            <p>
              El personaje pasará de humano a
              vampiro. Esta operación no puede
              revertirse desde SPEC-057.
            </p>

            <div className="embrace-section__actions">
              <button
                type="button"
                className="embrace-section__primary"
                disabled={busy}
                onClick={() => {
                  void embrace()
                }}
              >
                {busy
                  ? 'Aplicando Abrazo…'
                  : 'Confirmar Abrazo'}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setConfirming(false)
                  setState('ready')
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

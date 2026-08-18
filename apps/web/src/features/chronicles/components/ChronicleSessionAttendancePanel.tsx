import {
  useEffect,
  useState,
} from 'react'

import {
  ChronicleApiError,
  createChronicleGateway,
} from '../infrastructure/chronicle.api.ts'

import type {
  ChronicleCharacterApiSummary,
  ChronicleSessionApiSnapshot,
  ChronicleSessionAttendanceApiSnapshot,
} from '../types/chronicle-api.types.ts'

import {
  ViewStateStatus,
} from '../../../components/ui/ViewStateStatus'

import './chronicle-session-attendance-panel.css'

const gateway =
  createChronicleGateway()

interface ChronicleSessionAttendancePanelProps {
  readonly chronicleId: string
  readonly session:
    ChronicleSessionApiSnapshot
  readonly associatedCharacters:
    readonly ChronicleCharacterApiSummary[]
}

function attendanceErrorMessage(
  error: unknown,
): string {
  if (error instanceof ChronicleApiError) {
    switch (error.code) {
      case 'CHRONICLE_SESSION_ATTENDANCE_PERMISSION_DENIED':
        return 'Sólo un Narrador activo de la crónica puede consultar o gestionar la asistencia.'

      case 'CHRONICLE_SESSION_ATTENDANCE_SESSION_NOT_FOUND':
        return 'La Sesión ya no está disponible.'

      case 'CHRONICLE_SESSION_ATTENDANCE_SESSION_NOT_EDITABLE':
        return 'La asistencia de una Sesión archivada es de solo lectura.'

      case 'CHRONICLE_SESSION_ATTENDANCE_CHARACTER_NOT_ELIGIBLE':
        return 'Ese personaje ya no es elegible: debe estar activo y asociado a esta crónica.'

      case 'INVALID_CHRONICLE_SESSION_ATTENDANCE_REQUEST':
      case 'INVALID_PAGINATION_QUERY':
        return 'No se pudo procesar el registro de asistencia.'

      case 'AUTHENTICATION_REQUIRED':
        return 'Necesitas una sesión autenticada válida.'
    }
  }

  return 'No se pudo completar la operación de asistencia.'
}

function characterName(
  character:
    ChronicleCharacterApiSummary,
): string {
  const name = character.name.trim()

  return name.length > 0
    ? name
    : 'Personaje sin nombre'
}

export function ChronicleSessionAttendancePanel({
  chronicleId,
  session,
  associatedCharacters,
}: ChronicleSessionAttendancePanelProps) {
  const [
    attendances,
    setAttendances,
  ] = useState<
    readonly ChronicleSessionAttendanceApiSnapshot[]
  >([])

  const [loading, setLoading] =
    useState(true)

  const [
    operationError,
    setOperationError,
  ] = useState<string | null>(null)

  const [
    operationCharacterId,
    setOperationCharacterId,
  ] = useState<string | null>(null)

  async function loadAttendances() {
    setLoading(true)
    setOperationError(null)

    try {
      setAttendances(
        await gateway.sessionAttendances(
          chronicleId,
          session.id,
        ),
      )
    } catch (error: unknown) {
      setOperationError(
        attendanceErrorMessage(error),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAttendances()
  }, [
    chronicleId,
    session.id,
  ])

  const attendingIds =
    new Set(
      attendances.map(
        (attendance) =>
          attendance.characterId,
      ),
    )

  const editable =
    session.status !== 'archived'

  const visibleCharacters =
    associatedCharacters.filter(
      (character) =>
        editable
          ? (
              character.status === 'active' ||
              attendingIds.has(
                character.characterId,
              )
            )
          : attendingIds.has(
              character.characterId,
            ),
    )

  const unresolvedAttendances =
    attendances.filter(
      (attendance) =>
        !associatedCharacters.some(
          (character) =>
            character.characterId ===
            attendance.characterId,
        ),
    )

  async function setAttendance(
    character:
      ChronicleCharacterApiSummary,
    attending: boolean,
  ) {
    if (
      !editable ||
      character.status !== 'active'
    ) {
      return
    }

    setOperationCharacterId(
      character.characterId,
    )
    setOperationError(null)

    try {
      if (attending) {
        await gateway.addSessionAttendance(
          chronicleId,
          session.id,
          {
            characterId:
              character.characterId,
          },
        )
      } else {
        await gateway.removeSessionAttendance(
          chronicleId,
          session.id,
          character.characterId,
        )
      }

      setAttendances(
        await gateway.sessionAttendances(
          chronicleId,
          session.id,
        ),
      )
    } catch (error: unknown) {
      setOperationError(
        attendanceErrorMessage(error),
      )
    } finally {
      setOperationCharacterId(null)
    }
  }

  const empty =
    visibleCharacters.length === 0 &&
    unresolvedAttendances.length === 0

  return (
    <section
      className="chronicle-session-attendance"
      aria-labelledby={`chronicle-session-attendance-${session.id}`}
    >
      <div className="chronicle-session-attendance__heading">
        <div>
          <span>Registro de Sesión</span>
          <h4
            id={`chronicle-session-attendance-${session.id}`}
          >
            Asistencia
          </h4>
        </div>

        <span className="chronicle-session-attendance__count">
          {attendances.length}
        </span>
      </div>

      <p className="chronicle-session-attendance__help">
        {editable
          ? 'Marca los personajes activos que participan en esta Sesión.'
          : 'Esta Sesión está archivada: la asistencia se conserva en modo de solo lectura.'}
        {' '}
        Registrar asistencia no concede Experiencia automáticamente.
      </p>

      {operationError !== null ? (
        <p
          className="chronicle-session-attendance__error"
          role="alert"
          aria-live="assertive"
        >
          {operationError}
        </p>
      ) : null}

      {loading ? (
        <ViewStateStatus
          state="loading"
          className="chronicle-session-attendance__message"
        >
          Cargando asistencia…
        </ViewStateStatus>
      ) : empty ? (
        <p className="chronicle-session-attendance__empty">
          {editable
            ? 'No hay personajes activos asociados disponibles.'
            : 'No hay asistencia registrada para esta Sesión.'}
        </p>
      ) : (
        <ul className="chronicle-session-attendance__list">
          {visibleCharacters.map(
            (character) => {
              const attending =
                attendingIds.has(
                  character.characterId,
                )
              const working =
                operationCharacterId ===
                character.characterId
              const canToggle =
                editable &&
                character.status ===
                  'active'

              return (
                <li
                  key={character.characterId}
                  className="chronicle-session-attendance__item"
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={attending}
                      disabled={
                        !canToggle ||
                        working
                      }
                      onChange={(event) =>
                        void setAttendance(
                          character,
                          event.target.checked,
                        )
                      }
                    />

                    <span className="chronicle-session-attendance__identity">
                      <strong>
                        {characterName(
                          character,
                        )}
                      </strong>

                      <small>
                        {attending
                          ? 'Presente'
                          : 'Sin marcar'}
                        {character.status !==
                        'active'
                          ? ' · Personaje no activo'
                          : ''}
                      </small>
                    </span>
                  </label>
                </li>
              )
            },
          )}

          {unresolvedAttendances.map(
            (attendance) => (
              <li
                key={attendance.id}
                className="chronicle-session-attendance__item chronicle-session-attendance__item--historical"
              >
                <div className="chronicle-session-attendance__historical">
                  <strong>
                    Personaje ya no asociado
                  </strong>
                  <small>
                    Presente · {attendance.characterId}
                  </small>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  )
}

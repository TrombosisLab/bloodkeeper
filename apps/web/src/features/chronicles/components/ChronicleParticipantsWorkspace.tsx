import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { chronicleParticipantNotesApi } from '../infrastructure/chronicle-participant-notes.api'
import { createCharacterExperienceGateway } from '../../character-sheet/infrastructure/character-experience.api.ts'
import { createChronicleGateway } from '../infrastructure/chronicle.api.ts'
import { createChronicleStoryGateway } from '../infrastructure/chronicle-story.api.ts'
import type {
  ChronicleCharacterApiSummary,
  ChronicleParticipantApiSnapshot,
  ChronicleSessionAttendanceApiSnapshot,
  ChronicleSessionApiSnapshot,
} from '../types/chronicle-api.types.ts'
import type { ChronicleStoryApiSnapshot } from '../types/chronicle-story-api.types.ts'

import './chronicle-participants-workspace.css'

const gateway = createChronicleGateway()
const storyGateway = createChronicleStoryGateway()
const experienceGateway = createCharacterExperienceGateway()

interface Props {
  readonly participants: readonly ChronicleParticipantApiSnapshot[]
  readonly characters: readonly ChronicleCharacterApiSummary[]
  readonly canManage: boolean
  readonly authenticatedUserId: string
  readonly retiringId: string | null
  readonly onRetire: (participant: ChronicleParticipantApiSnapshot) => void
  readonly onOpenAdmin: () => void
  readonly participantAdmin: ReactNode
  readonly characterAssociation: ReactNode
}

interface ChronicleContext {
  readonly sessions: readonly ChronicleSessionApiSnapshot[]
  readonly stories: readonly ChronicleStoryApiSnapshot[]
  readonly attendances: readonly ChronicleSessionAttendanceApiSnapshot[]
}

const roles = {
  narrator: 'Narrador',
  player: 'Jugador',
} as const

const states = {
  active: 'Activo',
  retired: 'Retirado',
} as const

function dateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function ChronicleParticipantsWorkspace({
  participants,
  characters,
  canManage,
  authenticatedUserId,
  retiringId,
  onRetire,
  onOpenAdmin,
  participantAdmin,
  characterAssociation,
}: Props) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<'all' | 'narrator' | 'player'>('all')
  const [state, setState] = useState<'all' | 'active' | 'retired'>('active')
  const [selectedId, setSelectedId] = useState<string | null>(participants[0]?.id ?? null)
  const [context, setContext] = useState<ChronicleContext | null>(null)
  const [contextError, setContextError] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesRevision, setNotesRevision] = useState<number | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attended' | 'absent'>('all')
  const [experience, setExperience] = useState<{ readonly total: number; readonly available: number } | null>(null)
  const [experienceError, setExperienceError] = useState(false)

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-ES')
    return participants.filter((item) => (
      (role === 'all' || item.role === role) &&
      (state === 'all' || item.status === state) &&
      [item.displayName, item.username].some((value) => value.toLocaleLowerCase('es-ES').includes(normalized))
    ))
  }, [participants, query, role, state])

  useEffect(() => {
    if (selectedId !== null && !visible.some((item) => item.id === selectedId)) {
      setSelectedId(visible[0]?.id ?? null)
    }
  }, [visible, selectedId])

  const selected = visible.find((item) => item.id === selectedId) ?? null
  const character = selected === null
    ? null
    : characters.find((item) => item.ownerId === selected.userId) ?? null

  useEffect(() => {
    if (character === null) {
      setExperience(null)
      setExperienceError(false)
      return
    }
    let live = true
    setExperience(null)
    setExperienceError(false)
    void experienceGateway.load(character.characterId, { limit: 1, offset: 0 })
      .then((ledger) => {
        if (live) setExperience({ total: ledger.total, available: ledger.available })
      })
      .catch(() => {
        if (live) setExperienceError(true)
      })
    return () => {
      live = false
    }
  }, [character?.characterId])

  useEffect(() => {
    if (selected === null || !canManage) {
      setNotes('')
      setNotesRevision(null)
      setNotesError(null)
      return
    }

    let live = true
    setNotes('')
    setNotesRevision(null)
    setNotesError(null)
    void chronicleParticipantNotesApi.load(selected.chronicleId, selected.id)
      .then((value) => {
        if (live) {
          setNotes(value.narratorNotes ?? '')
          setNotesRevision(value.revision)
        }
      })
      .catch(() => {
        if (live) setNotesError('No se pudieron cargar las notas privadas.')
      })
    return () => {
      live = false
    }
  }, [selected?.chronicleId, selected?.id, canManage])

  useEffect(() => {
    if (selected === null) {
      setContext(null)
      return
    }
    let live = true
    setContextError(false)
    void Promise.all([
      gateway.sessions(selected.chronicleId, { limit: 50, offset: 0 }),
      canManage
        ? storyGateway.list(selected.chronicleId)
        : Promise.resolve({ items: [], nextOffset: null }),
    ])
      .then(async ([sessionPage, storyPage]) => {
        const attendancePages = character === null || !canManage
          ? []
          : await Promise.all(sessionPage.items.map((session) => gateway.sessionAttendances(selected.chronicleId, session.id)))
        if (live) setContext({ sessions: sessionPage.items, stories: storyPage.items, attendances: attendancePages.flat() })
      })
      .catch(() => {
        if (live) setContextError(true)
      })
    return () => {
      live = false
    }
  }, [selected?.chronicleId, selected?.id, character?.characterId, canManage])

  const sessions = context?.sessions ?? []
  const stories = context?.stories ?? []
  const attendances = context?.attendances ?? []
  const involvedStories = character === null
    ? []
    : stories.filter((story) => story.characters.some((item) => item.id === character.characterId))
  const attendedSessionIds = new Set(attendances.filter((item) => item.characterId === character?.characterId).map((item) => item.sessionId))
  const attendedSessions = attendedSessionIds.size
  const visibleSessions = sessions.filter((session) => {
    if (attendanceFilter === 'all') return true
    if (session.status === 'preparation' || character === null) return false
    const attended = attendedSessionIds.has(session.id)
    return attendanceFilter === 'attended' ? attended : !attended
  })

  function openParticipantAdmin() {
    onOpenAdmin()
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const form = document.querySelector('form.chronicle-detail__participant-form') as HTMLFormElement | null
        form?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const select = form?.querySelector('select') as HTMLSelectElement | null
        select?.focus({ preventScroll: true })
      })
    })
  }

  function openCharacterAssociation() {
    const trigger = document.querySelector('button[aria-controls="chronicle-character-association-panel"]') as HTMLButtonElement | null
    trigger?.click()
    document.getElementById('chronicle-characters-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  function triggerDisassociation() {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent?.trim() === 'Desasociar') as HTMLButtonElement | undefined
    button?.click()
  }

  async function saveNotes() {
    if (selected === null || notesRevision === null || savingNotes) return
    setSavingNotes(true)
    setNotesError(null)
    try {
      const value = await chronicleParticipantNotesApi.update(
        selected.chronicleId,
        selected.id,
        { narratorNotes: notes.trim() || null, expectedRevision: notesRevision },
      )
      setNotes(value.narratorNotes ?? '')
      setNotesRevision(value.revision)
    } catch {
      setNotesError('No se pudieron guardar las notas privadas.')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <section className="chronicle-participants-workspace" aria-labelledby="chronicle-participants-workspace-title">
      <aside className="chronicle-participants-workspace__browser">
        <section className="participant-card participant-card--identity">
          <div className="participant-card__heading">
            <div>
              <span className="participant-eyebrow">Cr&oacute;nica activa</span>
              <h2 id="chronicle-participants-workspace-title">Participantes</h2>
            </div>
            <strong className="participant-count">{visible.length}</strong>
          </div>
        </section>

        <section className="participant-card participant-card--directory">
          <label className="participant-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar participante" aria-label="Buscar participantes" />
          </label>
          <div className="participant-filters">
            <select value={role} onChange={(event) => setRole(event.target.value as 'all' | 'narrator' | 'player')} aria-label="Filtrar por rol">
              <option value="all">Todos los roles</option>
              <option value="narrator">Narradores</option>
              <option value="player">Jugadores</option>
            </select>
            <select value={state} onChange={(event) => setState(event.target.value as 'all' | 'active' | 'retired')} aria-label="Filtrar por estado">
              <option value="active">Activos</option>
              <option value="all">Todos los estados</option>
              <option value="retired">Retirados</option>
            </select>
          </div>
          {canManage ? <button className="participant-primary-button" type="button" onClick={openParticipantAdmin}>＋ Incorporar participante</button> : null}
          {participantAdmin ? (
        <div className="participant-admin-inline">{participantAdmin}</div>
      ) : null}

      <ul className="participant-list">
            {visible.map((item) => (
              <li key={item.id} className={item.id === selectedId ? 'is-selected' : ''}>
                <button type="button" onClick={() => setSelectedId(item.id)}>
                  <span className="participant-list__topline"><strong>{item.displayName}</strong><em className={'participant-role participant-role--' + item.role}>{roles[item.role]}</em></span>
                  <small>{item.username}</small>
                  <span className="participant-list__state"><i />{states[item.status]}{character?.ownerId === item.userId ? ' · ' + character.name : ''}</span>
                </button>
              </li>
            ))}
            {visible.length === 0 ? <li className="participant-empty">No hay participantes con estos filtros.</li> : null}
          </ul>
        </section>
      </aside>

      <main className="chronicle-participants-workspace__detail">
        {selected === null ? (
          <section className="participant-card participant-empty">
            <h3>Selecciona un participante</h3>
            <p>Su identidad, personaje y situación aparecerán aquí.</p>
          </section>
        ) : (
          <>
            <section className="participant-card participant-card--profile">
              <header className="participant-profile-heading">
                <div>
                  <span className="participant-eyebrow">Participante</span>
                  <h2>{selected.displayName}</h2>
                  <div className="participant-profile-meta"><em className={'participant-role participant-role--' + selected.role}>{roles[selected.role]}</em><span className="participant-active-dot" />{states[selected.status]}</div>
                </div>
                <div className="participant-header-actions">
                  {canManage ? <button className="participant-secondary-button" type="button" disabled={notesRevision === null || savingNotes} onClick={() => void saveNotes()}>Guardar cambios</button> : null}
                  {canManage && selected.status === 'active' ? <button className="participant-outline-danger" type="button" disabled={retiringId === selected.id} onClick={() => onRetire(selected)}>Retirar</button> : null}
                </div>
              </header>
            </section>

            <div className="participant-two-column">
              <section className="participant-card participant-card--identity-data">
                <h3>Identidad y contacto</h3>
                <dl className="participant-data-list">
                  <div><dt><span aria-hidden="true">♙</span> Usuario</dt><dd>{selected.username}</dd></div>
                  <div><dt><span aria-hidden="true">◉</span> Rol</dt><dd>{roles[selected.role]}</dd></div>
                  <div><dt><span aria-hidden="true">◷</span> Se incorporó</dt><dd>{dateLabel(selected.createdAt)}</dd></div>
                </dl>
              </section>

              <section className="participant-card participant-card--character">
                <div className="participant-card__heading"><h3>Personaje asociado</h3>{selected.userId === authenticatedUserId ? <button className="participant-inline-button" type="button" onClick={openCharacterAssociation}>{character ? 'Cambiar asociación' : 'Asociar personaje'}</button> : null}</div>
                {character ? (
                  <div className="associated-character">
                    <span className="character-seal" aria-hidden="true">♜</span>
                    <div><strong>{character.name || 'Personaje sin nombre'}</strong><span>{character.concept ?? 'Sin concepto definido'}</span><small>{character.status}</small></div>
                  </div>
                ) : <p>Sin personaje asociado a esta crónica.</p>}
                {selected.userId === authenticatedUserId ? characterAssociation : null}
              </section>
            </div>

            <section className="participant-card participant-card--participation">
              <h3>Participaci&oacute;n en la cr&oacute;nica</h3>
              <div className="participant-metric-grid">
                <div><span className="participant-metric-icon">◷</span><strong>{context === null ? '—' : sessions.length}</strong><small>Sesiones<br />totales</small></div>
                <div><span className="participant-metric-icon">◌</span><strong>{contextError ? '—' : character === null ? '—' : attendedSessions + '/' + sessions.length}</strong><small>Asistencia<br />registrada</small></div>
                <div><span className="participant-metric-icon">▣</span><strong>{context === null ? '—' : involvedStories.length}</strong><small>Historias<br />implicadas</small></div>
                <div><span className="participant-metric-icon">♢</span><strong>{character === null || experienceError ? '—' : experience?.total ?? '…'}</strong><small>PX<br />obtenidos</small></div>
              </div>
              <p className="participant-helper">La asistencia y la experiencia se consultan desde sus registros canónicos; no se duplican en el participante.</p>
            </section>

            <section className="participant-card participant-card--attendance">
              <div className="participant-card__heading"><h3>Historial de asistencia</h3><select aria-label="Filtrar sesiones" value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value as 'all' | 'attended' | 'absent')}><option value="all">Todas las sesiones</option><option value="attended">Asistió</option><option value="absent">Ausente</option></select></div>
              <div className="attendance-list">
                {visibleSessions.slice(0, 6).map((session) => { const attendanceLabel = session.status === 'preparation' ? 'Pendiente' : character === null ? 'Sin personaje' : attendedSessionIds.has(session.id) ? 'Asistió' : 'Ausente'; const attendanceClass = attendanceLabel === 'Asistió' ? 'attendance-status--present' : attendanceLabel === 'Ausente' ? 'attendance-status--absent' : 'attendance-status--pending'; return <div key={session.id}><strong>{session.title ?? 'Sesión sin título'}</strong><time>{dateLabel(session.realDate ?? session.createdAt)}</time><span className={'attendance-status ' + attendanceClass}>{attendanceLabel}</span></div> })}
                {sessions.length === 0 ? <p className="participant-empty">Todavía no hay sesiones registradas.</p> : visibleSessions.length === 0 ? <p className="participant-empty">No hay sesiones con este estado de asistencia.</p> : null}
              </div>
            </section>

            <section className="participant-card participant-card--stories">
              <div className="participant-card__heading"><h3>Historias implicadas</h3><span className="participant-count">{involvedStories.length}</span></div>
              <div className="involved-story-grid">
                {involvedStories.slice(0, 3).map((story) => <article key={story.id}><span className="story-seal" aria-hidden="true">▣</span><div><strong>{story.title}</strong><small>{story.status === 'active' ? 'En juego' : story.status}</small></div><b>{story.progress.percentage}%</b></article>)}
                {involvedStories.length === 0 ? <p className="participant-empty">No hay historias vinculadas a este personaje.</p> : null}
              </div>
            </section>
          </>
        )}
      </main>

      <aside className="chronicle-participants-workspace__side">
        {selected === null ? <section className="participant-card participant-empty">Selecciona una tarjeta para ver su contexto.</section> : (
          <>
            <section className="participant-card participant-card--permissions">
              <h3><span className="participant-side-icon">&#9671;</span> Acceso efectivo</h3>
              <p className="participant-helper">Los accesos se calculan desde el rol contextual; no son interruptores editables.</p>
              <div className="permission-row"><div><strong>Ver contenido compartido</strong><small>Resumen, historias publicadas y sesiones compartidas.</small></div><span className="permission-access permission-access--on">Permitido</span></div>
              <div className="permission-row"><div><strong>Gestionar su personaje</strong><small>Solo el propietario puede asociar y editar su personaje.</small></div><span className={'permission-access ' + (selected.userId === authenticatedUserId && character ? 'permission-access--on' : '')}>{selected.userId === authenticatedUserId && character ? 'Permitido' : 'No disponible'}</span></div>
              <div className="permission-row"><div><strong>Participar en sesiones</strong><small>Consulta de sesiones y espacio Jugar.</small></div><span className="permission-access permission-access--on">Permitido</span></div>
              <div className="permission-row"><div><strong>Administrar historias</strong><small>Creaci&oacute;n, contexto y cierre narrativo.</small></div><span className={'permission-access ' + (selected.role === 'narrator' ? 'permission-access--on' : '')}>{selected.role === 'narrator' ? 'Narrador' : 'Restringido'}</span></div>
              <div className="permission-row"><div><strong>Cronolog&iacute;a y recursos privados</strong><small>Incluye notas y relaciones reservadas.</small></div><span className={'permission-access ' + (selected.role === 'narrator' ? 'permission-access--on' : '')}>{selected.role === 'narrator' ? 'Narrador' : 'Restringido'}</span></div>
            </section>

            <section className="participant-card participant-card--character-status">
              <span className="participant-eyebrow">Estado del personaje</span>
              {character ? <div className="character-status-block"><span className="character-seal" aria-hidden="true">♜</span><div><h3>{character.name}</h3><span>{character.concept ?? 'Sin concepto'}</span></div></div> : <p>Sin asociación actual.</p>}
              <dl className="character-status-grid"><div><dt>Estado</dt><dd>{character?.status ?? '—'}</dd></div><div><dt>PX actual</dt><dd>{character === null || experienceError ? '—' : experience?.available ?? '…'}</dd></div></dl>
              {character ? <p className="participant-helper">La ficha completa se abre desde el apartado Personajes del propietario.</p> : null}
            </section>

            {canManage ? <section className="participant-card participant-card--private">
              <span className="participant-eyebrow participant-eyebrow--red">Solo Narrador</span>
              <h3>Notas del Narrador</h3>
              <textarea id="participant-notes" aria-label="Notas privadas del Narrador" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas privadas sobre este participante..." />
              <button className="participant-secondary-button participant-full-button" type="button" disabled={notesRevision === null || savingNotes} onClick={() => void saveNotes()}>{savingNotes ? 'Guardando...' : 'Guardar notas'}</button>
              {notesError ? <p className="participant-form-error" role="alert">{notesError}</p> : null}
            </section> : null}

            {canManage ? <section className="participant-card participant-card--actions">
              <span className="participant-eyebrow">Acciones</span>
              {character ? <button className="participant-secondary-button participant-full-button" type="button" onClick={triggerDisassociation}>⌘ <span>Desasociar personaje</span></button> : null}
              {selected.status === 'active' ? <button className="participant-action-danger" type="button" disabled={retiringId === selected.id} onClick={() => onRetire(selected)}>▣ <span>{retiringId === selected.id ? 'Retirando...' : 'Retirar participante'}</span></button> : null}
            </section> : null}
          </>
        )}
      </aside>
    </section>
  )
}

// Contratos heredados: Buscar participantes / Todos los roles / Todos los estados / selectedId / Personaje asociado / Permisos en la crónica.

import { V5VisualMark } from '../../v5-visuals/V5VisualMark'
import { useEffect, useState } from 'react'

import { createChronicleGateway } from '../infrastructure/chronicle.api.ts'
import {
  chronicleSessionParticipantNotesApi,
} from '../infrastructure/chronicle-session-participant-notes.api.ts'
import type {
  ChronicleSessionParticipantNotesSnapshot,
} from '../infrastructure/chronicle-session-participant-notes.api.ts'
import { createCharacterDraftGateway } from '../../character-creation/infrastructure/character-draft.api.ts'
import { loadPersistedCharacterSheetState } from '../../character-sheet/domain/persisted-character-sheet.loader'
import { createCharacterProfilePhaseGateway } from '../../character-sheet/infrastructure/character-profile-phase.api'
import { PersistedCharacterBlushOfLife } from '../../character-sheet/components/PersistedCharacterBlushOfLife'
import { PersistedCharacterFeeding } from '../../character-sheet/components/PersistedCharacterFeeding'
import { PersistedCharacterRouseCheck } from '../../character-sheet/components/PersistedCharacterRouseCheck'
import { DiceRollPanel } from '../../dice/components/DiceRollPanel'
import { DiceHistoryPanel } from '../../dice/components/DiceHistoryPanel'

import './chronicle-play-workspace.css'

interface Props {
  readonly chronicleId: string
  readonly characterId?: string
  readonly characterName?: string
  readonly onOpenCharacter?: (characterId: string) => void
}

const chronicleGateway = createChronicleGateway()
const characterGateway = createCharacterDraftGateway()
const profileGateway = createCharacterProfilePhaseGateway()
const emptyNotes: ChronicleSessionParticipantNotesSnapshot = {
  privateNotes: '',
  publicNotes: '',
  revision: 0,
  sharedNotes: [],
}

function value(model: any, ...paths: string[]): string {
  for (const path of paths) {
    const result = path.split('.').reduce((item, key) => item?.[key], model)
    if (
      result !== undefined &&
      result !== null &&
      String(result).trim() !== ''
    ) return String(result)
  }
  return '—'
}

function numberValue(model: any, ...paths: string[]): number {
  const result = value(model, ...paths)
  const parsed = Number(result)
  return Number.isFinite(parsed) ? parsed : 0
}

function trackValue(model: any, trackPaths: string[], capacityPaths: string[]): string {
  const raw = trackPaths
    .map((path) => path.split('.').reduce((item, key) => item?.[key], model))
    .find((item) => item !== undefined && item !== null)
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  if (raw && typeof raw === 'object') {
    const current = Number(raw.current ?? raw.value)
    if (Number.isFinite(current)) return String(current)
    const superficial = Number(raw.superficial ?? 0)
    const aggravated = Number(raw.aggravated ?? 0)
    if (Number.isFinite(superficial) && Number.isFinite(aggravated)) {
      const capacity = numberValue(model, ...capacityPaths)
      const available = Math.max(0, capacity - superficial - aggravated)
      return capacity > 0 ? `${available}/${capacity}` : String(available)
    }
  }
  return value(model, ...trackPaths)
}

export function ChroniclePlayWorkspace({
  chronicleId,
  characterId,
  characterName,
  onOpenCharacter,
}: Props) {
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [sessionsReload, setSessionsReload] = useState(0)
  const [session, setSession] = useState<any | null>(null)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [model, setModel] = useState<any | null>(null)
  const [reload, setReload] = useState(0)
  const [notes, setNotes] = useState<ChronicleSessionParticipantNotesSnapshot>(emptyNotes)
  const [privateNotes, setPrivateNotes] = useState('')
  const [publicNotes, setPublicNotes] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)
  const [savingNote, setSavingNote] = useState<'private' | 'public' | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [savedNote, setSavedNote] = useState<'private' | 'public' | null>(null)

  useEffect(() => {
    let active = true
    setSessionsLoading(true)
    setSessionsError(null)
    void chronicleGateway.sessions(chronicleId, { limit: 50, offset: 0 })
      .then((page: any) => {
        if (!active) return
        const items = page.items ?? []
        setSessions(items)
        setSession(items.find((item: any) => item.status === 'preparation') ?? items[0] ?? null)
      })
      .catch(() => {
        if (active) {
          setSessions([])
          setSession(null)
          setSessionsError('No se pudieron cargar las sesiones de la crónica.')
        }
      })
      .finally(() => { if (active) setSessionsLoading(false) })
    return () => { active = false }
  }, [chronicleId, sessionsReload])

  useEffect(() => {
    if (!characterId) {
      setModel(null)
      return
    }
    let active = true
    void loadPersistedCharacterSheetState(characterGateway, profileGateway, characterId)
      .then((result: any) => { if (active) setModel(result.model) })
      .catch(() => { if (active) setModel(null) })
    return () => { active = false }
  }, [characterId, reload])

  useEffect(() => {
    if (!session?.id) {
      setNotes(emptyNotes)
      setPrivateNotes('')
      setPublicNotes('')
      return
    }
    let active = true
    setNotesLoading(true)
    setNotesError(null)
    setSavedNote(null)
    void chronicleSessionParticipantNotesApi.load(chronicleId, session.id)
      .then((snapshot) => {
        if (!active) return
        setNotes(snapshot)
        setPrivateNotes(snapshot.privateNotes)
        setPublicNotes(snapshot.publicNotes)
      })
      .catch(() => {
        if (active) setNotesError('No se pudieron cargar las notas de la sesión.')
      })
      .finally(() => { if (active) setNotesLoading(false) })
    return () => { active = false }
  }, [chronicleId, session?.id])

  async function saveNote(kind: 'private' | 'public') {
    if (!session?.id) return
    setSavingNote(kind)
    setSavedNote(null)
    setNotesError(null)
    try {
      const snapshot = await chronicleSessionParticipantNotesApi.update(
        chronicleId,
        session.id,
        {
          expectedRevision: notes.revision,
          ...(kind === 'private'
            ? { privateNotes: privateNotes.trim() || null }
            : { publicNotes: publicNotes.trim() || null }),
        },
      )
      setNotes(snapshot)
      setPrivateNotes(snapshot.privateNotes)
      setPublicNotes(snapshot.publicNotes)
      setSavedNote(kind)
    } catch (error) {
      if (error instanceof Error && error.message === 'CHRONICLE_SESSION_NOTE_REVISION_CONFLICT') {
        try {
          const current = await chronicleSessionParticipantNotesApi.load(chronicleId, session.id)
          setNotes(current)
          setPrivateNotes(current.privateNotes)
          setPublicNotes(current.publicNotes)
          setNotesError('Las notas cambiaron en otra ventana. Se ha cargado la versión más reciente.')
        } catch {
          setNotesError('No se pudieron actualizar las notas.')
        }
      } else {
        setNotesError('No se pudieron actualizar las notas.')
      }
    } finally {
      setSavingNote(null)
    }
  }

  const characterRevision = model?.revision ?? 0
  const hunger = numberValue(model, 'state.hunger', 'state.blood.hunger', 'blood.hunger', 'hunger')
  const actualCharacterName = characterName ?? value(model, 'identity.name', 'name')
  const sessionTitle = session
    ? `Sesión ${session.sessionNumber ?? ''}${session.sessionNumber ? ' · ' : ''}${session.title}`
    : 'Sin sesión preparada'
  const sessionStatus = session?.status === 'preparation'
    ? 'Preparación'
    : session?.status === 'completed'
      ? 'Completada'
      : session
        ? 'Archivada'
        : 'Sin sesión'
  const visibleSessions = showAllSessions ? sessions : sessions.slice(0, 7)

  return <section className="chronicle-play-workspace" aria-labelledby="chronicle-play-title">
    <aside className="chronicle-play-workspace__rail">
      <header><small>CRÓNICA ACTIVA</small><h2>Jugar</h2><span>{sessionStatus}</span></header>
      <article className="chronicle-play-workspace__session-card">
        <small>SESIÓN ACTIVA</small><strong>{sessionTitle}</strong>
        <b>{session?.realDate ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.realDate)) : 'Sin fecha real'}</b>
        <span className="chronicle-play-workspace__selection-state">Sesión seleccionada</span>
      </article>
      <h3>Sesiones</h3>
      <ul className="chronicle-play-workspace__session-list">{visibleSessions.map((item: any) => <li key={item.id}><button type="button" className={item.id === session?.id ? 'is-active' : ''} onClick={() => setSession(item)}><strong>{item.title}</strong><small>{item.status === 'preparation' ? 'Preparación' : item.status === 'completed' ? 'Completada' : 'Archivada'}</small></button></li>)}</ul>
      {sessionsLoading ? <p role="status">Cargando sesiones…</p> : null}
      {sessionsError ? <div className="chronicle-play-workspace__sessions-error" role="alert"><span>{sessionsError}</span><button type="button" aria-label="Reintentar carga de sesiones" onClick={() => setSessionsReload((value) => value + 1)}>Reintentar</button></div> : null}
      {sessions.length > 7 ? <button type="button" className="chronicle-play-workspace__rail-action" onClick={() => setShowAllSessions((current) => !current)}>{showAllSessions ? 'Mostrar sesiones recientes' : `Ver todas las sesiones (${sessions.length})`}</button> : null}
    </aside>

    <main className="chronicle-play-workspace__main">
      <header className="chronicle-play-workspace__hero"><small>{session ? sessionStatus.toUpperCase() : 'SIN SESIÓN'}</small><h1 id="chronicle-play-title">{sessionTitle}</h1><p>{session?.summary ?? 'La sesión mostrará aquí su contexto público cuando esté preparada.'}</p></header>
      <section className="chronicle-play-workspace__scene"><small>ESCENA ACTUAL</small><h2>{session?.summary ? 'Objetivo de la sesión' : 'Esperando al narrador'}</h2><p>{session?.summary ?? 'Consulta esta zona durante la partida para seguir la escena pública.'}</p></section>
      <section className="chronicle-play-workspace__dice"><DiceRollPanel mode="manual" chronicleId={chronicleId} sessionId={session?.id} /></section>
      <section className="chronicle-play-workspace__vampire" aria-labelledby="chronicle-play-vampire-title">
        <header><small>ESTADO VAMPÍRICO</small><h2 id="chronicle-play-vampire-title">Recursos de Sangre</h2></header>
        {model && characterId ? <div className="chronicle-play-workspace__vampire-grid">
          <article><h3>Rubor de la vida</h3><p>Hambre actual: {hunger}</p><PersistedCharacterBlushOfLife characterId={characterId} revision={characterRevision} hunger={hunger} result={null} onApplied={() => setReload((item) => item + 1)} onConflictReload={() => setReload((item) => item + 1)} /></article>
          <article><h3>Control de enardecimiento</h3><p>Comprueba si aumenta tu Hambre.</p><PersistedCharacterRouseCheck characterId={characterId} revision={characterRevision} hunger={hunger} onApplied={() => setReload((item) => item + 1)} onConflictReload={() => setReload((item) => item + 1)} /></article>
          <article><h3>Alimentación</h3><p>Registra presa, resonancia y Hambre saciada.</p><PersistedCharacterFeeding characterId={characterId} revision={characterRevision} hunger={hunger} onApplied={() => setReload((item) => item + 1)} /></article>
        </div> : <p className="chronicle-play-workspace__empty">Asocia un personaje activo para usar Rubor, Enardecimiento y Alimentación.</p>}
      </section>

      <section className="chronicle-play-workspace__notes" aria-label="Notas de la sesión">
        <article>
          <header><h2>Notas privadas</h2><small>Solo tú</small></header>
          <textarea value={privateNotes} disabled={notesLoading || !session} onChange={(event) => { setPrivateNotes(event.target.value); setSavedNote(null) }} placeholder="Escribe tus notas privadas..." />
          <button type="button" disabled={notesLoading || savingNote !== null || !session} onClick={() => void saveNote('private')}>{savingNote === 'private' ? 'Guardando…' : 'Guardar nota privada'}</button>
          {savedNote === 'private' ? <small role="status">Nota privada guardada en el servidor</small> : null}
        </article>
        <article>
          <header><h2>Notas públicas</h2><small>Participantes de la crónica</small></header>
          <textarea value={publicNotes} disabled={notesLoading || !session} onChange={(event) => { setPublicNotes(event.target.value); setSavedNote(null) }} placeholder="Escribe una nota para compartir..." />
          <button type="button" disabled={notesLoading || savingNote !== null || !session} onClick={() => void saveNote('public')}>{savingNote === 'public' ? 'Guardando…' : 'Guardar nota pública'}</button>
          {savedNote === 'public' ? <small role="status">Nota pública guardada y compartida</small> : null}
          {notes.sharedNotes.length ? <div className="chronicle-play-workspace__shared-notes"><strong>Notas compartidas</strong><ul>{notes.sharedNotes.map((note) => <li key={note.authorUserId}><span>{note.authorName}</span><p>{note.content}</p></li>)}</ul></div> : null}
        </article>
        {notesError ? <p className="chronicle-play-workspace__notes-error" role="alert">{notesError}</p> : null}
      </section>
      <DiceHistoryPanel chronicleId={chronicleId} sessionId={session?.id} />
    </main>

    <aside className="chronicle-play-workspace__character">
      <header><small>MI PERSONAJE</small><h2>{actualCharacterName}</h2>{characterId && onOpenCharacter ? <button type="button" onClick={() => onOpenCharacter(characterId)}>Abrir ficha completa</button> : null}</header>
      <dl><div><dt>Hambre</dt><dd>{model ? hunger : '—'}</dd></div><div><dt>Salud</dt><dd>{trackValue(model, ['damage.health', 'state.damage.health', 'health'], ['damage.healthCapacity', 'state.damage.healthCapacity', 'healthCapacity'])}</dd></div><div><dt>Fuerza de voluntad</dt><dd>{trackValue(model, ['damage.willpower', 'state.damage.willpower', 'willpower'], ['damage.willpowerCapacity', 'state.damage.willpowerCapacity', 'willpowerCapacity'])}</dd></div><div><dt>Humanidad</dt><dd>{value(model, 'humanity.value', 'state.humanity.value', 'humanity')}</dd></div></dl>
      <article><h3>Información del personaje</h3><div className="chronicle-play__clan-identity"><V5VisualMark kind="clan-symbol" value={value(model, 'identity.clan', 'clan')} decorative /><p>Clan: {value(model, 'identity.clan', 'clan')}</p></div><p>Concepto: {value(model, 'identity.concept', 'concept')}</p><p>Disciplinas y convicciones disponibles desde la ficha canónica.</p></article>
    </aside>
  </section>
}

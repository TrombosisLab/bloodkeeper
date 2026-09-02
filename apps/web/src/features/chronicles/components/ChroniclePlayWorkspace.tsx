import { useEffect, useMemo, useState } from 'react'

import { attributeDefinitions } from '../../character-creation/data/attribute-definitions'
import { skillDefinitions } from '../../character-creation/data/skill-definitions'
import { createCharacterDraftGateway } from '../../character-creation/infrastructure/character-draft.api.ts'
import { PersistedCharacterFeeding } from '../../character-sheet/components/PersistedCharacterFeeding'
import { PersistedCharacterRouseCheck } from '../../character-sheet/components/PersistedCharacterRouseCheck'
import { loadPersistedCharacterSheetState } from '../../character-sheet/domain/persisted-character-sheet.loader'
import { createCharacterProfilePhaseGateway } from '../../character-sheet/infrastructure/character-profile-phase.api'
import { DiceHistoryPanel } from '../../dice/components/DiceHistoryPanel'
import { DiceRollPanel } from '../../dice/components/DiceRollPanel'
import { V5VisualMark } from '../../v5-visuals/V5VisualMark'
import { createChronicleGateway } from '../infrastructure/chronicle.api.ts'
import { chronicleSessionParticipantNotesApi } from '../infrastructure/chronicle-session-participant-notes.api.ts'
import type { ChronicleSessionParticipantNotesSnapshot } from '../infrastructure/chronicle-session-participant-notes.api.ts'
import { sessionWorkspaceApi } from '../infrastructure/chronicle-session-workspace.api'
import type { SessionWorkspaceSnapshot } from '../infrastructure/chronicle-session-workspace.api'
import { createChronicleStoryGateway } from '../infrastructure/chronicle-story.api'
import type { ChronicleSharedStoryApiSnapshot } from '../types/chronicle-story-api.types'
import type { ChronicleSessionContextApiSnapshot } from '../types/chronicle-api.types'

import './chronicle-play-workspace.css'

interface Props {
  readonly chronicleId: string
  readonly characterId?: string
  readonly characterName?: string
  readonly onOpenCharacter?: (characterId: string) => void
}

const chronicleGateway = createChronicleGateway()
const storyGateway = createChronicleStoryGateway()
const characterGateway = createCharacterDraftGateway()
const profileGateway = createCharacterProfilePhaseGateway()
const emptyNotes: ChronicleSessionParticipantNotesSnapshot = {
  privateNotes: '',
  publicNotes: '',
  revision: 0,
  sharedNotes: [],
}
const emptyContext: ChronicleSessionContextApiSnapshot = {
  sessionId: '',
  events: [],
  npcs: [],
  locations: [],
  resources: [],
}

function nested(model: any, path: string): unknown {
  return path.split('.').reduce((item, key) => item?.[key], model)
}

function value(model: any, ...paths: string[]): string {
  for (const path of paths) {
    const result = nested(model, path)
    if (result !== undefined && result !== null && String(result).trim() !== '') return String(result)
  }
  return '—'
}

function numberValue(model: any, ...paths: string[]): number {
  const parsed = Number(value(model, ...paths))
  return Number.isFinite(parsed) ? parsed : 0
}

function trackValue(model: any, trackPaths: string[], capacityPaths: string[]): string {
  const raw = trackPaths.map((path) => nested(model, path)).find((item) => item !== undefined && item !== null)
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  if (raw && typeof raw === 'object') {
    const item = raw as Record<string, unknown>
    const current = Number(item.current ?? item.value)
    if (Number.isFinite(current)) return String(current)
    const superficial = Number(item.superficial ?? 0)
    const aggravated = Number(item.aggravated ?? 0)
    if (Number.isFinite(superficial) && Number.isFinite(aggravated)) {
      const capacity = numberValue(model, ...capacityPaths)
      const available = Math.max(0, capacity - superficial - aggravated)
      return capacity > 0 ? `${available}/${capacity}` : String(available)
    }
  }
  return value(model, ...trackPaths)
}

function trackParts(display: string, fallbackMaximum: number): { current: number; maximum: number } {
  const [currentText, maximumText] = display.split('/')
  const current = Number(currentText)
  const maximum = Number(maximumText ?? fallbackMaximum)
  return {
    current: Number.isFinite(current) ? Math.max(0, current) : 0,
    maximum: Number.isFinite(maximum) && maximum > 0 ? maximum : fallbackMaximum,
  }
}

function Track({ label, display, fallbackMaximum = 5 }: { readonly label: string; readonly display: string; readonly fallbackMaximum?: number }) {
  const track = trackParts(display, fallbackMaximum)
  return <div className="chronicle-play-character__track"><span><small>{label}</small><strong>{display}</strong></span><i aria-hidden="true">{Array.from({ length: track.maximum }, (_, index) => <b key={index} className={index < track.current ? 'is-filled' : ''} />)}</i></div>
}

function disciplineNames(model: any): readonly string[] {
  const source = model?.disciplines?.selections ?? model?.disciplines?.entries ?? model?.disciplines ?? []
  if (Array.isArray(source)) {
    return source.map((item) => typeof item === 'string' ? item : String(item?.label ?? item?.name ?? item?.disciplineKey ?? item?.key ?? '')).filter(Boolean).slice(0, 3)
  }
  if (source && typeof source === 'object') return Object.keys(source).slice(0, 3)
  return []
}

function sessionTitle(session: any | null): string {
  if (!session) return 'Sin sesión preparada'
  const prefix = session.sessionNumber === null || session.sessionNumber === undefined ? 'Sesión' : `Sesión ${session.sessionNumber}`
  return `${prefix}${session.title ? ` · ${session.title}` : ''}`
}

function sessionStatus(session: any | null): string {
  if (!session) return 'Sin sesión'
  if (session.status === 'preparation') return 'En juego'
  if (session.status === 'completed') return 'Completada'
  return 'Archivada'
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha real'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function ChroniclePlayWorkspace({ chronicleId, characterId, characterName, onOpenCharacter }: Props) {
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [sessionsReload, setSessionsReload] = useState(0)
  const [session, setSession] = useState<any | null>(null)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [context, setContext] = useState<ChronicleSessionContextApiSnapshot>(emptyContext)
  const [workspace, setWorkspace] = useState<SessionWorkspaceSnapshot | null>(null)
  const [stories, setStories] = useState<readonly ChronicleSharedStoryApiSnapshot[]>([])
  const [contextLoading, setContextLoading] = useState(false)
  const [contextError, setContextError] = useState<string | null>(null)
  const [model, setModel] = useState<any | null>(null)
  const [portraitFailed, setPortraitFailed] = useState(false)
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
        setSession((current: any) => items.find((item: any) => item.id === current?.id) ?? items.find((item: any) => item.status === 'preparation') ?? items[0] ?? null)
      })
      .catch(() => {
        if (!active) return
        setSessions([])
        setSession(null)
        setSessionsError('No se pudieron cargar las sesiones de la crónica.')
      })
      .finally(() => { if (active) setSessionsLoading(false) })
    return () => { active = false }
  }, [chronicleId, sessionsReload])

  useEffect(() => {
    if (!session?.id) {
      setContext(emptyContext)
      setWorkspace(null)
      setStories([])
      return
    }
    let active = true
    setContextLoading(true)
    setContextError(null)
    void Promise.allSettled([
      chronicleGateway.sessionContext(chronicleId, session.id),
      sessionWorkspaceApi.load(chronicleId, session.id),
      storyGateway.listShared(chronicleId),
    ]).then(([contextResult, workspaceResult, storiesResult]) => {
      if (!active) return
      if (contextResult.status === 'fulfilled') setContext(contextResult.value)
      else setContext(emptyContext)
      if (workspaceResult.status === 'fulfilled') setWorkspace(workspaceResult.value)
      else setWorkspace(null)
      if (storiesResult.status === 'fulfilled') setStories(storiesResult.value.items)
      else setStories([])
      if ([contextResult, workspaceResult, storiesResult].some((result) => result.status === 'rejected')) {
        setContextError('Parte del contexto de juego no está disponible. Puedes seguir utilizando las tiradas y las notas.')
      }
    }).finally(() => { if (active) setContextLoading(false) })
    return () => { active = false }
  }, [chronicleId, session?.id])

  useEffect(() => {
    if (!characterId) {
      setModel(null)
      return
    }
    let active = true
    setPortraitFailed(false)
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
      .catch(() => { if (active) setNotesError('No se pudieron cargar las notas de la sesión.') })
      .finally(() => { if (active) setNotesLoading(false) })
    return () => { active = false }
  }, [chronicleId, session?.id])

  async function saveNote(kind: 'private' | 'public') {
    if (!session?.id) return
    setSavingNote(kind)
    setSavedNote(null)
    setNotesError(null)
    try {
      const snapshot = await chronicleSessionParticipantNotesApi.update(chronicleId, session.id, {
        expectedRevision: notes.revision,
        ...(kind === 'private' ? { privateNotes: privateNotes.trim() || null } : { publicNotes: publicNotes.trim() || null }),
      })
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
      } else setNotesError('No se pudieron actualizar las notas.')
    } finally {
      setSavingNote(null)
    }
  }

  const characterRevision = model?.revision ?? 0
  const hunger = numberValue(model, 'state.hunger', 'state.blood.hunger', 'blood.hunger', 'hunger')
  const actualCharacterName = characterName ?? value(model, 'identity.name', 'name')
  const clan = value(model, 'identity.clan', 'clan')
  const health = trackValue(model, ['damage.health', 'state.damage.health', 'health'], ['damage.healthCapacity', 'state.damage.healthCapacity', 'healthCapacity'])
  const willpower = trackValue(model, ['damage.willpower', 'state.damage.willpower', 'willpower'], ['damage.willpowerCapacity', 'state.damage.willpowerCapacity', 'willpowerCapacity'])
  const humanity = value(model, 'humanity.value', 'state.humanity.value', 'humanity')
  const disciplines = disciplineNames(model)
  const currentScene = workspace?.scenes.find((item) => item.status === 'pending') ?? workspace?.scenes[0] ?? null
  const linkedStory = stories.find((item) => item.sessionIds.includes(session?.id ?? '')) ?? stories.find((item) => item.status === 'active') ?? stories[0] ?? null
  const location = context.locations[0] ?? null
  const npc = context.npcs[0] ?? null
  const document = context.resources.find((item) => item.kind === 'document') ?? context.resources[0] ?? null
  const organization = context.resources.find((item) => item.kind === 'organization') ?? null
  const latestEvent = [...context.events].sort((left, right) => right.timelineOrder - left.timelineOrder)[0] ?? null
  const visibleSessions = showAllSessions ? sessions : sessions.slice(0, 7)
  const discovered = useMemo(() => [
    ...context.events.map((item) => ({ id: `event-${item.id}`, label: item.title, kind: 'Suceso' })),
    ...context.resources.map((item) => ({ id: `resource-${item.id}`, label: item.name, kind: item.kind === 'document' ? 'Documento' : item.kind === 'artifact' ? 'Artefacto' : 'Organización' })),
    ...context.locations.map((item) => ({ id: `location-${item.id}`, label: item.name, kind: 'Localización' })),
  ].slice(0, 5), [context])

  return <section className="chronicle-play-workspace" aria-labelledby="chronicle-play-title">
    <aside className="chronicle-play-workspace__rail">
      <header><small>CRÓNICA ACTIVA</small><h2>Jugar</h2><span>{sessionStatus(session)}</span></header>
      <article className="chronicle-play-workspace__session-card"><small>SESIÓN ACTIVA</small><strong>{sessionTitle(session)}</strong><b>{formatDate(session?.realDate)}</b><span className="chronicle-play-workspace__selection-state">{session ? 'Sesión seleccionada' : 'Esperando al Narrador'}</span></article>
      <h3>Sesiones</h3>
      <ul className="chronicle-play-workspace__session-list">{visibleSessions.map((item: any) => <li key={item.id}><button type="button" className={item.id === session?.id ? 'is-active' : ''} onClick={() => setSession(item)}><strong>{item.title || `Sesión ${item.sessionNumber ?? ''}`}</strong><small>{sessionStatus(item)}</small><time>{formatDate(item.realDate)}</time></button></li>)}</ul>
      {sessionsLoading ? <p role="status">Cargando sesiones…</p> : null}
      {sessionsError ? <div className="chronicle-play-workspace__sessions-error" role="alert"><span>{sessionsError}</span><button type="button" onClick={() => setSessionsReload((current) => current + 1)}>Reintentar carga de sesiones</button></div> : null}
      {sessions.length > 7 ? <button type="button" className="chronicle-play-workspace__rail-action" onClick={() => setShowAllSessions((current) => !current)}>{showAllSessions ? 'Mostrar sesiones recientes' : `Ver todas las sesiones (${sessions.length})`}</button> : null}
    </aside>

    <main className="chronicle-play-workspace__main">
      <header className="chronicle-play-workspace__hero">
        <div className="chronicle-play-workspace__hero-title"><div><small>{sessionStatus(session).toUpperCase()}</small><h1 id="chronicle-play-title">{sessionTitle(session)}</h1></div><strong>{session?.status === 'preparation' ? '● EN JUEGO' : sessionStatus(session).toUpperCase()}</strong></div>
        <dl className="chronicle-play-workspace__situation"><div><dt>Historia</dt><dd>{linkedStory?.title ?? 'Sin historia vinculada'}</dd></div><div><dt>Escena actual</dt><dd>{currentScene?.title ?? 'Esperando al Narrador'}</dd></div><div><dt>Ubicación</dt><dd>{location?.name ?? 'Sin localización vinculada'}</dd></div><div><dt>Momento narrativo</dt><dd>{latestEvent?.narrativeTimeLabel ?? formatDate(session?.realDate)}</dd></div></dl>
      </header>

      <section className="chronicle-play-workspace__scene">
        <div className="chronicle-play-workspace__scene-copy"><small>ESCENA ACTUAL</small><p>{currentScene?.purpose ?? session?.summary ?? 'El Narrador todavía no ha publicado el contexto de esta escena.'}</p><strong>Objetivo</strong><p>{session?.objective ?? session?.plannedSummary ?? linkedStory?.sharedSummary ?? 'Sigue la escena y las indicaciones del Narrador.'}</p></div>
        <div className="chronicle-play-workspace__tension"><small>Tensión visible</small><i aria-label={`Intensidad ${currentScene?.intensity ?? 0} de 5`}>{Array.from({ length: 5 }, (_, index) => <b key={index} className={index < (currentScene?.intensity ?? 0) ? 'is-filled' : ''} />)}</i><strong>{(currentScene?.intensity ?? 0) >= 4 ? 'ALTA' : (currentScene?.intensity ?? 0) >= 2 ? 'MEDIA' : 'BAJA'}</strong></div>
        <div className="chronicle-play-workspace__scene-links">
          <article><small>PERSONAJE PRESENTE</small><strong>{actualCharacterName}</strong><span>{characterId ? 'Tu personaje' : 'Sin asociación'}</span></article>
          <article><small>PNJ VISIBLE</small><strong>{npc?.name ?? 'Sin PNJ vinculado'}</strong><span>{npc?.narrativeRole ?? npc?.category ?? '—'}</span></article>
          <article><small>UBICACIÓN ACTUAL</small><strong>{location?.name ?? 'Sin localización'}</strong><span>{location?.category ?? '—'}</span></article>
          <article><small>PISTA / DOCUMENTO</small><strong>{document?.name ?? 'Sin documento revelado'}</strong><span>{document?.summary ?? '—'}</span></article>
          <article><small>ORGANIZACIÓN VINCULADA</small><strong>{organization?.name ?? 'Sin organización'}</strong><span>{organization?.summary ?? '—'}</span></article>
        </div>
      </section>

      {contextLoading ? <p className="chronicle-play-workspace__context-state" role="status">Actualizando contexto de juego…</p> : null}
      {contextError ? <p className="chronicle-play-workspace__context-state is-warning" role="alert">{contextError}</p> : null}

      <div className="chronicle-play-workspace__operation-grid">
        <section className="chronicle-play-workspace__dice">
          <DiceRollPanel mode={characterId ? 'character' : 'manual'} characterId={characterId} chronicleId={chronicleId} sessionId={session?.id} attributes={attributeDefinitions} skills={skillDefinitions} />
          <div className="chronicle-play-workspace__recent-rolls"><DiceHistoryPanel chronicleId={chronicleId} contextLabel="Tiradas de la crónica" /></div>
        </section>

        <section className="chronicle-play-workspace__immediate">
          <header><small>CONTEXTO INMEDIATO</small><h2>Situación narrativa</h2></header>
          <article><span>Progreso de la historia</span><div className="chronicle-play-workspace__progress"><i><b style={{ width: `${linkedStory?.progress.percentage ?? 0}%` }} /></i><strong>{linkedStory?.progress.completed ?? 0} / {linkedStory?.progress.total ?? 5} hitos</strong></div></article>
          <article><span>Último evento en cronología</span><strong>{latestEvent?.title ?? 'Sin sucesos vinculados'}</strong><small>{latestEvent?.narrativeTimeLabel ?? '—'}</small></article>
          <article><span>Recursos vinculados</span><div className="chronicle-play-workspace__resource-counts"><b>PNJ {context.npcs.length}</b><b>Lugares {context.locations.length}</b><b>Sucesos {context.events.length}</b><b>Documentos {context.resources.length}</b></div></article>
          <article><span>Próximo hito</span><strong>{linkedStory?.milestones.find((item) => !item.completed)?.key.replace(/_/g, ' ') ?? 'Resolución narrativa'}</strong><small>{linkedStory?.sharedSummary ?? 'Continúa la escena actual.'}</small></article>
        </section>
      </div>

      <section className="chronicle-play-workspace__vampire" aria-labelledby="chronicle-play-vampire-title">
        <header><small>ESTADO VAMPÍRICO</small><h2 id="chronicle-play-vampire-title">Recursos de Sangre</h2></header>
        {model && characterId ? <div className="chronicle-play-workspace__vampire-grid">
          <article><h3>Control de enardecimiento</h3><p>Comprueba si aumenta tu Hambre.</p><PersistedCharacterRouseCheck characterId={characterId} revision={characterRevision} hunger={hunger} onApplied={() => setReload((item) => item + 1)} onConflictReload={() => setReload((item) => item + 1)} /></article>
          <article><h3>Alimentación</h3><p>Registra presa, resonancia y Hambre saciada.</p><PersistedCharacterFeeding characterId={characterId} revision={characterRevision} hunger={hunger} onApplied={() => setReload((item) => item + 1)} /></article>
          <article className="chronicle-play-workspace__hunger"><h3>Hambre actual</h3><strong>{hunger} / 5</strong><i aria-label={`Hambre ${hunger} de 5`}>{Array.from({ length: 5 }, (_, index) => <b key={index} className={index < hunger ? 'is-filled' : ''} />)}</i><span>{hunger >= 4 ? 'Crítica' : hunger >= 2 ? 'Moderada' : 'Controlada'}</span></article>
        </div> : <p className="chronicle-play-workspace__empty">Asocia un personaje activo para utilizar Enardecimiento y Alimentación.</p>}
      </section>

      <section className="chronicle-play-workspace__notes" aria-label="Notas e información de la sesión">
        <article><header><h2>Notas privadas</h2><small>Solo tú</small></header><textarea value={privateNotes} disabled={notesLoading || !session} onChange={(event) => { setPrivateNotes(event.target.value); setSavedNote(null) }} placeholder="Escribe tus notas privadas..." /><button type="button" disabled={notesLoading || savingNote !== null || !session} onClick={() => void saveNote('private')}>{savingNote === 'private' ? 'Guardando…' : 'Guardar nota privada'}</button>{savedNote === 'private' ? <small role="status">Nota privada guardada</small> : null}</article>
        <article><header><h2>Notas compartidas</h2><small>Participantes de la crónica</small></header><textarea value={publicNotes} disabled={notesLoading || !session} onChange={(event) => { setPublicNotes(event.target.value); setSavedNote(null) }} placeholder="Escribe una nota para compartir..." /><button type="button" disabled={notesLoading || savingNote !== null || !session} onClick={() => void saveNote('public')}>{savingNote === 'public' ? 'Guardando…' : 'Guardar nota compartida'}</button>{savedNote === 'public' ? <small role="status">Nota compartida guardada</small> : null}{notes.sharedNotes.length ? <ul className="chronicle-play-workspace__shared-notes">{notes.sharedNotes.slice(0, 3).map((note) => <li key={note.authorUserId}><strong>{note.authorName}</strong><span>{note.content}</span></li>)}</ul> : null}</article>
        <article className="chronicle-play-workspace__discoveries"><header><h2>Información descubierta</h2><small>Contexto público</small></header>{discovered.length ? <ul>{discovered.map((item) => <li key={item.id}><strong>{item.label}</strong><span>{item.kind}</span></li>)}</ul> : <p>No hay información pública vinculada.</p>}</article>
        {notesError ? <p className="chronicle-play-workspace__notes-error" role="alert">{notesError}</p> : null}
      </section>
    </main>

    <aside className="chronicle-play-workspace__character">
      <header><small>MI PERSONAJE</small><h2>{actualCharacterName}</h2></header>
      <div className="chronicle-play-character__portrait">{characterId && !portraitFailed ? <img src={`/api/characters/${characterId}/portrait`} alt={`Retrato de ${actualCharacterName}`} onError={() => setPortraitFailed(true)} /> : <V5VisualMark kind="clan-symbol" value={clan} decorative />}</div>
      {characterId && onOpenCharacter ? <button type="button" onClick={() => onOpenCharacter(characterId)}>Abrir ficha completa</button> : null}
      <div className="chronicle-play-character__tracks"><Track label="Hambre" display={`${hunger}/5`} /><Track label="Salud" display={health} /><Track label="Fuerza de voluntad" display={willpower} /><Track label="Humanidad" display={humanity} fallbackMaximum={10} /></div>
      <article><h3>Información del personaje</h3><div className="chronicle-play__clan-identity"><V5VisualMark kind="clan-symbol" value={clan} decorative /><p>Clan: {clan}</p></div><p>Concepto: {value(model, 'identity.concept', 'concept')}</p><p>Resonancia: {value(model, 'blood.resonance.temperament', 'state.blood.resonance.temperament', 'blood.resonance.key')}</p><p>Condiciones activas: {value(model, 'state.conditions.summary', 'conditions.summary')}</p></article>
      <article className="chronicle-play-character__disciplines"><h3>Disciplinas</h3>{disciplines.length ? <div>{disciplines.map((discipline) => <span key={discipline}><V5VisualMark kind="discipline" value={discipline} decorative /><small>{discipline}</small></span>)}</div> : <p>Consulta la ficha completa.</p>}</article>
    </aside>
  </section>
}

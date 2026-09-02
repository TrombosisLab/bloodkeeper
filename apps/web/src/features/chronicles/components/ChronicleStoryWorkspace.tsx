import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type {
  ChronicleCharacterApiSummary,
  ChronicleEventApiSnapshot,
  ChronicleLocationApiSnapshot,
  ChronicleNpcApiSnapshot,
  ChronicleSessionApiSnapshot,
} from '../types/chronicle-api.types'
import type {
  ChronicleStoryApiSnapshot,
  ChronicleStoryApiStatus,
  ChronicleStoryApiType,
  ChronicleStoryApiVisibility,
  ChronicleStoryMilestoneApiKey,
} from '../types/chronicle-story-api.types'
import { createChronicleGateway } from '../infrastructure/chronicle.api'
import {
  ChronicleStoryApiError,
  createChronicleStoryGateway,
} from '../infrastructure/chronicle-story.api'

import './chronicle-story-workspace.css'

const storyGateway = createChronicleStoryGateway()
const chronicleGateway = createChronicleGateway()

const milestoneLabels: Readonly<Record<ChronicleStoryMilestoneApiKey, string>> = {
  hook: 'Gancho',
  first_turn: 'Primer giro',
  revelation: 'Revelación',
  climax: 'Clímax',
  resolution: 'Resolución',
}

const statusLabels: Readonly<Record<ChronicleStoryApiStatus, string>> = {
  planned: 'Planificada',
  active: 'En curso',
  completed: 'Completada',
  archived: 'Archivada',
}

const typeLabels: Readonly<Record<ChronicleStoryApiType, string>> = {
  main_arc: 'Arco principal',
  secondary_arc: 'Arco secundario',
  personal_arc: 'Arco personal',
}

interface Props {
  readonly chronicleId: string
  readonly associatedCharacters: readonly ChronicleCharacterApiSummary[]
  readonly createRequestKey?: number
}

interface ContextSelection {
  readonly sessionIds: readonly string[]
  readonly eventIds: readonly string[]
  readonly characterIds: readonly string[]
  readonly npcIds: readonly string[]
  readonly locationIds: readonly string[]
}

type ContextFocus = 'sessions' | 'events' | 'cast' | 'locations' | 'all'

const emptyContext: ContextSelection = {
  sessionIds: [],
  eventIds: [],
  characterIds: [],
  npcIds: [],
  locationIds: [],
}

function storyError(error: unknown): string {
  if (error instanceof ChronicleStoryApiError) {
    if (error.code === 'CHRONICLE_STORY_REVISION_CONFLICT') return 'La historia cambió. Se ha recargado el estado más reciente.'
    if (error.code === 'CHRONICLE_STORY_READ_ONLY') return 'La historia está cerrada y ya no admite cambios.'
    if (error.code === 'CHRONICLE_STORY_PERMISSION_DENIED') return 'Solo el Narrador contextual puede gestionar historias.'
    if (error.code === 'CHRONICLE_STORY_COMPLETION_PRECONDITION_FAILED') return 'La historia no cumple las condiciones de cierre. Revisa las sesiones vinculadas y la resoluciÃ³n.'
    if (error.code === 'CHRONICLE_STORY_COMPLETION_OPERATION_CONFLICT') return 'La operaciÃ³n de cierre ya pertenece a otra historia.'
  }
  return 'No se pudo completar la operación.'
}

function storyDate(value: string | null): string {
  if (value === null) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value))
}

function toggleId(values: readonly string[], id: string): readonly string[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
}

async function loadAllOffsetItems<T>(
  loader: (offset: number) => Promise<{
    readonly items: readonly T[]
    readonly nextOffset: number | null
  }>,
): Promise<readonly T[]> {
  const items: T[] = []
  let offset: number | null = 0
  while (offset !== null) {
    const page = await loader(offset)
    items.push(...page.items)
    offset = page.nextOffset
  }
  return items
}

function storyCompletionOperationId(): string {
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues !== undefined) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hexadecimal = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  return `${hexadecimal.slice(0, 8)}-${hexadecimal.slice(8, 12)}-${hexadecimal.slice(12, 16)}-${hexadecimal.slice(16, 20)}-${hexadecimal.slice(20)}`
}

export function ChronicleStoryWorkspace({ chronicleId, associatedCharacters, createRequestKey = 0 }: Props) {
  const [stories, setStories] = useState<readonly ChronicleStoryApiSnapshot[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<readonly ChronicleSessionApiSnapshot[]>([])
  const [events, setEvents] = useState<readonly ChronicleEventApiSnapshot[]>([])
  const [npcs, setNpcs] = useState<readonly ChronicleNpcApiSnapshot[]>([])
  const [locations, setLocations] = useState<readonly ChronicleLocationApiSnapshot[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [operation, setOperation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [contextFocus, setContextFocus] = useState<ContextFocus>('all')
  const [context, setContext] = useState<ContextSelection>(emptyContext)
  const [reminderText, setReminderText] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [typeDraft, setTypeDraft] = useState<ChronicleStoryApiType>('main_arc')
  const [premiseDraft, setPremiseDraft] = useState('')
  const [stakesDraft, setStakesDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [sharedSummaryDraft, setSharedSummaryDraft] = useState('')
  const [visibilityDraft, setVisibilityDraft] = useState<ChronicleStoryApiVisibility>('narrator_only')
  const [resolutionDraft, setResolutionDraft] = useState('')
  const [completionConfirmed, setCompletionConfirmed] = useState(false)
  const [completionOperationId, setCompletionOperationId] = useState(storyCompletionOperationId)
  const [sessionNotes, setSessionNotes] = useState<Readonly<Record<string, string>>>({})

  const selected = stories.find((story) => story.id === selectedId) ?? null
  const filteredStories = useMemo(() => stories.filter((story) => {
    const matchesTitle = story.title.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))
    return matchesTitle && (statusFilter.length === 0 || story.status === statusFilter)
  }), [stories, search, statusFilter])

  function storeStory(story: ChronicleStoryApiSnapshot) {
    setStories((current) => current.map((item) => item.id === story.id ? story : item))
    setSelectedId(story.id)
  }

  function openContext(focus: ContextFocus) {
    setContextFocus(focus)
    setShowContext(true)
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [storyPage, sessionPage, loadedEvents, npcPage, loadedLocations] = await Promise.all([
        storyGateway.list(chronicleId),
        loadAllOffsetItems((offset) => chronicleGateway.sessions(chronicleId, { limit: 50, offset })),
        chronicleGateway.events(chronicleId),
        loadAllOffsetItems((offset) => chronicleGateway.npcs(chronicleId, { limit: 50, offset })),
        chronicleGateway.locations(chronicleId),
      ])
      setStories(storyPage.items)
      setSessions(sessionPage)
      setEvents(loadedEvents)
      setNpcs(npcPage)
      setLocations(loadedLocations)
      setSelectedId((current) => storyPage.items.some((story) => story.id === current) ? current : storyPage.items[0]?.id ?? null)
    } catch (loadError: unknown) {
      setError(storyError(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [chronicleId])

  useEffect(() => {
    if (createRequestKey > 0) setShowCreate(true)
  }, [createRequestKey])

  useEffect(() => {
    if (selected === null) return
    setTitleDraft(selected.title)
    setTypeDraft(selected.type)
    setPremiseDraft(selected.premise ?? '')
    setStakesDraft(selected.stakes ?? '')
    setNotesDraft(selected.narratorNotes ?? '')
    setSharedSummaryDraft(selected.sharedSummary ?? '')
    setVisibilityDraft(selected.visibility)
    setResolutionDraft(selected.resolution ?? '')
    setCompletionConfirmed(false)
    setCompletionOperationId(storyCompletionOperationId())
    setSessionNotes(Object.fromEntries(selected.sessions.map((session) => [session.id, session.progressNotes ?? ''])))
    setContext({
      sessionIds: selected.sessions.map((item) => item.id),
      eventIds: selected.events.map((item) => item.id),
      characterIds: selected.characters.map((item) => item.id),
      npcIds: selected.npcs.map((item) => item.id),
      locationIds: selected.locations.map((item) => item.id),
    })
  }, [selectedId, selected?.revision])

  async function perform(name: string, action: () => Promise<ChronicleStoryApiSnapshot>) {
    setOperation(name)
    setError(null)
    try {
      storeStory(await action())
    } catch (operationError: unknown) {
      setError(storyError(operationError))
      if (operationError instanceof ChronicleStoryApiError && operationError.code === 'CHRONICLE_STORY_REVISION_CONFLICT') await load()
    } finally {
      setOperation(null)
    }
  }

  async function createStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = String(data.get('title') ?? '').trim()
    if (title.length === 0) return
    setOperation('create')
    setError(null)
    try {
      const created = await storyGateway.create(chronicleId, {
        title,
        type: String(data.get('type')) as ChronicleStoryApiType,
        premise: null,
        stakes: null,
        narratorNotes: null,
        sharedSummary: null,
        visibility: 'narrator_only',
      })
      setStories((current) => [...current, created])
      setSelectedId(created.id)
      setShowCreate(false)
      form.reset()
    } catch (createError: unknown) {
      setError(storyError(createError))
    } finally {
      setOperation(null)
    }
  }

  if (loading) return <div className="story-workspace story-workspace--state">Cargando historias…</div>

  const readOnly = selected?.status === 'completed' || selected?.status === 'archived'
  const hasCompletedClosure = selected !== null && selected.closure.completion !== null
  const closureEligible = selected !== null &&
    selected.status === 'active' &&
    selected.closure.hasEligibleSession &&
    !selected.closure.hasPreparationSession &&
    resolutionDraft.trim().length > 0 &&
    completionConfirmed

  return (
    <section className="story-workspace" aria-label="Historias de la crónica">
      {error !== null ? <div className="story-workspace__alert" role="alert">{error}<button type="button" onClick={() => setError(null)}>Cerrar</button></div> : null}

      <aside className="story-browser">
        <div className="story-browser__heading"><div><span>Crónica</span><h2>Historias</h2></div><span className="story-pill">{filteredStories.length}</span></div>
        <label className="story-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar historias" aria-label="Buscar historias" /></label>
        <select className="story-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar historias por estado">
          <option value="">Todos los estados</option><option value="planned">Planificadas</option><option value="active">En curso</option><option value="completed">Completadas</option><option value="archived">Archivadas</option>
        </select>
        <button type="button" className="story-primary story-browser__new" onClick={() => setShowCreate((value) => !value)}>＋ Nueva historia</button>
        {showCreate ? <form className="story-create" onSubmit={createStory}><input name="title" maxLength={160} required placeholder="Título de la historia" /><select name="type" defaultValue="main_arc"><option value="main_arc">Arco principal</option><option value="secondary_arc">Arco secundario</option><option value="personal_arc">Arco personal</option></select><button type="submit" disabled={operation === 'create'}>{operation === 'create' ? 'Creando…' : 'Crear historia'}</button></form> : null}
        <div className="story-browser__list">
          {filteredStories.map((story) => <button type="button" key={story.id} className={`story-card${story.id === selectedId ? ' story-card--selected' : ''}`} onClick={() => setSelectedId(story.id)}>
            <span className="story-card__top"><strong>{story.title}</strong><span className={`story-status story-status--${story.status}`}>{statusLabels[story.status]}</span></span>
            <small>{typeLabels[story.type]}</small><span className="story-card__progress"><i style={{ width: `${story.progress.percentage}%` }} /></span><span className="story-card__meta">{story.progress.completed}/5 hitos · {story.counts.sessions} sesiones</span>
            {story.status === 'completed' ? <span className="story-card__xp">✓ +1 XP · {story.closure.completion?.grantedCount ?? 0} personaje{story.closure.completion?.grantedCount === 1 ? '' : 's'}</span> : null}
          </button>)}
          {filteredStories.length === 0 ? <p className="story-empty">No hay historias con estos filtros.</p> : null}
        </div>
        <footer>{filteredStories.length} resultado{filteredStories.length === 1 ? '' : 's'}</footer>
      </aside>

      <main className="story-detail">
        {selected === null ? <div className="story-detail__empty"><span>♜</span><h2>Crea la primera historia</h2><p>Aquí aparecerán sus hitos, sesiones, reparto y localizaciones.</p></div> : <>
          <header className="story-detail__header">
            <div className="story-detail__title"><span>Historia seleccionada</span><input value={titleDraft} disabled={readOnly} onChange={(event) => setTitleDraft(event.target.value)} aria-label="Título de la historia" /><select value={typeDraft} disabled={readOnly} onChange={(event) => setTypeDraft(event.target.value as ChronicleStoryApiType)}><option value="main_arc">Arco principal</option><option value="secondary_arc">Arco secundario</option><option value="personal_arc">Arco personal</option></select></div>
            <div className="story-detail__header-actions"><span className={`story-status story-status--${selected.status}`}>{statusLabels[selected.status]}</span>{selected.status === 'planned' ? <button type="button" onClick={() => void perform('activate', () => storyGateway.activate(chronicleId, selected.id, selected.revision))}>Activar</button> : null}<button type="button" disabled={readOnly || operation !== null} onClick={() => void perform('save-main', () => storyGateway.update(chronicleId, selected.id, { expectedRevision: selected.revision, title: titleDraft, type: typeDraft, premise: premiseDraft.trim() || null, stakes: stakesDraft.trim() || null }))}>Guardar cambios</button></div>
          </header>

          <section className="story-premise-grid">
            <label><span>Premisa</span><textarea value={premiseDraft} disabled={readOnly} onChange={(event) => setPremiseDraft(event.target.value)} placeholder="¿Qué pone esta historia en movimiento?" /></label>
            <label><span>En juego</span><textarea value={stakesDraft} disabled={readOnly} onChange={(event) => setStakesDraft(event.target.value)} placeholder="¿Qué se puede ganar o perder?" /></label>
          </section>

          <section className="story-section story-milestones"><div className="story-section__heading"><div><span>Progreso narrativo</span><h3>Hitos de la historia</h3></div><strong>{selected.progress.percentage}%</strong></div><div className="story-milestones__track">{selected.milestones.map((milestone, index) => <button key={milestone.key} type="button" disabled={readOnly || operation !== null} className={milestone.completed ? 'is-complete' : ''} onClick={() => void perform(`milestone:${milestone.key}`, () => storyGateway.milestone(chronicleId, selected.id, milestone.key, { expectedRevision: selected.revision, completed: !milestone.completed, note: milestone.note }))}><span>{milestone.completed ? '✓' : index + 1}</span><strong>{milestoneLabels[milestone.key]}</strong><small>{milestone.completed ? 'Completado' : 'Pendiente'}</small></button>)}</div></section>

          <section className="story-section"><div className="story-section__heading"><div><span>Desarrollo</span><h3>Sesiones vinculadas</h3></div><button type="button" onClick={() => openContext('sessions')} disabled={readOnly}>＋ Vincular sesión</button></div><div className="story-session-list">{selected.sessions.map((session) => <article key={session.id}><div className="story-resource-icon">◫</div><div><strong>{session.sessionNumber === null ? 'Sesión' : `Sesión ${session.sessionNumber}`}: {session.title ?? 'Sin título'}</strong><small>{storyDate(session.realDate)} · {session.status}</small><textarea value={sessionNotes[session.id] ?? ''} disabled={readOnly} onChange={(event) => setSessionNotes((current) => ({ ...current, [session.id]: event.target.value }))} placeholder="Qué avanzó en esta historia…" /><button type="button" disabled={readOnly || operation !== null} onClick={() => void perform(`session:${session.id}`, () => storyGateway.updateSessionProgress(chronicleId, selected.id, session.id, { expectedRevision: selected.revision, progressNotes: sessionNotes[session.id]?.trim() || null }))}>Guardar avance</button></div></article>)}{selected.sessions.length === 0 ? <button type="button" className="story-add-card" onClick={() => openContext('sessions')}>＋ Añadir sesión relacionada</button> : null}</div></section>

          <section className="story-section"><div className="story-section__heading"><div><span>Cronología</span><h3>Sucesos registrados</h3></div><button type="button" onClick={() => openContext('events')} disabled={readOnly}>＋ Añadir suceso</button></div><div className="story-compact-grid">{selected.events.map((event) => <article key={event.id}><span className="story-resource-icon">◇</span><div><strong>{event.title}</strong><small>{event.narrativeTimeLabel ?? storyDate(event.realDate)}</small></div></article>)}{selected.events.length === 0 ? <button type="button" className="story-add-card" onClick={() => openContext('events')}>＋ Relacionar suceso</button> : null}</div></section>

          <section className="story-section story-cast"><div className="story-section__heading"><div><span>Reparto</span><h3>Personajes implicados</h3></div><button type="button" onClick={() => openContext('cast')} disabled={readOnly}>＋ Gestionar reparto</button></div><div className="story-cast__columns"><div><h4>Personajes jugadores</h4>{selected.characters.map((link) => { const character = associatedCharacters.find((item) => item.characterId === link.id); return <article key={link.id}><span className="story-avatar">PJ</span><div><strong>{character?.name || 'Personaje sin nombre'}</strong><small>{character?.concept ?? 'Sin concepto'}</small></div></article> })}{selected.characters.length === 0 ? <p className="story-empty">Ningún PJ implicado.</p> : null}</div><div><h4>PNJ</h4>{selected.npcs.map((npc) => <article key={npc.id}><span className="story-avatar story-avatar--npc">PNJ</span><div><strong>{npc.name}</strong><small>{npc.narrativeRole ?? npc.category ?? 'Sin rol definido'}</small></div></article>)}{selected.npcs.length === 0 ? <p className="story-empty">Ningún PNJ implicado.</p> : null}</div></div></section>

          <section className="story-section"><div className="story-section__heading"><div><span>Escenarios</span><h3>Localizaciones</h3></div><button type="button" onClick={() => openContext('locations')} disabled={readOnly}>＋ Añadir localización</button></div><div className="story-compact-grid">{selected.locations.map((location) => <article key={location.id}><span className="story-resource-icon">⌂</span><div><strong>{location.name}</strong><small>{location.category ?? 'Localización'}</small></div></article>)}{selected.locations.length === 0 ? <button type="button" className="story-add-card" onClick={() => openContext('locations')}>＋ Relacionar localización</button> : null}</div></section>
        </>}
      </main>

      <aside className="story-sidebar">
        {selected === null ? <div className="story-sidebar__placeholder">Selecciona una historia para ver su resumen.</div> : <>
          <section className="story-side-card story-summary"><div className="story-side-card__heading"><span>◈</span><h3>Resumen</h3></div><div className="story-summary__metrics"><div><strong>{selected.counts.sessions}</strong><small>Sesiones vinculadas</small></div><div><strong>{selected.counts.characters}</strong><small>Personajes implicados</small></div><div><strong>{selected.counts.events}</strong><small>Sucesos registrados</small></div></div></section>
          <section className="story-side-card story-sharing"><div className="story-side-card__heading"><span>◇</span><div><h3>Publicación</h3><small>Visibilidad para participantes</small></div></div><label><span>Acceso</span><select aria-label="Visibilidad de la historia" value={visibilityDraft} disabled={readOnly} onChange={(event) => setVisibilityDraft(event.target.value as ChronicleStoryApiVisibility)}><option value="narrator_only">Solo Narrador</option><option value="chronicle_participants">Participantes de la Crónica</option></select></label><label><span>Resumen compartido</span><textarea aria-label="Resumen compartido" value={sharedSummaryDraft} disabled={readOnly} onChange={(event) => setSharedSummaryDraft(event.target.value)} placeholder="Lo que los participantes pueden conocer sobre este arco…" maxLength={8000} /></label><p>{visibilityDraft === 'chronicle_participants' ? 'Esta Historia aparecerá en la vista de los participantes activos.' : 'La Historia y este resumen permanecen privados.'}</p><button type="button" disabled={readOnly || operation !== null} onClick={() => void perform('sharing', () => storyGateway.update(chronicleId, selected.id, { expectedRevision: selected.revision, visibility: visibilityDraft, sharedSummary: sharedSummaryDraft.trim() || null }))}>{operation === 'sharing' ? 'Guardando…' : 'Guardar publicación'}</button></section>
          <section className="story-side-card story-notes"><div className="story-side-card__heading"><span>✦</span><div><h3>Notas del Narrador</h3><small>Solo Narrador</small></div></div><textarea value={notesDraft} disabled={readOnly} onChange={(event) => setNotesDraft(event.target.value)} placeholder="Secretos, pistas y próximos movimientos…" /><button type="button" disabled={readOnly || operation !== null} onClick={() => void perform('notes', () => storyGateway.update(chronicleId, selected.id, { expectedRevision: selected.revision, narratorNotes: notesDraft.trim() || null }))}>Guardar notas</button><div className="story-reminders"><h4>Recordatorios</h4>{selected.reminders.map((reminder) => <div key={reminder.id} className={reminder.resolved ? 'is-resolved' : ''}><button type="button" aria-label="Cambiar estado" disabled={readOnly} onClick={() => void perform(`reminder:${reminder.id}`, () => storyGateway.updateReminder(chronicleId, selected.id, reminder.id, { expectedRevision: selected.revision, resolved: !reminder.resolved }))}>{reminder.resolved ? '✓' : '○'}</button><span>{reminder.text}</span><button type="button" aria-label="Eliminar recordatorio" disabled={readOnly} onClick={() => void perform(`remove:${reminder.id}`, () => storyGateway.removeReminder(chronicleId, selected.id, reminder.id, selected.revision))}>×</button></div>)}<form onSubmit={(event) => { event.preventDefault(); const text = reminderText.trim(); if (text.length > 0) void perform('add-reminder', () => storyGateway.addReminder(chronicleId, selected.id, { expectedRevision: selected.revision, text })).then(() => setReminderText('')) }}><input value={reminderText} disabled={readOnly} onChange={(event) => setReminderText(event.target.value)} placeholder="Añadir recordatorio" /><button type="submit" disabled={readOnly}>＋</button></form></div></section>
          <section className="story-side-card story-closure"><div className="story-side-card__heading"><span>♜</span><h3>Cierre de historia</h3></div><p>{hasCompletedClosure ? `Historia cerrada: ${selected.closure.completion?.grantedCount ?? 0} concesiones de +1 XP registradas.` : selected.status === 'archived' ? selected.startedAt === null ? 'Esta planificación fue archivada sin iniciarse y no generó experiencia.' : 'Esta historia se archivó sin completar el cierre y no generó experiencia.' : selected.closure.eligibleCharacterCount === 0 ? 'No hay personajes elegibles. Puedes cerrar, pero no se concederá experiencia.' : 'El cierre otorgará +1 XP según la asistencia real a las sesiones de esta historia.'}</p><ul><li className={selected.progress.completed === 5 ? 'is-ready' : ''}>{selected.progress.completed}/5 hitos completados</li><li className={selected.closure.hasEligibleSession && !selected.closure.hasPreparationSession ? 'is-ready' : ''}>Sesiones finalizadas, sin sesiones en preparación</li><li className={selected.closure.hasEligibleSession ? 'is-ready' : ''}>{selected.closure.eligibleCharacterCount} personajes elegibles por asistencia</li></ul>{selected.status === 'active' ? <><label className="story-closure__resolution"><span>Resolución narrativa</span><textarea value={resolutionDraft} disabled={readOnly} onChange={(event) => setResolutionDraft(event.target.value)} placeholder="Cómo termina esta historia…" maxLength={8000} /></label><label className={`story-closure__confirm${selected.closure.eligibleCharacterCount === 0 ? ' is-warning' : ''}`}><input type="checkbox" checked={completionConfirmed} disabled={readOnly} onChange={(event) => setCompletionConfirmed(event.target.checked)} /><span>{selected.closure.eligibleCharacterCount === 0 ? 'Confirmo el cierre sin conceder experiencia' : `Confirmo el cierre y la concesión de +1 XP a ${selected.closure.eligibleCharacterCount} personaje${selected.closure.eligibleCharacterCount === 1 ? '' : 's'}`}</span></label><button type="button" className="story-closure__button" disabled={!closureEligible || operation !== null} onClick={() => void perform('complete', () => storyGateway.complete(chronicleId, selected.id, { expectedRevision: selected.revision, operationId: completionOperationId, resolution: resolutionDraft.trim(), confirmed: true }))}>{operation === 'complete' ? 'Cerrando historia…' : 'Cerrar historia · +1 XP'}</button></> : hasCompletedClosure ? <button type="button" className="story-closure__button" disabled>✓ Historia cerrada · +1 XP</button> : null}{selected.status === 'planned' || selected.status === 'completed' ? <button type="button" className="story-archive" disabled={operation !== null} onClick={() => void perform('archive', () => storyGateway.archive(chronicleId, selected.id, selected.revision))}>{selected.status === 'planned' ? 'Archivar planificación' : 'Archivar historia cerrada'}</button> : null}</section>
        </>}
      </aside>

      {showContext && selected !== null ? <div className="story-modal" role="dialog" aria-modal="true" aria-labelledby="story-context-title"><div className="story-modal__panel"><header><div><span>Relaciones de la historia</span><h3 id="story-context-title">Vincular contenido</h3></div><button type="button" onClick={() => setShowContext(false)} aria-label="Cerrar">×</button></header><div className="story-modal__grid">
        {contextFocus === 'sessions' || contextFocus === 'all' ? <ContextGroup title="Sesiones" items={sessions.map((item) => ({ id: item.id, label: `${item.sessionNumber === null ? 'Sesión' : `Sesión ${item.sessionNumber}`} · ${item.title ?? 'Sin título'}` }))} selected={context.sessionIds} onToggle={(id) => setContext((current) => ({ ...current, sessionIds: toggleId(current.sessionIds, id) }))} /> : null}
        {contextFocus === 'events' || contextFocus === 'all' ? <ContextGroup title="Sucesos" items={events.map((item) => ({ id: item.id, label: item.title }))} selected={context.eventIds} onToggle={(id) => setContext((current) => ({ ...current, eventIds: toggleId(current.eventIds, id) }))} /> : null}
        {contextFocus === 'cast' || contextFocus === 'all' ? <ContextGroup title="Personajes jugadores" items={associatedCharacters.map((item) => ({ id: item.characterId, label: item.name || 'Personaje sin nombre' }))} selected={context.characterIds} onToggle={(id) => setContext((current) => ({ ...current, characterIds: toggleId(current.characterIds, id) }))} /> : null}
        {contextFocus === 'cast' || contextFocus === 'all' ? <ContextGroup title="PNJ" items={npcs.map((item) => ({ id: item.id, label: item.name }))} selected={context.npcIds} onToggle={(id) => setContext((current) => ({ ...current, npcIds: toggleId(current.npcIds, id) }))} /> : null}
        {contextFocus === 'locations' || contextFocus === 'all' ? <ContextGroup title="Localizaciones" items={locations.map((item) => ({ id: item.id, label: item.name }))} selected={context.locationIds} onToggle={(id) => setContext((current) => ({ ...current, locationIds: toggleId(current.locationIds, id) }))} /> : null}
      </div><footer><button type="button" onClick={() => setShowContext(false)}>Cancelar</button><button type="button" className="story-primary" disabled={operation !== null} onClick={() => void perform('context', () => storyGateway.replaceContext(chronicleId, selected.id, { expectedRevision: selected.revision, ...context })).then(() => setShowContext(false))}>Guardar relaciones</button></footer></div></div> : null}
    </section>
  )
}

function ContextGroup({ title, items, selected, onToggle }: { readonly title: string; readonly items: readonly { readonly id: string; readonly label: string }[]; readonly selected: readonly string[]; readonly onToggle: (id: string) => void }) {
  return <fieldset><legend>{title}</legend>{items.map((item) => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} /><span>{item.label}</span></label>)}{items.length === 0 ? <p>No hay elementos disponibles.</p> : null}</fieldset>
}

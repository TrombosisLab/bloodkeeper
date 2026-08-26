import { useEffect, useMemo, useState } from 'react'

import {
  ChronicleStoryApiError,
  createChronicleStoryGateway,
} from '../infrastructure/chronicle-story.api'
import type {
  ChronicleSharedStoryApiSnapshot,
  ChronicleStoryApiStatus,
  ChronicleStoryApiType,
  ChronicleStoryMilestoneApiKey,
} from '../types/chronicle-story-api.types'

import './chronicle-story-workspace.css'

const gateway = createChronicleStoryGateway()

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
}

function dateLabel(value: string | null): string {
  if (value === null) return 'Todavía no registrada'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date(value))
}

function errorMessage(error: unknown): string {
  if (error instanceof ChronicleStoryApiError) {
    if (error.code === 'CHRONICLE_STORY_PERMISSION_DENIED') {
      return 'Ya no tienes una participación activa en esta Crónica.'
    }
  }
  return 'No se pudieron cargar las Historias compartidas.'
}

export function ChronicleSharedStoryWorkspace({ chronicleId }: Props) {
  const [stories, setStories] = useState<readonly ChronicleSharedStoryApiSnapshot[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selected = stories.find((story) => story.id === selectedId) ?? null
  const filteredStories = useMemo(() => stories.filter((story) => {
    const titleMatches = story.title.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))
    return titleMatches && (statusFilter.length === 0 || story.status === statusFilter)
  }), [stories, search, statusFilter])

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(null)
    void gateway.listShared(chronicleId)
      .then((page) => {
        if (!current) return
        setStories(page.items)
        setSelectedId((previous) =>
          previous !== null && page.items.some((story) => story.id === previous)
            ? previous
            : page.items[0]?.id ?? null,
        )
      })
      .catch((loadError: unknown) => {
        if (current) setError(errorMessage(loadError))
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => { current = false }
  }, [chronicleId])

  return (
    <section className="story-workspace story-workspace--shared" aria-label="Historias compartidas de la Crónica">
      <aside className="story-browser">
        <header className="story-browser__header">
          <div><span>Crónica</span><h2>Historias</h2></div>
          <strong>{stories.length}</strong>
        </header>
        <div className="story-browser__filters">
          <label><span className="story-sr-only">Buscar historias</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar historias" /></label>
          <label><span className="story-sr-only">Filtrar por estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todos los estados</option><option value="planned">Planificadas</option><option value="active">En curso</option><option value="completed">Completadas</option><option value="archived">Archivadas</option></select></label>
        </div>
        <div className="story-browser__shared-notice">Solo aparecen los arcos que el Narrador ha compartido con la Crónica.</div>
        <div className="story-browser__list">
          {loading ? <p className="story-empty">Cargando historias…</p> : null}
          {!loading && error !== null ? <p className="story-empty" role="alert">{error}</p> : null}
          {!loading && error === null && filteredStories.length === 0 ? <p className="story-empty">No hay historias compartidas con estos filtros.</p> : null}
          {filteredStories.map((story) => <button key={story.id} type="button" className={story.id === selectedId ? 'story-card is-selected' : 'story-card'} onClick={() => setSelectedId(story.id)}><span><strong>{story.title}</strong><small>{typeLabels[story.type]}</small></span><span className="story-card__status">{statusLabels[story.status]}</span><span className="story-card__progress"><i style={{ width: `${story.progress.percentage}%` }} /></span><small>{story.progress.completed}/5 hitos</small></button>)}
        </div>
      </aside>

      <main className="story-detail">
        {selected === null ? <div className="story-detail__empty"><span>♜</span><h2>Historias de la Crónica</h2><p>Cuando el Narrador comparta un arco, podrás seguir aquí su progreso.</p></div> : <>
          <header className="story-detail__header"><div><span>Historia compartida</span><h2>{selected.title}</h2></div><span className="story-card__status">{statusLabels[selected.status]}</span></header>
          <section className="story-section story-shared-summary"><div className="story-section__heading"><div><span>Lo que sabe el grupo</span><h3>Resumen compartido</h3></div></div><p>{selected.sharedSummary ?? 'El Narrador todavía no ha publicado un resumen para esta Historia.'}</p></section>
          <section className="story-section story-milestones"><div className="story-section__heading"><div><span>Progreso narrativo</span><h3>Hitos de la historia</h3></div><strong>{selected.progress.percentage}%</strong></div><div className="story-milestones__track">{selected.milestones.map((milestone, index) => <div key={milestone.key} className={milestone.completed ? 'story-shared-milestone is-complete' : 'story-shared-milestone'}><span>{milestone.completed ? '✓' : index + 1}</span><strong>{milestoneLabels[milestone.key]}</strong><small>{milestone.completed ? 'Completado' : 'Pendiente'}</small></div>)}</div></section>
          <section className="story-section story-shared-lifecycle"><div className="story-section__heading"><div><span>Memoria del arco</span><h3>Estado narrativo</h3></div></div><div><article><small>Activación</small><strong>{dateLabel(selected.startedAt)}</strong></article><article><small>Cierre</small><strong>{dateLabel(selected.completedAt)}</strong></article></div></section>
        </>}
      </main>

      <aside className="story-sidebar">
        {selected === null ? <div className="story-sidebar__placeholder">Selecciona una historia para consultar su estado.</div> : <>
          <section className="story-side-card story-summary"><div className="story-side-card__heading"><span>◈</span><h3>Progreso</h3></div><div className="story-summary__metrics story-summary__metrics--shared"><div><strong>{selected.progress.completed}</strong><small>Hitos completados</small></div><div><strong>{selected.progress.total}</strong><small>Hitos totales</small></div><div><strong>{selected.progress.percentage}%</strong><small>Avance</small></div></div></section>
          <section className="story-side-card story-shared-privacy"><div className="story-side-card__heading"><span>◇</span><div><h3>Vista compartida</h3><small>Información para participantes</small></div></div><p>Esta vista contiene únicamente el resumen y el progreso que el Narrador ha decidido compartir.</p></section>
          <section className="story-side-card story-shared-state"><div className="story-side-card__heading"><span>♜</span><h3>Estado del arco</h3></div><dl><div><dt>Tipo</dt><dd>{typeLabels[selected.type]}</dd></div><div><dt>Estado</dt><dd>{statusLabels[selected.status]}</dd></div><div><dt>Inicio</dt><dd>{dateLabel(selected.startedAt)}</dd></div><div><dt>Final</dt><dd>{dateLabel(selected.completedAt)}</dd></div></dl></section>
        </>}
      </aside>
    </section>
  )
}

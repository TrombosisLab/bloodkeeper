import { useEffect, useMemo, useRef, useState } from 'react'

import { createChronicleGateway } from '../infrastructure/chronicle.api.ts'
import type { ChronicleSessionApiSnapshot } from '../types/chronicle-api.types.ts'

import './chronicle-shared-session-workspace.css'

// SESIONES_COMPARTIDAS_IMAGEN_Y_JERARQUIA_V1

const gateway = createChronicleGateway()

function title(session: ChronicleSessionApiSnapshot): string {
  if (session.title?.trim()) return session.title
  return session.sessionNumber === null ? 'Sesión sin título' : `Sesión ${session.sessionNumber}`
}

function date(value: string | null): string {
  if (value === null) return 'Sin fecha real'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

const status = {
  preparation: 'Preparación',
  completed: 'Completada',
  archived: 'Archivada',
} as const

function SessionArtwork({
  chronicleId,
  session,
  variant,
}: {
  readonly chronicleId: string
  readonly session: ChronicleSessionApiSnapshot
  readonly variant: 'thumbnail' | 'hero'
}) {
  const [unavailable, setUnavailable] = useState(false)
  const sessionTitle = title(session)
  const imageUrl = `/api/chronicles/${chronicleId}/assets/SESSION/${session.id}/image`

  return (
    <span className={`shared-session-workspace__artwork shared-session-workspace__artwork--${variant}${unavailable ? ' is-unavailable' : ''}`}>
      {unavailable ? (
        <span className="shared-session-workspace__artwork-fallback" aria-hidden="true">{session.sessionNumber ?? '◇'}</span>
      ) : (
        <img
          src={imageUrl}
          alt={`Imagen de ${sessionTitle}`}
          loading={variant === 'thumbnail' ? 'lazy' : 'eager'}
          decoding="async"
          onError={() => setUnavailable(true)}
        />
      )}
      {variant === 'thumbnail' ? <span className="shared-session-workspace__artwork-number" aria-hidden="true">{session.sessionNumber ?? '—'}</span> : null}
    </span>
  )
}

export function ChronicleSharedSessionWorkspace({ chronicleId }: { readonly chronicleId: string }) {
  const [sessions, setSessions] = useState<readonly ChronicleSessionApiSnapshot[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | ChronicleSessionApiSnapshot['status']>('all')
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const workspaceRef = useRef<HTMLElement>(null)
  const browserTitleRef = useRef<HTMLHeadingElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const previousMobileDetailOpen = useRef(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const items: ChronicleSessionApiSnapshot[] = []
      let offset: number | null = 0
      while (offset !== null) {
        const page = await gateway.sessions(chronicleId, { limit: 50, offset })
        items.push(...page.items)
        offset = page.nextOffset
      }
      setSessions(items)
      setSelectedId((current) => items.some((item) => item.id === current) ? current : items[0]?.id ?? null)
    } catch {
      setError('No se pudieron cargar las sesiones compartidas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMobileDetailOpen(false)
    void load()
  }, [chronicleId])

  useEffect(() => {
    if (!window.matchMedia('(max-width: 760px)').matches) return

    if (mobileDetailOpen) {
      workspaceRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      detailRef.current?.focus({ preventScroll: true })
    } else if (previousMobileDetailOpen.current) {
      workspaceRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      browserTitleRef.current?.focus({ preventScroll: true })
    }

    previousMobileDetailOpen.current = mobileDetailOpen
  }, [mobileDetailOpen])

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es-ES')
    return sessions.filter((session) => (
      (filter === 'all' || session.status === filter) &&
      (!term || `${title(session)} ${session.summary ?? ''}`.toLocaleLowerCase('es-ES').includes(term))
    ))
  }, [sessions, query, filter])

  useEffect(() => {
    if (selectedId !== null && !visible.some((item) => item.id === selectedId)) {
      setSelectedId(visible[0]?.id ?? null)
    }
  }, [visible, selectedId])

  const selected = visible.find((item) => item.id === selectedId) ?? null

  return <section ref={workspaceRef} className="shared-session-workspace" aria-labelledby="shared-session-title">
    <aside className={`shared-session-workspace__browser${mobileDetailOpen ? ' is-mobile-hidden' : ''}`}>
      <header><div><small>CRÓNICA</small><h2 id="shared-session-title" ref={browserTitleRef} tabIndex={-1}>Sesiones</h2></div><strong>{visible.length}</strong></header>
      <label className="shared-session-workspace__search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar sesiones" aria-label="Buscar sesiones" /></label>
      <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filtrar sesiones por estado">
        <option value="all">Todos los estados</option><option value="preparation">Preparación</option><option value="completed">Completadas</option><option value="archived">Archivadas</option>
      </select>
      {loading ? <p className="shared-session-workspace__empty">Cargando sesiones…</p> : error ? <div className="shared-session-workspace__error" role="alert"><p>{error}</p><button type="button" onClick={() => void load()}>Reintentar</button></div> : <ul>{visible.map((session) => <li key={session.id}><button type="button" className={selected?.id === session.id ? 'is-selected' : ''} onClick={() => { setSelectedId(session.id); setMobileDetailOpen(true) }}><SessionArtwork key={session.id} chronicleId={chronicleId} session={session} variant="thumbnail" /><div><small className="shared-session-workspace__session-number">SESIÓN {session.sessionNumber ?? '—'} · {date(session.realDate)}</small><strong>{title(session)}</strong></div><em>{status[session.status]}</em></button></li>)}</ul>}
    </aside>
    <main ref={detailRef} tabIndex={-1} className={`shared-session-workspace__detail${mobileDetailOpen ? '' : ' is-mobile-hidden'}`}>
      {selected === null ? <div className="shared-session-workspace__placeholder"><small>SESIÓN</small><h3>Selecciona una sesión</h3><p>Consulta la información compartida por el Narrador.</p></div> : <>
        <button type="button" className="shared-session-workspace__back" onClick={() => setMobileDetailOpen(false)}><span aria-hidden="true">←</span> Sesiones</button>
        <header className="shared-session-workspace__detail-header"><SessionArtwork key={selected.id} chronicleId={chronicleId} session={selected} variant="hero" /><div><small>{date(selected.realDate)}</small><h2>{title(selected)}</h2></div><span>{status[selected.status]}</span></header>
        <nav aria-label="Información disponible"><span className="is-active">Resumen</span></nav>
        <article><small>CONTEXTO COMPARTIDO</small><h3>Resumen narrativo</h3><p>{selected.summary ?? 'El Narrador todavía no ha publicado un resumen para esta sesión.'}</p></article>
        <section className="shared-session-workspace__privacy"><strong>Información protegida</strong><p>La preparación, las notas privadas y la gestión de asistencia permanecen reservadas al Narrador.</p></section>
      </>}
    </main>
  </section>
}

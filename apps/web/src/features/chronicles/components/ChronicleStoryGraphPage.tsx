import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useAuthenticatedUser } from '../../authentication/context/authentication.context'
import { buildStoryGraph } from '../domain/story-guide-graph'
import { routeGuideConnections } from '../domain/story-guide-routing'
import { loadStoryGraph } from '../infrastructure/story-guide-graph.api'
import './chronicle-story-graph.css'

type Loaded = Awaited<ReturnType<typeof loadStoryGraph>>
const typeLabels: Record<string, string> = { main_arc: 'Principal', secondary_arc: 'Secundaria', personal_arc: 'Arco personal' }
const stateLabels: Record<string, string> = { hidden: 'Secreto / pendiente', discovered: 'Descubierto', resolved: 'Resuelto' }
function lines(text: string, max = 27): string[] {
  const result: string[] = []; let line = ''
  for (const word of text.split(/\s+/)) { if ((line + ' ' + word).trim().length > max && line) { result.push(line); line = word } else line = (line + ' ' + word).trim() }
  if (line) result.push(line)
  return result
}
export function ChronicleStoryGraphPage() {
  const user = useAuthenticatedUser()
  const params = new URLSearchParams(window.location.search)
  const chronicleId = params.get('chronicleId') ?? '', initialStoryId = params.get('storyId') ?? ''
  const [loaded, setLoaded] = useState<Loaded | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(true)
  const [revision, setRevision] = useState(0), [rootStoryId, setRootStoryId] = useState(initialStoryId)
  const [selected, setSelected] = useState<string | null>(null), [edgeId, setEdgeId] = useState<string | null>(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const svg = useRef<SVGSVGElement>(null), drag = useRef<{ id: number; x: number; y: number; startX: number; startY: number; moved: boolean } | null>(null)
  const marker = useId().replace(/:/g, '')
  useEffect(() => {
    const controller = new AbortController()
    setLoaded(null); setSelected(null); setEdgeId(null); setBusy(true); setError('')
    if (document.visibilityState === 'hidden') return () => controller.abort()
    if (!chronicleId) { setError('Falta la crónica. Abre el mapa desde el guion.'); setBusy(false); return () => controller.abort() }
    const timeout = window.setTimeout(() => { controller.abort(); setBusy(false); setError('La consulta agotó el tiempo de espera. Pulsa Actualizar para reintentar.') }, 120000)
    void loadStoryGraph(chronicleId, user.id, controller.signal).then(data => {
      window.clearTimeout(timeout)
      if (!controller.signal.aborted) { setLoaded(data); setBusy(false) }
    }).catch(e => { window.clearTimeout(timeout); if (!controller.signal.aborted) { setError(e instanceof Error ? e.message : 'No se pudo cargar el mapa.'); setBusy(false) } })
    return () => { window.clearTimeout(timeout); controller.abort() }
  }, [chronicleId, user.id, revision])
  useEffect(() => {
    const visibility = () => {
      if (document.visibilityState === 'hidden') { setLoaded(null); setSelected(null); setEdgeId(null) }
      setRevision(n => n + 1)
    }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])
  const derived = useMemo(() => {
    if (!loaded) return null
    try {
      const graph = buildStoryGraph(loaded.stories, rootStoryId)
      const routes = routeGuideConnections(graph.nodes, graph.edges.map(e => ({ ...e, label: '' })))
      return { graph, routes }
    } catch { return null }
  }, [loaded, rootStoryId])
  const graph = derived?.graph, routes = derived?.routes
  const card = graph?.nodes.find(n => n.id === selected)
  const selectedEdge = graph?.edges.find(e => e.id === edgeId)
  function clear() { setSelected(null); setEdgeId(null) }
  function fit() {
    if (!graph || !svg.current) return
    const r = svg.current.getBoundingClientRect()
    const scale = Math.min((r.width - 40) / graph.width, (r.height - 40) / graph.height, 1)
    setView({ x: (r.width - graph.width * scale) / 2, y: (r.height - graph.height * scale) / 2, scale })
  }
  useEffect(() => { fit() }, [derived])
  useEffect(() => {
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [derived])
  function zoom(factor: number, x?: number, y?: number) {
    const r = svg.current?.getBoundingClientRect(); if (!r) return
    const cx = x ?? r.width / 2, cy = y ?? r.height / 2
    setView(v => { const scale = Math.max(0.015, Math.min(3, v.scale * factor)); return { scale, x: cx - (cx - v.x) * scale / v.scale, y: cy - (cy - v.y) * scale / v.scale } })
  }
  function focusNode(id: string) {
    const node = graph?.nodes.find(n => n.id === id), r = svg.current?.getBoundingClientRect()
    setSelected(id); setEdgeId(null)
    if (node && r) setView(v => { const scale = Math.max(v.scale, 0.65); return { scale, x: r.width / 2 - (node.x + node.width / 2) * scale, y: r.height / 2 - (node.y + node.height / 2) * scale } })
  }
  function start(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || (event.target as Element).closest('[data-node], [data-edge]')) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: view.x, startY: view.y, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const d = drag.current; if (!d || d.id !== event.pointerId) return
    if (Math.hypot(event.clientX - d.x, event.clientY - d.y) > 5) d.moved = true
    setView(v => ({ ...v, x: d.startX + event.clientX - d.x, y: d.startY + event.clientY - d.y }))
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    const d = drag.current
    if (d?.id === event.pointerId) { if (!d.moved) clear(); drag.current = null }
  }
  const incoming = graph?.edges.filter(e => e.to === selected) ?? [], outgoing = graph?.edges.filter(e => e.from === selected) ?? []
  const nodeTitle = (id: string) => graph?.nodes.find(n => n.id === id)?.title ?? 'Destino no disponible'
  return <main className="story-graph-page">
    <header className="story-graph-page__header">
      <div><h1>Mapa completo del guion</h1><p>{loaded?.chronicle.name ?? 'Vista privada del narrador'} · Solo consulta · Versión guardada</p></div>
      <div className="story-graph-page__controls">
        <button type="button" disabled={busy} onClick={() => setRevision(n => n + 1)}>Actualizar</button>
        <button type="button" onClick={() => zoom(1 / 1.3)} aria-label="Alejar">−</button><span>{Math.round(view.scale * 100)}%</span><button type="button" onClick={() => zoom(1.3)} aria-label="Acercar">+</button>
        <button type="button" onClick={() => { fit(); clear() }}>Encajar todo</button>
        <button type="button" onClick={clear}>Ver todas las conexiones</button>
        <button type="button" onClick={() => window.close()}>Cerrar pestaña</button>
      </div>
    </header>
    {busy ? <p role="status">Consultando permisos y guiones guardados…</p> : error ? <p role="alert">{error}</p> : loaded && !derived ? <p role="alert">No se pudo representar el guion. No se muestra una vista parcial.</p> : null}
    {graph && <><div className="story-graph-page__toolbar">
      <label>Historia de partida <select value={graph.bubbles.some(b => b.id === rootStoryId) ? rootStoryId : graph.bubbles[0]?.id ?? ''} onChange={e => { setRootStoryId(e.target.value); clear() }}>{graph.bubbles.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select></label>
      <span>{graph.nodes.filter(n => !n.entry).length} tarjetas · {graph.bubbles.length} historias · {graph.edges.filter(e => e.cross).length} enlaces entre historias</span>
    </div>
    {graph.warnings.length > 0 && <details className="story-graph-page__warnings"><summary>{graph.warnings.length} referencias no disponibles</summary><ul>{graph.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}
    {!graph.bubbles.length ? <p>No hay historias guardadas en esta crónica.</p> : <div className="story-graph-page__body">
      <svg ref={svg} className="story-graph-page__canvas" role="img" aria-label="Tarjetas y conexiones reales de todos los guiones" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { drag.current = null }} onWheel={e => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top) }}>
        <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#c1d0db" /></marker><marker id={marker + '-cross'} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#e2bd7b" /></marker></defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {graph.bubbles.map(b => <g key={b.id}><rect className={`story-graph-page__bubble story-graph-page__bubble--${b.type}`} x={b.x} y={b.y} width={b.width} height={b.height} rx="28" /><text className="story-graph-page__bubble-title" x={b.x + 24} y={b.y + 28}>{b.title.length > 50 ? b.title.slice(0, 47) + '…' : b.title} · {typeLabels[b.type]} · {b.count} tarjetas<title>{b.title}</title></text></g>)}
          {graph.edges.map(e => { const route = routes?.get(e.id); if (!route) return null; const highlighted = selected ? e.from === selected || e.to === selected : edgeId === e.id; const dim = (selected !== null || edgeId !== null) && !highlighted
            return <g key={e.id} data-edge={e.id} className={`${dim ? 'story-graph-page__dim' : ''} ${highlighted ? 'story-graph-page__highlight' : ''}`}>
              <path className={`story-graph-page__edge ${e.cross ? 'story-graph-page__edge--cross' : ''}`} d={route.path} markerEnd={`url(#${marker}${e.cross ? '-cross' : ''})`} />
              <path className="story-graph-page__edge-hit" d={route.path} onClick={() => { setSelected(null); setEdgeId(e.id) }}><title>{nodeTitle(e.from)} → {nodeTitle(e.to)}: {e.label || 'Sin significado registrado'}</title></path>
            </g> })}
          {graph.nodes.map(n => <g key={n.id} data-node={n.id} role="button" tabIndex={0} aria-label={n.title} className={`story-graph-page__node ${n.entry ? 'story-graph-page__entry' : ''} ${selected === n.id ? 'story-graph-page__selected' : ''}`} transform={`translate(${n.x} ${n.y})`} onClick={() => { setSelected(n.id); setEdgeId(null) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(n.id); setEdgeId(null) } }}>
            <rect width={n.width} height={n.height} rx="9" />
            <text className="story-graph-page__node-kind" x="12" y="19">{n.entry ? 'Entrada de historia · No es una tarjeta' : stateLabels[n.card!.state]}</text>
            {lines(n.title).slice(0, 3).map((line, i) => <text key={i} x="12" y={43 + i * 19}>{line}</text>)}
            <title>{n.title}</title>
          </g>)}
        </g>
      </svg>
      {(card || selectedEdge) && <aside className="story-graph-page__inspector">
        <button type="button" onClick={clear}>Quitar selección</button>
        {card ? <><h2>{card.title}</h2><p>{graph.bubbles.find(b => b.id === card.storyId)?.title}</p>{card.entry ? <p>Entrada de la historia. No presupone una tarjeta de destino ni añade conexiones internas.</p> : <><h3>Descripción</h3><p>{card.card?.summary || 'Sin texto registrado.'}</p><h3>Nota privada</h3><p>{card.card?.narratorNote || 'Sin texto registrado.'}</p></>}
          <h3>Entradas ({incoming.length})</h3>{incoming.map(e => <button type="button" key={e.id} onClick={() => focusNode(e.from)}>{nodeTitle(e.from)} · {e.label || 'Sin significado'}</button>)}
          <h3>Salidas ({outgoing.length})</h3>{outgoing.map(e => <button type="button" key={e.id} onClick={() => focusNode(e.to)}>{nodeTitle(e.to)} · {e.label || 'Sin significado'}</button>)}
        </> : selectedEdge && <><h2>Conexión</h2><p>{nodeTitle(selectedEdge.from)} → {nodeTitle(selectedEdge.to)}</p><p>{selectedEdge.label || 'Sin significado registrado.'}</p></>}
      </aside>}
    </div>}
    <footer>Gris: dentro de la historia · Oro: entre historias. Pulsa el fondo para recuperar todas las conexiones. Arrastra para desplazarte. No se modifica ningún guion.</footer></>}
  </main>
}

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { backdropFingerprint, backdropId, emptyBackdrop, moveBackdropGroup, removeBackdropGroup, removeBackdropNote, statusLabels, timeLabels } from '../domain/chronicle-backdrop'
import type { BackdropGroup, BackdropNote, BackdropSnapshot, BackdropState, ReferenceOption } from '../domain/chronicle-backdrop'
import { BackdropApiError, loadBackdrop, loadBackdropReferences, saveBackdrop } from '../infrastructure/chronicle-backdrop.api'
import { routeGuideConnections } from '../domain/story-guide-routing'
import { ancestry, descendants, layerBounds, projectLayers, reparentLayer, upgradeBackdrop, wrapLayer } from '../domain/backdrop-layers'
import { BackdropReferences } from './BackdropReferences'
import { bubbleLines, projectBubbles } from '../domain/backdrop-bubbles'
import { BackdropBubbleLabel } from './BackdropBubbleLabel'
import './chronicle-backdrop.css'

export function ChronicleBackdropWorkspace({ chronicleId, initialStoryId = '', onDirtyChange }: { chronicleId: string; initialStoryId?: string; onDirtyChange?: (dirty: boolean) => void }) {
  const [state, setState] = useState<BackdropState>(emptyBackdrop)
  const [saved, setSaved] = useState<BackdropSnapshot | null>(null)
  const [options, setOptions] = useState<ReferenceOption[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [denied, setDenied] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [view, setView] = useState({ x: 30, y: 30, scale: .85 })
  const [automatic, setAutomatic] = useState(true)
  const [scope, setScope] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number } | null>(null)
  const [bundleIds, setBundleIds] = useState<string[]>([])
  const [filter, setFilter] = useState('')
  useEffect(() => { setFilter(initialStoryId) }, [initialStoryId])
  const [connectFrom, setConnectFrom] = useState('')
  const [connectTo, setConnectTo] = useState('')
  const [connectLabel, setConnectLabel] = useState('')
  const [connectTentative, setConnectTentative] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  const canvas = useRef<SVGSVGElement>(null)
  const abort = useRef<AbortController | null>(null)
  const marker = 'backdrop-' + useId().replace(/:/g, '')
  const dirty = saved !== null && backdropFingerprint(saved.state) !== backdropFingerprint(state)
  const drag = useRef<{ pointer: number; x: number; y: number; base: BackdropState; view: typeof view; note?: string; group?: string; moved: boolean } | null>(null)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    const navigation = (e: MouseEvent) => {
      if (!dirty || !(e.target instanceof Element)) return
      const control = e.target.closest('button, a[href]')
      if (!control || control.closest('.chronicle-detail') || control.closest('.chronicle-backdrop')) return
      if (control instanceof HTMLAnchorElement && control.target === '_blank') return
      if (!window.confirm('Hay cambios sin guardar en Trasfondo y tramas. ¿Continuar y descartarlos?')) { e.preventDefault(); e.stopImmediatePropagation() }
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', navigation, true)
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigation, true) }
  }, [dirty])
  useEffect(() => {
    const controller = new AbortController(); abort.current = controller
    setBusy(true); setError(''); setDenied(false); setSaved(null); setScope(''); setState(emptyBackdrop()); setOptions([]); setSelected(null); setSelectedGroup(null); setSelectedLink(null)
    void Promise.all([loadBackdrop(chronicleId, controller.signal), loadBackdropReferences(chronicleId, controller.signal)]).then(([snapshot, refs]) => {
      if (controller.signal.aborted) return
      const upgraded = upgradeBackdrop(snapshot.state)
      setState(upgraded); setSaved({ ...snapshot, state: upgraded }); setOptions(refs.items)
    }).catch(e => { if (!controller.signal.aborted) { setError(e.message); setDenied(e instanceof BackdropApiError && (e.status === 401 || e.status === 403)) } }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [chronicleId, generation])
  const note = state.notes.find(n => n.id === selected)
  const group = state.groups.find(g => g.id === selectedGroup)
  const link = state.links.find(l => l.id === selectedLink)
  const projection = useMemo(() => automatic ? projectBubbles(state, view.scale, filter, scope) : projectLayers(state, view.scale, false, filter), [state, view.scale, automatic, filter, scope])
  const visibleNotes = projection.notes
  const visibleLinks = projection.links
  const bounds = useMemo(() => layerBounds(state), [state])
  const routeKey = JSON.stringify([projection.boxes, projection.links.map(l => ({ id: l.id, from: l.from, to: l.to, label: l.label }))])
  const routes = useMemo(() => routeGuideConnections(projection.boxes, projection.links), [routeKey])
  const path = ancestry(state, group?.id ?? note?.groupId ?? null)
  const focusedIds = group ? descendants(state, group.id) : new Set<string>()
  if (group) state.notes.forEach(n => { if (n.groupId && focusedIds.has(n.groupId)) focusedIds.add(n.id) })
  if (note) focusedIds.add(note.id)
  useEffect(() => {
    if (!focusRequest) return
    const box = canvas.current?.getBoundingClientRect(), target = automatic ? projectBubbles(state, .01, filter, focusRequest.id).layers.find(g => g.id === focusRequest.id) : layerBounds(state).get(focusRequest.id)
    if (!box || !target || box.width <= 0 || box.height <= 0) return
    const scale = automatic ? 1.18 : Math.max(.03, Math.min(2.5, Math.max(Math.min((box.width - 70) / target.width, (box.height - 70) / target.height), 380 / target.width, 230 / target.height)))
    setView({ scale, x: box.width / 2 - (target.x + target.width / 2) * scale, y: box.height / 2 - (target.y + target.height / 2) * scale })
  }, [focusRequest])
  useEffect(() => {
    if (!fullscreen) return
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [fullscreen])
  function choose(kind: 'note' | 'group' | 'link', id: string) { setBundleIds([]); setSelected(kind === 'note' ? id : null); setSelectedGroup(kind === 'group' ? id : null); setSelectedLink(kind === 'link' ? id : null) }
  function clear() { setSelected(null); setSelectedGroup(null); setSelectedLink(null); setBundleIds([]) }
  function enterLayer(id: string) { choose('group', id); if (automatic) setScope(id); setFocusRequest({ id, nonce: Date.now() }) }
  const endpointTitle = (id: string) => state.notes.find(n => n.id === id)?.title ?? state.groups.find(g => g.id === id)?.title ?? 'Elemento no disponible'
  function patchNote(p: Partial<BackdropNote>) { if (note && !busy) setState(s => ({ ...s, notes: s.notes.map(n => n.id === note.id ? { ...n, ...p } : n) })) }
  function patchGroup(p: Partial<BackdropGroup>) { if (group && !busy) setState(s => ({ ...s, groups: s.groups.map(g => g.id === group.id ? { ...g, ...p } : g) })) }
  function origin() { return { x: Math.max(-19000, Math.min(19000, (60 - view.x) / view.scale)), y: Math.max(-19000, Math.min(19000, (60 - view.y) / view.scale)) } }
  function addNote() {
    if (state.notes.length >= 200) { setError('Máximo 200 notas por pizarra.'); return }
    const id = backdropId()
    const targetGroupId = group?.id ?? note?.groupId ?? null
    const targetBox = targetGroupId ? bounds.get(targetGroupId) : undefined
    const start = targetBox ? { x: targetBox.x + 40, y: targetBox.y + 110 } : origin()
    let p = start
    const width = canvas.current?.getBoundingClientRect().width ?? 900
    const columns = Math.max(1, Math.floor(width / view.scale / 300))
    for (let i = 0; i < 250; i++) {
      const candidate = { x: start.x + (i % columns) * 300, y: start.y + Math.floor(i / columns) * 180 }
      if (candidate.x > 20000 || candidate.y > 20000) continue
      const obstacles = [...state.notes.map(n => ({ ...n, width: 280, height: 160 })), ...state.groups.filter(g => (g.parentId ?? null) === targetGroupId).map(g => bounds.get(g.id)!)]
      if (!obstacles.some(n => candidate.x < n.x + n.width && candidate.x + 280 > n.x && candidate.y < n.y + n.height && candidate.y + 160 > n.y)) { p = candidate; break }
    }
    setState(s => ({ ...s, notes: [...s.notes, { id, title: 'Nueva idea', text: '', status: 'idea', time: 'unspecified', knownBy: '', ...p, groupId: targetGroupId, references: [] }] })); choose('note', id)
  }
  function addGroup(parentId: string | null = null) {
    if (state.groups.length >= 60) { setError('Máximo 60 grupos.'); return }
    const id = backdropId()
    const parent = parentId ? bounds.get(parentId) : undefined
    let position = parent ? { x: Math.min(19500, parent.x + 40), y: Math.min(19500, parent.y + 110) } : origin()
    const start = position
    const obstacles = [...state.notes.filter(n => n.groupId === parentId).map(n => ({ ...n, width: 260, height: 140 })), ...state.groups.filter(g => (g.parentId ?? null) === parentId).map(g => bounds.get(g.id)!)]
    for (let i = 0; i < 80; i++) {
      const candidate = { x: start.x, y: start.y + i * 520 }
      if (candidate.y > 19500) break
      if (!obstacles.some(n => candidate.x < n.x + n.width + 24 && candidate.x + 664 > n.x && candidate.y < n.y + n.height + 24 && candidate.y + 484 > n.y)) { position = candidate; break }
    }
    setState(s => ({ ...s, version: 2, groups: [...s.groups, { id, title: 'Nueva capa', ...position, width: 640, height: 460, parentId, summary: '', references: [] }] })); choose('group', id)
  }
  function addContext() {
    if (!group || state.groups.length >= 60) return
    const id = backdropId()
    setState(s => wrapLayer(s, group.id, id)); choose('group', id)
  }
  function pointerStart(e: ReactPointerEvent<SVGSVGElement>) {
    if (busy || !saved || e.button !== 0 || drag.current) return
    const target = e.target as Element
    const noteId = target.closest('[data-note]')?.getAttribute('data-note') ?? undefined
    const groupId = target.closest('[data-group-handle]')?.getAttribute('data-group-handle') ?? undefined
    if (target.closest('[data-link]')) return
    if (noteId) choose('note', noteId); else if (groupId) choose('group', groupId)
    drag.current = { pointer: e.pointerId, x: e.clientX, y: e.clientY, base: state, view, note: noteId, group: groupId, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function pointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current; if (!d || d.pointer !== e.pointerId) return
    const px = e.clientX - d.x, py = e.clientY - d.y
    if (Math.hypot(px, py) < 4 && !d.moved) return
    d.moved = true
    if (automatic) { setView({ ...d.view, x: d.view.x + px, y: d.view.y + py }); return }
    let dx = px / d.view.scale, dy = py / d.view.scale
    if (d.note) {
      const n = d.base.notes.find(n => n.id === d.note)!
      setState({ ...d.base, notes: d.base.notes.map(item => item.id === d.note ? { ...item, x: Math.max(-20000, Math.min(20000, n.x + dx)), y: Math.max(-20000, Math.min(20000, n.y + dy)) } : item) })
    } else if (d.group) {
      const subtree = descendants(d.base, d.group)
      const moved = [...d.base.groups.filter(g => subtree.has(g.id)), ...d.base.notes.filter(n => n.groupId && subtree.has(n.groupId))]
      dx = Math.max(-20000 - Math.min(...moved.map(n => n.x)), Math.min(20000 - Math.max(...moved.map(n => n.x)), dx))
      dy = Math.max(-20000 - Math.min(...moved.map(n => n.y)), Math.min(20000 - Math.max(...moved.map(n => n.y)), dy))
      setState(moveBackdropGroup(d.base, d.group, dx, dy))
    } else setView({ ...d.view, x: d.view.x + px, y: d.view.y + py })
  }
  function pointerEnd(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current
    if (d && !d.moved && !d.note && !d.group) clear()
    drag.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }
  function zoom(factor: number, anchor?: { x: number; y: number }) {
    const box = canvas.current?.getBoundingClientRect(); if (!box) return
    const x = anchor?.x ?? box.width / 2, y = anchor?.y ?? box.height / 2
    setView(v => { const scale = Math.max(.03, Math.min(1000000, v.scale * factor)), ratio = scale / v.scale; return { scale, x: x - (x - v.x) * ratio, y: y - (y - v.y) * ratio } })
  }
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    // React delegates wheel events passively: cancellation must be registered
    // directly on the canvas, never on the document or the whole workspace.
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.deltaY === 0) return
      const rect = element.getBoundingClientRect()
      zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1, { x: event.clientX - rect.left, y: event.clientY - rect.top })
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [saved !== null, denied])
  function fit() {
    const box = canvas.current?.getBoundingClientRect(); if (!box) return
    if (automatic) setScope('')
    const overview = automatic ? projectBubbles(state, .01, filter) : projection
    const items = [...overview.notes.map(n => ({ ...n, width: n.displayWidth ?? 260, height: n.displayHeight ?? 140 })), ...overview.layers]
    if (!items.length) { setView({ x: 30, y: 30, scale: .85 }); return }
    const x = Math.min(...items.map(n => n.x)) - 40, y = Math.min(...items.map(n => n.y)) - 40
    const w = Math.max(...items.map(n => n.x + n.width)) - x + 40, h = Math.max(...items.map(n => n.y + n.height)) - y + 40
    const scale = Math.max(automatic ? .35 : .03, Math.min(automatic ? .8 : 1, box.width / w, box.height / h))
    setView({ scale, x: (box.width - w * scale) / 2 - x * scale, y: (box.height - h * scale) / 2 - y * scale })
  }
  useEffect(() => { if (saved && automatic) fit() }, [saved !== null, generation, automatic])
  async function save() {
    if (new TextEncoder().encode(JSON.stringify(state)).length > 80000) { setError('La pizarra supera 80 kB. Reduce texto o vincula recursos en lugar de copiar sus fichas.'); return }
    setBusy(true); setError('')
    const controller = new AbortController(); abort.current?.abort(); abort.current = controller
    try {
      const result = await saveBackdrop(chronicleId, state, saved!.revision, controller.signal)
      if (!controller.signal.aborted) { setState(result.state); setSaved(result) }
    }
    catch (e) { if (!controller.signal.aborted) { setError((e as Error).message); if (e instanceof BackdropApiError && (e.status === 401 || e.status === 403)) { setState(emptyBackdrop()); setSaved(null); setOptions([]); setDenied(true) } } }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  function downloadDraft() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ private: true, chronicleId, ...state }, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'PRIVADO-trasfondo-borrador.json'; a.click(); URL.revokeObjectURL(url)
  }
  const short = (text: string, max: number) => text.length > max ? text.slice(0, max - 1) + '…' : text
  return <section className={`chronicle-backdrop ${fullscreen ? 'is-fullscreen' : ''}`} aria-label="Trasfondo y tramas">
    <header><div><h2>Trasfondo y tramas</h2><p>Solo Narrador · Ideas, atmósfera, secretos y planes. Nada se publica a jugadores.</p></div>
      <div className="chronicle-backdrop__controls">
        <button type="button" disabled={busy || !saved} onClick={addNote}>＋ Nota</button>
        <button type="button" disabled={busy || !saved} onClick={() => addGroup()}>＋ Capa</button>
        <button type="button" disabled={busy || !saved} onClick={() => setShowConnect(v => !v)}>Conectar</button>
        <button type="button" disabled={busy || !dirty} onClick={() => void save()}>{busy ? 'Procesando…' : 'Guardar pizarra'}</button>
        <button type="button" disabled={busy} onClick={() => { if (!dirty || window.confirm('Se descartará el borrador sin guardar. ¿Recargar la versión guardada?')) setGeneration(g => g + 1) }}>Recargar</button>
        <button type="button" onClick={() => setFullscreen(v => !v)}>{fullscreen ? 'Volver a la crónica' : 'Ampliar pizarra'}</button>
      </div>
    </header>
    <div className="chronicle-backdrop__bar"><span role="status">{dirty ? 'Cambios sin guardar' : saved ? 'Versión guardada' : busy ? 'Cargando…' : 'Sin cargar'}</span>
      <label>Centrar en historia <select value={filter} onChange={e => { setFilter(e.target.value); clear() }}><option value="">Toda la crónica</option>{options.filter(r => r.kind === 'story').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
      <button type="button" onClick={() => zoom(1 / 1.2)} aria-label="Alejar pizarra">−</button><span>{Math.round(view.scale * 100)} %</span><button type="button" onClick={() => zoom(1.2)} aria-label="Acercar pizarra">＋</button><button type="button" onClick={fit}>Encajar</button>
      {saved && <button type="button" onClick={downloadDraft}>Descargar borrador privado</button>}
      <label className="chronicle-backdrop__toggle"><input type="checkbox" checked={automatic} onChange={e => { setAutomatic(e.target.checked); setScope(''); setView({ x: 30, y: 30, scale: .6 }) }} />Detalle automático con zoom</label>
      <label>Ir a capa<select aria-label="Ir a capa" value="" onChange={e => { if (e.target.value) enterLayer(e.target.value) }}><option value="">Selecciona una capa</option>{state.groups.map(g => <option key={g.id} value={g.id}>{ancestry(state, g.id).map(g => g.title).join(' › ')}</option>)}</select></label>
    </div>
    {path.length > 0 && <nav className="chronicle-backdrop__breadcrumbs" aria-label="Contexto de la selección"><button type="button" onClick={() => { clear(); fit() }}>Crónica</button>{path.map(g => <button type="button" key={g.id} onClick={() => enterLayer(g.id)}>› {g.title}</button>)}</nav>}
    {error && <p role="alert">{error}</p>}
    {showConnect && saved && <form className="chronicle-backdrop__connect" onSubmit={e => {
      e.preventDefault()
      if (!connectFrom || !connectTo || connectFrom === connectTo || state.links.length >= 400) { setError('Elige dos elementos diferentes. Máximo 400 conexiones.'); return }
      const id = backdropId()
      setState(s => ({ ...s, links: [...s.links, { id, from: connectFrom, to: connectTo, label: connectLabel.trim(), tentative: connectTentative }] })); choose('link', id); setShowConnect(false); setError('')
    }}>
      <label>Desde<select required value={connectFrom} onChange={e => setConnectFrom(e.target.value)}><option value="">Elige un elemento</option>{[...state.groups, ...state.notes].map(n => <option key={n.id} value={n.id}>{state.groups.some(g => g.id === n.id) ? 'Capa · ' : 'Nota · '}{n.title}</option>)}</select></label>
      <label>Hacia<select required value={connectTo} onChange={e => setConnectTo(e.target.value)}><option value="">Elige un elemento</option>{[...state.groups, ...state.notes].map(n => <option key={n.id} value={n.id}>{state.groups.some(g => g.id === n.id) ? 'Capa · ' : 'Nota · '}{n.title}</option>)}</select></label>
      <label>Significado<input maxLength={160} value={connectLabel} onChange={e => setConnectLabel(e.target.value)} placeholder="Manipula, provoca, desconoce…" /></label>
      <label><input type="checkbox" checked={connectTentative} onChange={e => setConnectTentative(e.target.checked)} />Relación por decidir</label><button disabled={busy}>Añadir conexión</button>
    </form>}
    {!denied && saved && <div className="chronicle-backdrop__body">
      <div className="chronicle-backdrop__surface">{visibleNotes.length === 0 && projection.layers.length === 0 && <div className="chronicle-backdrop__empty">{filter ? <>No hay elementos vinculados a esta historia.<br />Selecciona Toda la crónica para ver el conjunto.</> : <>Tu mapa narrativo privado.<br />Empieza con una nota o una capa. Podrás añadir contextos superiores después.</>}</div>}
        <svg ref={canvas} aria-label="Pizarra privada de trasfondo" onPointerDown={pointerStart} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={() => { drag.current = null }}>
          <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#b9c9d4" /></marker></defs>
          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
            {projection.layers.map(g => <g key={g.id} data-layer={g.id} data-depth={g.depth % 3} data-expanded={g.expanded} className={`chronicle-backdrop__layer ${g.expanded ? 'is-expanded' : 'is-collapsed'} ${selectedGroup === g.id ? 'is-selected' : ''}`}>
              <rect className="chronicle-backdrop__group" x={g.x} y={g.y} width={g.width} height={g.height} rx={g.expanded ? Math.min(22, g.height * .06) : Math.min(g.width, g.height) * .28} />
              <g data-group-handle={g.id} role="button" tabIndex={0} aria-label={'Capa: ' + g.group.title} onDoubleClick={() => enterLayer(g.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose('group', g.id) } }}>
                <rect className="chronicle-backdrop__group-handle" x={g.x} y={g.y} width={g.width} height={g.expanded ? (automatic ? g.height * .23 : Math.max(48, 28 / view.scale)) : g.height} rx={g.expanded ? 12 : Math.min(g.width, g.height) * .28} />
                {(() => {
                  if (automatic && !g.expanded) return <g transform={`translate(${g.x} ${g.y})`}><BackdropBubbleLabel title={'▸ ' + g.group.title} summary={g.group.summary ?? ''} metadata={g.noteCount + ' notas · ' + g.layerCount + ' capas internas'} width={g.width} height={g.height} scale={view.scale} /></g>
                  const pixels = g.width * view.scale, height = g.height * view.scale
                  if (pixels < 95 || height < 65) return null
                  const title = bubbleLines(g.group.title, pixels - 48, g.expanded ? 2 : 4)
                  const summaryLines = Math.min(4, Math.floor((height - 88 - title.length * 18) / 18))
                  const summary = !g.expanded && summaryLines > 0 ? bubbleLines(g.group.summary ?? '', pixels - 48, summaryLines, 12) : []
                  return <g pointerEvents="none"><text style={{ fontSize: 14 / view.scale }} x={g.x + 24 / view.scale} y={g.y + 29 / view.scale}>{title.map((line, i) => <tspan key={i} x={g.x + 24 / view.scale} dy={i ? 18 / view.scale : 0}>{i === 0 ? (g.expanded ? '▾ ' : '▸ ') : ''}{line}</tspan>)}</text>
                    {height > 110 && <text style={{ fontSize: 11 / view.scale }} className="chronicle-backdrop__meta" x={g.x + 24 / view.scale} y={g.y + (40 + title.length * 18) / view.scale}>{g.noteCount} notas · {g.layerCount} capas internas</text>}
                    {summary.length > 0 && <text style={{ fontSize: 12 / view.scale }} x={g.x + 24 / view.scale} y={g.y + (68 + title.length * 18) / view.scale}>{summary.map((line, i) => <tspan key={i} x={g.x + 24 / view.scale} dy={i ? 18 / view.scale : 0}>{line}</tspan>)}</text>}
                  </g>
                })()}
                <title>{g.group.title + '\n' + (g.group.summary ?? '')}</title>
              </g>
              {g.expanded && (() => {
                const story = g.group.references?.map(r => options.find(o => o.kind === 'story' && r.kind === 'story' && o.id === r.id)).find(Boolean)
                return !automatic && view.scale >= .7 && story?.milestones && <g aria-label="Hitos vinculados de solo consulta">{story.milestones.map((m, i) => <text key={i} className="chronicle-backdrop__meta" x={g.x + 20 + i * Math.min(115, (g.width - 40) / 5)} y={g.y + 82}>{m.completed ? '✓' : '○'} {short(m.label, 13)}</text>)}</g>
              })()}
            </g>)}
            {visibleLinks.map(l => { const route = routes.get(l.id); if (!route) return null; const show = () => { if (l.originals.length === 1) choose('link', l.originals[0].id); else { clear(); setBundleIds(l.originals.map(link => link.id)) } }; return <g key={l.id} data-link={l.id} className={focusedIds.size > 0 && !l.originals.some(link => focusedIds.has(link.from) || focusedIds.has(link.to)) ? 'chronicle-backdrop__dim' : ''}>
              <path className="chronicle-backdrop__line" d={route.path} strokeDasharray={l.tentative ? '7 5' : undefined} markerEnd={`url(#${marker})`} />
              <path className="chronicle-backdrop__line-hit" d={route.path} onClick={show}><title>{l.originals.map(link => endpointTitle(link.from) + ' → ' + endpointTitle(link.to) + ': ' + link.label).join('\n')}</title></path>
              {route.labelLines.map((line, i) => <text className="chronicle-backdrop__edge-label" key={i} x={route.labelX} y={route.labelY + i * 16} textAnchor="middle" onClick={show}>{line}</text>)}
            </g> })}
            {visibleNotes.map(n => <g key={n.id} data-note={n.id} role="button" tabIndex={0} aria-label={n.title} transform={`translate(${n.x} ${n.y})`} className={`chronicle-backdrop__note chronicle-backdrop__note--${n.status} ${selected === n.id ? 'is-selected' : ''}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose('note', n.id) } }}>
              {automatic ? (() => {
                const width = n.displayWidth!, height = n.displayHeight!
                return <><rect width={width} height={height} rx={Math.min(width, height) * .2} /><BackdropBubbleLabel title={n.title} summary={n.text} metadata={statusLabels[n.status] + ' · ' + timeLabels[n.time]} width={width} height={height} scale={view.scale} /></>
              })() : <><rect width={260} height={140} rx={12} /><circle cx={17} cy={20} r={5} /><text className="chronicle-backdrop__status" x={29} y={24}>{statusLabels[n.status]}</text>
              <text className="chronicle-backdrop__title" x={14} y={52}>{short(n.title, 30)}</text>{view.scale >= .6 && <><text x={14} y={78}>{short(n.text.replace(/\s+/g, ' '), 35)}</text>
              <text className="chronicle-backdrop__meta" x={14} y={117}>{timeLabels[n.time]} · {n.references.length} referencias</text></>}</>}<title>{n.title + '\n' + n.text}</title>
            </g>)}
          </g>
        </svg>
      </div>
      {(note || group || link || bundleIds.length > 0) && <aside className="chronicle-backdrop__inspector">
        {(note || group || link) ? <button type="button" onClick={clear}>Quitar selección</button> : <p>Selecciona una nota para editarla. Arrastra notas o el título de un grupo. Arrastra el fondo para desplazarte.</p>}
        {note && <fieldset disabled={busy}><legend>Nota</legend>
          <label>Título<input maxLength={120} value={note.title} onChange={e => patchNote({ title: e.target.value })} /></label>
          <label>Contexto<textarea rows={6} maxLength={8000} value={note.text} onChange={e => patchNote({ text: e.target.value })} /></label>
          <label>Estado<select value={note.status} onChange={e => patchNote({ status: e.target.value as BackdropNote['status'] })}>{Object.entries(statusLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          <label>Momento<select value={note.time} onChange={e => patchNote({ time: e.target.value as BackdropNote['time'] })}>{Object.entries(timeLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          <label>Quién lo sabe en la ficción<textarea rows={2} maxLength={1000} value={note.knownBy} onChange={e => patchNote({ knownBy: e.target.value })} placeholder="Juan y Torres; Antonio lo desconoce…" /></label><small>Este campo no concede acceso ni publica la nota.</small>
          <label>Capa de la nota<select aria-label="Capa de la nota" value={note.groupId ?? ''} onChange={e => patchNote({ groupId: e.target.value || null })}><option value="">Nota libre</option>{state.groups.map(g => <option key={g.id} value={g.id}>{ancestry(state, g.id).map(parent => parent.title).join(' › ')}</option>)}</select></label>
          <div className="chronicle-backdrop__coordinates">{(['x', 'y'] as const).map(axis => <label key={axis}>{axis.toUpperCase()}<input type="number" min={-20000} max={20000} value={note[axis]} onChange={e => { const v = Number(e.target.value); if (Number.isFinite(v) && Math.abs(v) <= 20000) patchNote({ [axis]: v }) }} /></label>)}</div>
          <BackdropReferences references={note.references} options={options} onChange={references => patchNote({ references })} disabled={busy} />
          <button type="button" onClick={() => { if (window.confirm('¿Eliminar esta nota y sus conexiones del borrador? Puedes recuperarla recargando antes de guardar.')) { setState(s => removeBackdropNote(s, note.id)); clear() } }}>Eliminar nota</button>
        </fieldset>}
        {group && <fieldset disabled={busy}><legend>Capa</legend><label>Título<input maxLength={120} value={group.title} onChange={e => patchGroup({ title: e.target.value })} /></label>
          <label>Contexto de la capa<textarea maxLength={4000} rows={4} value={group.summary ?? ''} onChange={e => patchGroup({ summary: e.target.value })} /></label>
          <label>Capa superior<select aria-label="Capa superior" value={group.parentId ?? ''} onChange={e => { try { setState(s => reparentLayer(s, group.id, e.target.value || null)); setError('') } catch (e) { setError((e as Error).message) } }}><option value="">Nivel general de la crónica</option>{state.groups.filter(g => !descendants(state, group.id).has(g.id)).map(g => <option key={g.id} value={g.id}>{ancestry(state, g.id).map(parent => parent.title).join(' › ')}</option>)}</select></label>
          <button type="button" onClick={() => enterLayer(group.id)}>Entrar en esta capa</button>
          <button type="button" disabled={state.groups.length >= 60} onClick={() => addGroup(group.id)}>＋ Capa interna</button>
          <button type="button" disabled={state.groups.length >= 60} onClick={addContext}>Crear contexto superior</button>
          <BackdropReferences references={group.references ?? []} options={options} onChange={references => patchGroup({ references })} disabled={busy} />
          {(['width', 'height'] as const).map(axis => <label key={axis}>{axis === 'width' ? 'Anchura' : 'Altura'}<input type="number" min={axis === 'width' ? 320 : 220} max={8000} value={group[axis]} onChange={e => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= (axis === 'width' ? 320 : 220) && v <= 8000) patchGroup({ [axis]: v }) }} /></label>)}
          <p>Mover esta capa desplaza todas sus capas internas y notas. Anidar no crea relaciones causales.</p><button type="button" onClick={() => { if (window.confirm('¿Quitar esta capa? Sus notas y capas internas subirán al contexto superior. Solo se retirarán las conexiones dirigidas a esta capa.')) { setState(s => removeBackdropGroup(s, group.id)); clear() } }}>Quitar capa</button>
        </fieldset>}
        {bundleIds.length > 0 && <section aria-label="Relaciones agrupadas"><h3>Relaciones agrupadas en esta escala</h3>{state.links.filter(l => bundleIds.includes(l.id)).map(l => <button type="button" key={l.id} onClick={() => choose('link', l.id)}>{endpointTitle(l.from)} → {endpointTitle(l.to)} · {l.label || 'Sin significado'}</button>)}</section>}
        {link && <fieldset disabled={busy}><legend>Conexión</legend><p>{endpointTitle(link.from)} → {endpointTitle(link.to)}</p>
          <label>Significado<input maxLength={160} value={link.label} onChange={e => setState(s => ({ ...s, links: s.links.map(l => l.id === link.id ? { ...l, label: e.target.value } : l) }))} /></label>
          <label><input type="checkbox" checked={link.tentative} onChange={e => setState(s => ({ ...s, links: s.links.map(l => l.id === link.id ? { ...l, tentative: e.target.checked } : l) }))} />Relación por decidir</label>
          <button type="button" onClick={() => { setState(s => ({ ...s, links: s.links.filter(l => l.id !== link.id) })); clear() }}>Quitar conexión</button>
        </fieldset>}
      </aside>}
    </div>}
    <footer>{automatic ? 'Burbujas compactas: acércate para desplegar capas. Doble clic o Ir a capa centra una rama; Encajar vuelve al conjunto. Arrastrar recorre la vista sin mover datos. Desactiva Detalle automático con zoom para ordenar las posiciones manuales.' : 'Distribución manual guardada: arrastra notas o el título de una capa para moverlas. Activa Detalle automático con zoom para volver a las burbujas.'} Las flechas expresan relaciones, no pertenencia. Esta pizarra no modifica guiones ni sesiones.</footer>
  </section>
}

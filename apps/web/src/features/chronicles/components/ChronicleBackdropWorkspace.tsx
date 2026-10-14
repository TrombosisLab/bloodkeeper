import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { backdropFingerprint, backdropId, emptyBackdrop, moveBackdropGroup, referenceKey, removeBackdropGroup, removeBackdropNote, statusLabels, timeLabels } from '../domain/chronicle-backdrop'
import type { BackdropGroup, BackdropNote, BackdropSnapshot, BackdropState, ReferenceOption } from '../domain/chronicle-backdrop'
import { BackdropApiError, loadBackdrop, loadBackdropReferences, saveBackdrop } from '../infrastructure/chronicle-backdrop.api'
import { routeGuideConnections } from '../domain/story-guide-routing'
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
  const [referenceSearch, setReferenceSearch] = useState('')
  const [referenceChoice, setReferenceChoice] = useState('')
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
    setBusy(true); setError(''); setDenied(false); setSaved(null); setState(emptyBackdrop()); setOptions([]); setSelected(null); setSelectedGroup(null); setSelectedLink(null)
    void Promise.all([loadBackdrop(chronicleId, controller.signal), loadBackdropReferences(chronicleId, controller.signal)]).then(([snapshot, refs]) => {
      if (controller.signal.aborted) return
      setState(snapshot.state); setSaved(snapshot); setOptions(refs.items)
    }).catch(e => { if (!controller.signal.aborted) { setError(e.message); setDenied(e instanceof BackdropApiError && (e.status === 401 || e.status === 403)) } }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [chronicleId, generation])
  const note = state.notes.find(n => n.id === selected)
  const group = state.groups.find(g => g.id === selectedGroup)
  const link = state.links.find(l => l.id === selectedLink)
  const visibleNotes = state.notes.filter(n => !filter || n.references.some(r => (r.kind === 'story' || r.kind === 'card') && r.id === filter))
  const ids = new Set(visibleNotes.map(n => n.id))
  const visibleLinks = state.links.filter(l => ids.has(l.from) && ids.has(l.to))
  const routes = useMemo(() => routeGuideConnections(
    state.notes.filter(n => !filter || n.references.some(r => (r.kind === 'story' || r.kind === 'card') && r.id === filter)).map(n => ({ id: n.id, x: n.x, y: n.y, width: 260, height: 140 })),
    state.links.filter(l => ids.has(l.from) && ids.has(l.to)),
  ), [state, filter]) // Reuses the proven router without changing the original guion.
  function choose(kind: 'note' | 'group' | 'link', id: string) { setSelected(kind === 'note' ? id : null); setSelectedGroup(kind === 'group' ? id : null); setSelectedLink(kind === 'link' ? id : null) }
  function clear() { setSelected(null); setSelectedGroup(null); setSelectedLink(null) }
  function patchNote(p: Partial<BackdropNote>) { if (note && !busy) setState(s => ({ ...s, notes: s.notes.map(n => n.id === note.id ? { ...n, ...p } : n) })) }
  function patchGroup(p: Partial<BackdropGroup>) { if (group && !busy) setState(s => ({ ...s, groups: s.groups.map(g => g.id === group.id ? { ...g, ...p } : g) })) }
  function origin() { return { x: Math.max(-19000, Math.min(19000, (60 - view.x) / view.scale)), y: Math.max(-19000, Math.min(19000, (60 - view.y) / view.scale)) } }
  function addNote() {
    if (state.notes.length >= 200) { setError('Máximo 200 notas por pizarra.'); return }
    const id = backdropId()
    const start = origin()
    let p = start
    const width = canvas.current?.getBoundingClientRect().width ?? 900
    const columns = Math.max(1, Math.floor(width / view.scale / 300))
    for (let i = 0; i < 250; i++) {
      const candidate = { x: start.x + (i % columns) * 300, y: start.y + Math.floor(i / columns) * 180 }
      if (candidate.x > 20000 || candidate.y > 20000) continue
      if (!state.notes.some(n => candidate.x < n.x + 280 && candidate.x + 280 > n.x && candidate.y < n.y + 160 && candidate.y + 160 > n.y)) { p = candidate; break }
    }
    setState(s => ({ ...s, notes: [...s.notes, { id, title: 'Nueva idea', text: '', status: 'idea', time: 'unspecified', knownBy: '', ...p, groupId: null, references: [] }] })); choose('note', id)
  }
  function addGroup() {
    if (state.groups.length >= 60) { setError('Máximo 60 grupos.'); return }
    const id = backdropId()
    setState(s => ({ ...s, groups: [...s.groups, { id, title: 'Nueva trama', ...origin(), width: 640, height: 460 }] })); choose('group', id)
  }
  function pointerStart(e: ReactPointerEvent<SVGSVGElement>) {
    if (busy || !saved || e.button !== 0) return
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
    let dx = px / d.view.scale, dy = py / d.view.scale
    if (d.note) {
      const n = d.base.notes.find(n => n.id === d.note)!
      setState({ ...d.base, notes: d.base.notes.map(item => item.id === d.note ? { ...item, x: Math.max(-20000, Math.min(20000, n.x + dx)), y: Math.max(-20000, Math.min(20000, n.y + dy)) } : item) })
    } else if (d.group) {
      const moved = [d.base.groups.find(g => g.id === d.group)!, ...d.base.notes.filter(n => n.groupId === d.group)]
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
  function zoom(factor: number) {
    const box = canvas.current?.getBoundingClientRect(); if (!box) return
    setView(v => { const scale = Math.max(.12, Math.min(2.5, v.scale * factor)), ratio = scale / v.scale; return { scale, x: box.width / 2 - (box.width / 2 - v.x) * ratio, y: box.height / 2 - (box.height / 2 - v.y) * ratio } })
  }
  function fit() {
    const box = canvas.current?.getBoundingClientRect(); if (!box) return
    const items = [...visibleNotes.map(n => ({ ...n, width: 260, height: 140 })), ...state.groups.filter(g => !filter || visibleNotes.some(n => n.groupId === g.id))]
    if (!items.length) { setView({ x: 30, y: 30, scale: .85 }); return }
    const x = Math.min(...items.map(n => n.x)) - 40, y = Math.min(...items.map(n => n.y)) - 40
    const w = Math.max(...items.map(n => n.x + n.width)) - x + 40, h = Math.max(...items.map(n => n.y + n.height)) - y + 40
    const scale = Math.max(.05, Math.min(1, box.width / w, box.height / h))
    setView({ scale, x: (box.width - w * scale) / 2 - x * scale, y: (box.height - h * scale) / 2 - y * scale })
  }
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
  return <section className="chronicle-backdrop" aria-label="Trasfondo y tramas">
    <header><div><h2>Trasfondo y tramas</h2><p>Solo Narrador · Ideas, atmósfera, secretos y planes. Nada se publica a jugadores.</p></div>
      <div className="chronicle-backdrop__controls">
        <button type="button" disabled={busy || !saved} onClick={addNote}>＋ Nota</button>
        <button type="button" disabled={busy || !saved} onClick={addGroup}>Agrupar</button>
        <button type="button" disabled={busy || !saved} onClick={() => setShowConnect(v => !v)}>Conectar</button>
        <button type="button" disabled={busy || !dirty} onClick={() => void save()}>{busy ? 'Procesando…' : 'Guardar pizarra'}</button>
        <button type="button" disabled={busy} onClick={() => { if (!dirty || window.confirm('Se descartará el borrador sin guardar. ¿Recargar la versión guardada?')) setGeneration(g => g + 1) }}>Recargar</button>
      </div>
    </header>
    <div className="chronicle-backdrop__bar"><span role="status">{dirty ? 'Cambios sin guardar' : saved ? 'Versión guardada' : busy ? 'Cargando…' : 'Sin cargar'}</span>
      <label>Centrar en historia <select value={filter} onChange={e => { setFilter(e.target.value); clear() }}><option value="">Toda la crónica</option>{options.filter(r => r.kind === 'story').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
      <button type="button" onClick={() => zoom(1 / 1.2)} aria-label="Alejar pizarra">−</button><span>{Math.round(view.scale * 100)} %</span><button type="button" onClick={() => zoom(1.2)} aria-label="Acercar pizarra">＋</button><button type="button" onClick={fit}>Encajar</button>
      {saved && <button type="button" onClick={downloadDraft}>Descargar borrador privado</button>}
    </div>
    {error && <p role="alert">{error}</p>}
    {showConnect && saved && <form className="chronicle-backdrop__connect" onSubmit={e => {
      e.preventDefault()
      if (!connectFrom || !connectTo || connectFrom === connectTo || state.links.length >= 400) { setError('Elige dos notas diferentes. Máximo 400 conexiones.'); return }
      const id = backdropId()
      setState(s => ({ ...s, links: [...s.links, { id, from: connectFrom, to: connectTo, label: connectLabel.trim(), tentative: connectTentative }] })); choose('link', id); setShowConnect(false); setError('')
    }}>
      <label>Desde<select required value={connectFrom} onChange={e => setConnectFrom(e.target.value)}><option value="">Elige una nota</option>{state.notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
      <label>Hacia<select required value={connectTo} onChange={e => setConnectTo(e.target.value)}><option value="">Elige una nota</option>{state.notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
      <label>Significado<input maxLength={160} value={connectLabel} onChange={e => setConnectLabel(e.target.value)} placeholder="Manipula, provoca, desconoce…" /></label>
      <label><input type="checkbox" checked={connectTentative} onChange={e => setConnectTentative(e.target.checked)} />Relación por decidir</label><button disabled={busy}>Añadir conexión</button>
    </form>}
    {!denied && saved && <div className="chronicle-backdrop__body">
      <div className="chronicle-backdrop__surface">{visibleNotes.length === 0 && <div className="chronicle-backdrop__empty">{filter ? <>No hay notas vinculadas a esta historia.<br />Selecciona Toda la crónica para ver el conjunto.</> : <>Tu mesa de trabajo privada.<br />Añade una nota para empezar; no hace falta convertirla en una escena.</>}</div>}
        <svg ref={canvas} aria-label="Pizarra privada de trasfondo" onPointerDown={pointerStart} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={() => { drag.current = null }} onWheel={e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1) }}>
          <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#b9c9d4" /></marker></defs>
          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
            {state.groups.filter(g => !filter || visibleNotes.some(n => n.groupId === g.id)).map(g => <g key={g.id}>
              <rect className="chronicle-backdrop__group" x={g.x} y={g.y} width={g.width} height={g.height} rx={22} />
              <g data-group-handle={g.id} role="button" tabIndex={0} aria-label={'Grupo: ' + g.title} onKeyDown={e => { if (e.key === 'Enter') choose('group', g.id) }}><rect className="chronicle-backdrop__group-handle" x={g.x} y={g.y} width={g.width} height={44} /><text x={g.x + 16} y={g.y + 29}>{short(g.title, 60)}</text></g>
            </g>)}
            {visibleLinks.map(l => { const route = routes.get(l.id); if (!route) return null; return <g key={l.id} data-link={l.id} className={selected && l.from !== selected && l.to !== selected ? 'chronicle-backdrop__dim' : ''}>
              <path className="chronicle-backdrop__line" d={route.path} strokeDasharray={l.tentative ? '7 5' : undefined} markerEnd={`url(#${marker})`} />
              <path className="chronicle-backdrop__line-hit" d={route.path} onClick={() => choose('link', l.id)}><title>{l.label || 'Sin significado'}</title></path>
              {route.labelLines.map((line, i) => <text className="chronicle-backdrop__edge-label" key={i} x={route.labelX} y={route.labelY + i * 16} textAnchor="middle" onClick={() => choose('link', l.id)}>{line}</text>)}
            </g> })}
            {visibleNotes.map(n => <g key={n.id} data-note={n.id} role="button" tabIndex={0} aria-label={n.title} transform={`translate(${n.x} ${n.y})`} className={`chronicle-backdrop__note chronicle-backdrop__note--${n.status} ${selected === n.id ? 'is-selected' : ''}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose('note', n.id) } }}>
              <rect width={260} height={140} rx={12} /><circle cx={17} cy={20} r={5} /><text className="chronicle-backdrop__status" x={29} y={24}>{statusLabels[n.status]}</text>
              <text className="chronicle-backdrop__title" x={14} y={52}>{short(n.title, 30)}</text><text x={14} y={78}>{short(n.text.replace(/\s+/g, ' '), 35)}</text>
              <text className="chronicle-backdrop__meta" x={14} y={117}>{timeLabels[n.time]} · {n.references.length} referencias</text><title>{n.title + '\n' + n.text}</title>
            </g>)}
          </g>
        </svg>
      </div>
      <aside className="chronicle-backdrop__inspector">
        {(note || group || link) ? <button type="button" onClick={clear}>Quitar selección</button> : <p>Selecciona una nota para editarla. Arrastra notas o el título de un grupo. Arrastra el fondo para desplazarte.</p>}
        {note && <fieldset disabled={busy}><legend>Nota</legend>
          <label>Título<input maxLength={120} value={note.title} onChange={e => patchNote({ title: e.target.value })} /></label>
          <label>Contexto<textarea rows={6} maxLength={8000} value={note.text} onChange={e => patchNote({ text: e.target.value })} /></label>
          <label>Estado<select value={note.status} onChange={e => patchNote({ status: e.target.value as BackdropNote['status'] })}>{Object.entries(statusLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          <label>Momento<select value={note.time} onChange={e => patchNote({ time: e.target.value as BackdropNote['time'] })}>{Object.entries(timeLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          <label>Quién lo sabe en la ficción<textarea rows={2} maxLength={1000} value={note.knownBy} onChange={e => patchNote({ knownBy: e.target.value })} placeholder="Juan y Torres; Antonio lo desconoce…" /></label><small>Este campo no concede acceso ni publica la nota.</small>
          <label>Grupo<select value={note.groupId ?? ''} onChange={e => patchNote({ groupId: e.target.value || null })}><option value="">Sin grupo</option>{state.groups.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
          <div className="chronicle-backdrop__coordinates">{(['x', 'y'] as const).map(axis => <label key={axis}>{axis.toUpperCase()}<input type="number" min={-20000} max={20000} value={note[axis]} onChange={e => { const v = Number(e.target.value); if (Number.isFinite(v) && Math.abs(v) <= 20000) patchNote({ [axis]: v }) }} /></label>)}</div>
          <h3>Referencias</h3>{note.references.map(r => <div className="chronicle-backdrop__reference" key={referenceKey(r)}><span>{options.find(o => referenceKey(o) === referenceKey(r))?.label ?? 'Referencia no disponible'}</span><button type="button" aria-label="Retirar referencia" onClick={() => patchNote({ references: note.references.filter(ref => referenceKey(ref) !== referenceKey(r)) })}>×</button></div>)}
          <label>Buscar recurso, historia o tarjeta<input value={referenceSearch} onChange={e => setReferenceSearch(e.target.value)} /></label>
          <select aria-label="Referencia para añadir" value={referenceChoice} onChange={e => setReferenceChoice(e.target.value)}><option value="">Elige una referencia</option>{options.filter(o => o.label.toLocaleLowerCase().includes(referenceSearch.toLocaleLowerCase()) && !note.references.some(r => referenceKey(r) === referenceKey(o))).map(o => <option key={referenceKey(o)} value={referenceKey(o)}>{o.label}</option>)}</select>
          <button type="button" disabled={!referenceChoice || note.references.length >= 20} onClick={() => {
            const option = options.find(o => referenceKey(o) === referenceChoice)
            if (option && !note.references.some(r => referenceKey(r) === referenceKey(option))) { const { label: _label, ...ref } = option; patchNote({ references: [...note.references, ref] }); setReferenceChoice('') }
          }}>Añadir referencia</button><small>Vincular no copia la ficha ni sus notas.</small>
          <button type="button" onClick={() => { if (window.confirm('¿Eliminar esta nota y sus conexiones del borrador? Puedes recuperarla recargando antes de guardar.')) { setState(s => removeBackdropNote(s, note.id)); clear() } }}>Eliminar nota</button>
        </fieldset>}
        {group && <fieldset disabled={busy}><legend>Grupo</legend><label>Título<input maxLength={120} value={group.title} onChange={e => patchGroup({ title: e.target.value })} /></label>
          {(['width', 'height'] as const).map(axis => <label key={axis}>{axis === 'width' ? 'Anchura' : 'Altura'}<input type="number" min={axis === 'width' ? 320 : 220} max={8000} value={group[axis]} onChange={e => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= (axis === 'width' ? 320 : 220) && v <= 8000) patchGroup({ [axis]: v }) }} /></label>)}
          <p>Asignar una nota al grupo permite moverlas juntas. No crea conexiones.</p><button type="button" onClick={() => { if (window.confirm('¿Quitar el grupo? Las notas y conexiones se conservarán.')) { setState(s => removeBackdropGroup(s, group.id)); clear() } }}>Quitar grupo</button>
        </fieldset>}
        {link && <fieldset disabled={busy}><legend>Conexión</legend><p>{state.notes.find(n => n.id === link.from)?.title} → {state.notes.find(n => n.id === link.to)?.title}</p>
          <label>Significado<input maxLength={160} value={link.label} onChange={e => setState(s => ({ ...s, links: s.links.map(l => l.id === link.id ? { ...l, label: e.target.value } : l) }))} /></label>
          <label><input type="checkbox" checked={link.tentative} onChange={e => setState(s => ({ ...s, links: s.links.map(l => l.id === link.id ? { ...l, tentative: e.target.checked } : l) }))} />Relación por decidir</label>
          <button type="button" onClick={() => { setState(s => ({ ...s, links: s.links.filter(l => l.id !== link.id) })); clear() }}>Quitar conexión</button>
        </fieldset>}
      </aside>
    </div>}
    <footer>Confirmado · En desarrollo · Posibilidad / pendiente. Los planes no son sucesos inevitables. Esta pizarra no modifica historias, sesiones ni recursos.</footer>
  </section>
}

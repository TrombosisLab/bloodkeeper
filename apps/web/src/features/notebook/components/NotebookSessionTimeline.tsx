import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createChronicleGateway } from '../../chronicles/infrastructure/chronicle.api'
import type { ChronicleEventApiSnapshot, ChronicleSessionApiSnapshot, ChronicleSessionContextApiSnapshot } from '../../chronicles/types/chronicle-api.types'
import type { NotebookNote } from '../types/notebook.types'
type Session = { readonly id: string; readonly title: string | null; readonly sessionNumber: number | null; readonly realDate: string | null; readonly status: string; readonly summary: string | null }
type Props = { readonly chronicleId: string; readonly sessions: readonly Session[]; readonly notes: readonly NotebookNote[]; readonly canManage: boolean; readonly onShowSessionNotes: (id: string) => void }
const gateway = createChronicleGateway()
const fmt = (value: string | null) => value ? new Date(value).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Fecha no indicada'
const err = (value: unknown) => value instanceof Error ? value.message : 'No se pudo completar la operación.'
export function NotebookSessionTimeline({ chronicleId, sessions, notes, canManage, onShowSessionNotes }: Props) {
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<ChronicleSessionApiSnapshot | null>(null)
  const [context, setContext] = useState<ChronicleSessionContextApiSnapshot | null>(null)
  const [detailedEvents, setDetailedEvents] = useState<readonly ChronicleEventApiSnapshot[]>([])
  const [sessionLocations, setSessionLocations] = useState<ReadonlyMap<string, string>>(new Map())
  const [sessionImageVersion, setSessionImageVersion] = useState(Date.now())
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [summary, setSummary] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [moment, setMoment] = useState('')
  const [realDate, setRealDate] = useState('')
  const [saving, setSaving] = useState(false)
  const ordered = [...sessions].sort((a, b) => (a.realDate || '').localeCompare(b.realDate || '') || (a.sessionNumber || 0) - (b.sessionNumber || 0))
  const selected = detail || ordered.find((item) => item.id === selectedId) || ordered[ordered.length - 1] || null
  useEffect(() => {
    if (!selected) return
    setSelectedId(selected.id)
    let live = true
    setLoading(true); setError('')
    void Promise.all([gateway.session(chronicleId, selected.id), gateway.sessionContext(chronicleId, selected.id)])
      .then(([nextDetail, nextContext]) => { if (live) { setDetail(nextDetail); setContext(nextContext); setSummary(nextDetail.summary || '') } })
      .catch((cause) => { if (live) setError(err(cause)) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [chronicleId, selectedId, sessions.length])
  useEffect(() => {
    if (!context) { setDetailedEvents([]); return }
    let live = true
    void Promise.all(context.events.map((item) => gateway.event(chronicleId, item.id)))
      .then((events) => { if (live) setDetailedEvents(events) })
      .catch(() => { if (live) setDetailedEvents([]) })
    return () => { live = false }
  }, [chronicleId, context])
  useEffect(() => {
    let live = true
    void Promise.all(ordered.map((item) => gateway.sessionContext(chronicleId, item.id).catch(() => null)))
      .then((contexts) => {
        if (!live) return
        const next = new Map<string, string>()
        contexts.forEach((item) => {
          if (item && item.locations.length) next.set(item.sessionId, item.locations[0]!.name + (item.locations.length > 1 ? ' +' + (item.locations.length - 1) : ''))
        })
        setSessionLocations(next)
      })
    return () => { live = false }
  }, [chronicleId, sessions.length])

  async function uploadSessionImage(file: File) {
    if (!selected || !canManage) return
    setUploadingImage(true); setError('')
    try {
      const response = await fetch('/api/chronicles/' + chronicleId + '/assets/SESSION/' + selected.id + '/image', { method: 'PUT', credentials: 'include', headers: { 'content-type': file.type }, body: file })
      if (!response.ok) throw new Error('No se pudo subir la imagen.')
      setSessionImageVersion(Date.now())
    } catch (cause) { setError(err(cause)) } finally { setUploadingImage(false) }
  }

  async function saveSummary(event: FormEvent) {
    event.preventDefault()
    if (!detail || !canManage || saving) return
    setSaving(true)
    try { setDetail(await gateway.updateSession(chronicleId, detail.id, { summary: summary.trim() || null })); setEditing(false) }
    catch (cause) { setError(err(cause)) } finally { setSaving(false) }
  }
  async function addMilestone(event: FormEvent) {
    event.preventDefault()
    if (!detail || !context || !canManage || saving || !title.trim()) return
    setSaving(true)
    try {
      const created = await gateway.createEvent(chronicleId, { title: title.trim(), description: description.trim() || null, narratorNotes: null, narrativeTimeLabel: moment.trim() || null, realDate: realDate ? new Date(realDate).toISOString() : null })
      setContext(await gateway.replaceSessionContext(chronicleId, detail.id, { eventIds: [...context.events.map((item) => item.id), created.id], npcIds: context.npcs.map((item) => item.id), locationIds: context.locations.map((item) => item.id), resourceIds: context.resources.map((item) => item.id) }))
      setTitle(''); setDescription(''); setMoment(''); setRealDate('')
    } catch (cause) { setError(err(cause)) } finally { setSaving(false) }
  }
  return <section className="nb2-session-workspace">
    
    {error && <p role="alert" className="nb2-error">{error}</p>}
    {!ordered.length ? <p className="nb2-muted">Todavía no hay sesiones registradas.</p> : <div className="nb2-session-layout">
      <div className="nb2-session-timeline" aria-label="Línea temporal de sesiones"><div className="nb2-session-line" aria-hidden="true" />{ordered.map((item) => {
        const active = selected?.id === item.id
        const count = notes.filter((note) => note.sessionId === item.id).length
        return <button type="button" key={item.id} className={'nb2-session-timeline-item' + (active ? ' is-active' : '')} aria-pressed={active} onClick={() => { setSelectedId(item.id); setDetail(null); setContext(null); setEditing(false) }}><span className="nb2-session-node" aria-hidden="true" /><span className="nb2-session-thumb"><img src={'/api/chronicles/' + chronicleId + '/assets/SESSION/' + item.id + '/image?v=' + sessionImageVersion} alt="" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add('is-missing') }} /><span aria-hidden="true">✦</span></span><span className="nb2-session-date"><span>{fmt(item.realDate)}</span><span>{sessionLocations.get(item.id) || 'Lugar no indicado'}</span></span><strong>{(item.sessionNumber === null ? 'Sesión' : 'Sesión ' + item.sessionNumber) + ' · ' + (item.title || 'Sesión sin título')}</strong><span className="nb2-session-excerpt"><em>Información</em><span>{(active && detail?.summary) || item.summary || 'Sin resumen todavía.'}</span></span><span className="nb2-session-meta">{item.status === 'completed' ? 'Completada' : item.status === 'archived' ? 'Archivada' : 'En preparación'} · {count} {count === 1 ? 'nota' : 'notas'}</span></button>
      })}</div>
      <aside className="nb2-session-inspector" aria-label="Detalle de sesión">{loading ? <p role="status">Cargando sesión…</p> : !selected ? <p className="nb2-muted">Selecciona una sesión.</p> : <>
        <header><small>{fmt(selected.realDate)}</small><h3>{selected.title || 'Sesión sin título'}</h3><span>{selected.sessionNumber === null ? 'Sin número' : 'Sesión ' + selected.sessionNumber} · {notes.filter((note) => note.sessionId === selected.id).length} notas</span></header>{canManage && <label className="nb2-session-image-upload"><span>Imagen de la sesión</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingImage} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadSessionImage(file) }} /><small>{uploadingImage ? 'Subiendo…' : 'PNG, JPG o WEBP · máximo 2 MB'}</small></label>}<figure className="nb2-session-inspector-image"><img src={'/api/chronicles/' + chronicleId + '/assets/SESSION/' + selected.id + '/image?v=' + sessionImageVersion} alt={'Imagen de ' + selected.title} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add('is-missing') }} /><figcaption>Imagen de la sesión</figcaption></figure><section className="nb2-session-summary"><div className="nb2-session-section-title"><h4>Resumen de la sesión</h4>{canManage && !editing && <button type="button" onClick={() => { setSummary(detail?.summary || selected.summary || ''); setEditing(true) }}>Editar</button>}</div>{editing ? <form onSubmit={saveSummary}><textarea rows={7} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Cuenta qué ocurrió en esta partida…" /><footer><button type="button" onClick={() => setEditing(false)}>Cancelar</button><button className="nb2-primary" disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar resumen'}</button></footer></form> : <p>{detail?.summary || selected.summary || 'Aún no hay resumen. Añade una memoria para poder retomar la crónica después de semanas.'}</p>}</section>
        <section className="nb2-session-milestones"><div className="nb2-session-section-title"><h4>Hitos de la sesión</h4><span>{context?.events.length || 0}</span></div>{detailedEvents.length ? <ol>{[...detailedEvents].sort((a, b) => a.timelineOrder - b.timelineOrder).map((item) => <li key={item.id}><span>{item.narrativeTimeLabel || (item.realDate ? fmt(item.realDate) : 'Hito')}</span><strong>{item.title}</strong>{item.description ? <p>{item.description}</p> : null}</li>)}</ol> : context?.events.length ? <ol>{[...context.events].sort((a, b) => a.timelineOrder - b.timelineOrder).map((item) => <li key={item.id}><span>{item.narrativeTimeLabel || (item.realDate ? fmt(item.realDate) : 'Hito')}</span><strong>{item.title}</strong></li>)}</ol> : <p className="nb2-muted">Los hitos aparecerán aquí cuando el narrador los genere desde el informe.</p>}{canManage && <form className="nb2-milestone-form" onSubmit={addMilestone}><h5>Generar hito</h5><input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título del hito" /><textarea rows={3} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripción opcional" /><div className="nb2-form-row"><input value={moment} onChange={(event) => setMoment(event.target.value)} placeholder="Momento narrativo" /><input type="datetime-local" value={realDate} onChange={(event) => setRealDate(event.target.value)} /></div><button className="nb2-primary" disabled={saving} type="submit">{saving ? 'Guardando…' : 'Añadir hito'}</button></form>}</section>
        <footer className="nb2-session-inspector-actions"><button type="button" onClick={() => onShowSessionNotes(selected.id)}>Ver notas de esta sesión</button></footer>
      </>}</aside>
    </div>}
  </section>
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { createChronicleGateway } from '../../chronicles/infrastructure/chronicle.api'
import { notebookApi } from '../infrastructure/notebook.api'
import type { NotebookContext, NotebookNote, NotebookResourcePreview, NotebookVisibility, ResourceType } from '../types/notebook.types'
import { insertMention, mentionAt, parseMentions, readable, serializeMentions, tagKey, uniqueReferences } from './notebook-model'
import type { Mention } from './notebook-model'
import { NotebookResourceDetails } from './NotebookResourceDetails'
import './notebook-phase2.css'

type Section = 'NOTES' | 'SUMMARY' | 'SESSION' | 'TAGS' | ResourceType
type Filter = 'ALL' | 'MINE' | 'SHARED' | 'PINNED'
type Chronicle = { id: string; name: string; description: string | null }
type Session = { id: string; title: string | null; sessionNumber: number | null; realDate: string | null; status: string; summary: string | null }
type Card = Mention & { description: string | null; category: string | null; restricted?: boolean }
const gateway = createChronicleGateway()
async function loadSessions(id: string): Promise<readonly Session[]> {
  const items: Session[] = []
  let offset: number | null = 0
  while (offset !== null) {
    const page = await gateway.sessions(id, { limit: 50, offset })
    items.push(...page.items)
    if (page.nextOffset !== null && page.nextOffset <= offset) throw new Error('La paginación de sesiones no es válida.')
    offset = page.nextOffset
  }
  return items
}
const resourceSections: readonly ResourceType[] = ['NPC', 'LOCATION', 'ORGANIZATION', 'ARTIFACT', 'DOCUMENT']
const labels: Record<string, string> = { NOTES: 'Notas', SUMMARY: 'Resumen', SESSION: 'Sesiones', TAGS: 'Etiquetas', NPC: 'PNJ', LOCATION: 'Localizaciones', ORGANIZATION: 'Organizaciones', ARTIFACT: 'Artefactos', DOCUMENT: 'Documentos' }
const visibilityLabels: Record<NotebookVisibility, string> = { PRIVATE: 'Privada · solo tú', CHRONICLE: 'Toda la crónica', SELECTED_PLAYERS: 'Jugadores seleccionados' }
const date = (value: string | null) => value ? new Date(value).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'
const message = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación.'

function Modal({ title, close, children, wide = false }: { title: string; close: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close() }, [])
  return <dialog ref={ref} className={'nb2-modal' + (wide ? ' nb2-wide' : '')} aria-label={title} onCancel={(event) => { event.preventDefault(); close() }}>
    <header><h2>{title}</h2><button type="button" aria-label="Cerrar ventana" onClick={close}>×</button></header>{children}
  </dialog>
}

export function NotebookWorkspace() {
  const [chronicles, setChronicles] = useState<readonly Chronicle[]>([])
  const [chronicleId, setChronicleId] = useState('')
  const [notes, setNotes] = useState<readonly NotebookNote[]>([])
  const [context, setContext] = useState<NotebookContext | null>(null)
  const [sessions, setSessions] = useState<readonly Session[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [section, setSection] = useState<Section>('NOTES')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [tag, setTag] = useState('')
  const [search, setSearch] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [revision, setRevision] = useState(0)
  const [preview, setPreview] = useState<NotebookResourcePreview | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [fullSheet, setFullSheet] = useState(false)
  const previewRequest = useRef(0)
  const [composer, setComposer] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<NotebookVisibility>('PRIVATE')
  const [audience, setAudience] = useState<readonly string[]>([])
  const [noteSession, setNoteSession] = useState('')
  const [noteTags, setNoteTags] = useState<readonly string[]>([])
  const [attached, setAttached] = useState<readonly Mention[]>([])
  const [chosenMentions, setChosenMentions] = useState<readonly Mention[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [editorError, setEditorError] = useState('')
  const [caret, setCaret] = useState(0)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionIndex, setMentionIndex] = useState(0)
  const textarea = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let live = true
    void gateway.list().then((items) => {
      if (!live) return
      setChronicles(items)
      const remembered = localStorage.getItem('bloodkeeper.notebook.chronicle')
      setChronicleId(items.find((item) => item.id === remembered)?.id ?? items[0]?.id ?? '')
      if (!items.length) setLoading(false)
    }).catch((cause) => { if (live) { setError(message(cause)); setLoading(false) } })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!chronicleId) return
    let live = true
    setLoading(true); setError(''); setWarning(''); setContext(null); setNotes([]); setSessions([])
    setPreviewOpen(false); setPreview(null); previewRequest.current++
    void Promise.allSettled([notebookApi.list(chronicleId), notebookApi.context(chronicleId), loadSessions(chronicleId)]).then(([noteResult, contextResult, sessionResult]) => {
      if (!live) return
      if (noteResult.status === 'fulfilled') {
        setNotes(noteResult.value.items)
        setSelectedId((id) => noteResult.value.items.some((item) => item.id === id) ? id : noteResult.value.items[0]?.id ?? '')
      } else setError(message(noteResult.reason))
      if (contextResult.status === 'fulfilled') setContext(contextResult.value)
      else setWarning('No se pudo cargar el catálogo ni los destinatarios. Pulsa Actualizar para reintentarlo.')
      if (sessionResult.status === 'fulfilled') setSessions(sessionResult.value)
      else setWarning((value) => value + ' No se pudieron cargar las sesiones.')
      setLoading(false)
    })
    localStorage.setItem('bloodkeeper.notebook.chronicle', chronicleId)
    return () => { live = false }
  }, [chronicleId, revision])

  useEffect(() => {
    const navigate = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string; label?: string }>).detail
      const next = detail?.label === 'Resumen' ? 'SUMMARY' : detail?.section === 'ALL' ? 'NOTES' : detail?.section
      if (next && labels[next]) { setSection(next as Section); setSearch(''); setTag(''); setSessionFilter('') }
    }
    window.addEventListener('bloodkeeper:notebook-section', navigate)
    return () => window.removeEventListener('bloodkeeper:notebook-section', navigate)
  }, [])

  const cards: Card[] = useMemo(() => [
    ...(context?.npcs ?? []).map((item) => ({ targetType: 'NPC', targetId: item.id, label: item.name, description: item.description, category: item.category })),
    ...(context?.locations ?? []).map((item) => ({ targetType: 'LOCATION', targetId: item.id, label: item.name, description: item.description, category: item.category })),
    ...(context?.resources ?? []).map((item) => ({ targetType: item.kind, targetId: item.id, label: item.name, description: item.summary, category: labels[item.kind] ?? item.kind, restricted: item.visibility !== 'chronicle_participants' })),
    ...sessions.map((item) => ({ targetType: 'SESSION', targetId: item.id, label: item.title || 'Sesión ' + (item.sessionNumber ?? ''), description: item.summary, category: item.status })),
  ], [context, sessions])
  const selected = notes.find((item) => item.id === selectedId) ?? null
  const tagEntries = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>()
    for (const note of notes) for (const key of new Set(note.tags.map(tagKey))) {
      const current = counts.get(key)
      counts.set(key, { label: current?.label ?? note.tags.find((item) => tagKey(item) === key)!, count: (current?.count ?? 0) + 1 })
    }
    return [...counts.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label, 'es'))
  }, [notes])
  const visibleNotes = notes.filter((note) =>
    (filter === 'ALL' || filter === 'MINE' && note.author.id === context?.viewerUserId || filter === 'SHARED' && note.visibility !== 'PRIVATE' || filter === 'PINNED' && note.pinned)
    && (!tag || note.tags.some((item) => tagKey(item) === tag))
    && (!sessionFilter || note.sessionId === sessionFilter)
    && (!search || (note.title + ' ' + readable(note.content)).toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
  const overview = filter === 'ALL' && !tag && !search && !sessionFilter
  const groups = overview ? [
    { name: 'Notas compartidas', items: visibleNotes.filter((item) => item.visibility !== 'PRIVATE'), filter: 'SHARED' as Filter },
    { name: 'Mis notas privadas', items: visibleNotes.filter((item) => item.visibility === 'PRIVATE'), filter: 'MINE' as Filter },
  ] : [{ name: tag ? '#' + tag : 'Entradas', items: visibleNotes, filter }]
  const activeNote = selected && visibleNotes.some((item) => item.id === selected.id) ? selected : visibleNotes[0] ?? null
  const mentionRange = mentionAt(content, caret)
  const mentionChoices = cards.filter((item) => item.label.toLocaleLowerCase('es').includes((mentionRange?.query ?? '').toLocaleLowerCase('es'))).slice(0, 12)
  const resourceNotes = preview ? notes.filter((note) => note.references.some((ref) => ref.targetType === preview.targetType && ref.targetId === preview.targetId) || preview.targetType === 'SESSION' && note.sessionId === preview.targetId) : []

  function navigate(next: Section) { setSection(next); setSearch(''); setTag(''); setSessionFilter('') }
  function filterTag(value: string) { setTag(tagKey(value)); setFilter('ALL'); setSection('NOTES'); setSearch(''); setSessionFilter('') }
  function showNote(note: NotebookNote) { setSelectedId(note.id); setFilter('ALL'); setTag(''); setSearch(''); setSessionFilter(''); setSection('NOTES'); setPreviewOpen(false) }
  async function openResource(ref: Mention, full = false) {
    const request = ++previewRequest.current
    setPreview(null); setPreviewError(''); setFullSheet(full); setPreviewOpen(true)
    try { const result = await notebookApi.resourcePreview(chronicleId, ref.targetType, ref.targetId); if (request === previewRequest.current) setPreview(result) }
    catch (cause) { if (request === previewRequest.current) setPreviewError(message(cause)) }
  }
  function closePreview() { previewRequest.current++; setPreviewOpen(false) }
  function startNote(ref?: Mention, note?: NotebookNote) {
    setEditingId(note?.id ?? ''); setTitle(note?.title ?? ''); setContent(note ? readable(note.content) : '')
    setVisibility(note?.visibility ?? 'PRIVATE'); setAudience(note?.audienceUserIds ?? []); setNoteSession(note?.sessionId ?? (ref?.targetType === 'SESSION' ? ref.targetId : ''))
    setNoteTags(note?.tags ?? []); setAttached(note ? note.references.map((item) => ({ ...item, label: item.label ?? item.targetType })) : ref ? [ref] : [])
    setChosenMentions(note ? parseMentions(note.content) : []); setEditorError(''); setTagDraft(''); setMentionOpen(false); setCaret(0)
    setPreviewOpen(false); setComposer(true)
  }
  function chooseMention(ref: Mention) {
    const inserted = insertMention(content, caret, ref.label)
    setContent(inserted.content); setCaret(inserted.caret); setChosenMentions((items) => [ref, ...items]); setMentionOpen(false)
    requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(inserted.caret, inserted.caret) })
  }
  function applyNote(note: NotebookNote) { setNotes((items) => [note, ...items.filter((item) => item.id !== note.id)]); setSelectedId(note.id) }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true); setEditorError('')
    try {
      if (visibility === 'SELECTED_PLAYERS' && !audience.length) throw new Error('Selecciona al menos un jugador.')
      const serialized = serializeMentions(content, [...chosenMentions, ...cards.filter((card) => cards.filter((other) => other.label.toLowerCase() === card.label.toLowerCase()).length === 1)])
      const references = uniqueReferences([...attached, ...parseMentions(serialized)])
      const tags = [...noteTags]
      if (tagDraft.trim() && !tags.some((item) => tagKey(item) === tagKey(tagDraft))) tags.push(tagDraft.trim().replace(/^#/, ''))
      if (tags.length > 12 || tags.some((item) => item.length > 32)) throw new Error('Puedes añadir hasta 12 etiquetas de 32 caracteres.')
      const body = { title: title.trim(), content: serialized, visibility, sessionId: noteSession || null, audienceUserIds: visibility === 'SELECTED_PLAYERS' ? audience : [], tags, references }
      const note = editingId ? await notebookApi.update(chronicleId, editingId, body) : await notebookApi.create(chronicleId, body)
      applyNote(note); setComposer(false); showNote(note)
    } catch (cause) { setEditorError(message(cause)) } finally { setSaving(false) }
  }
  async function pin(note: NotebookNote) {
    try { applyNote(await notebookApi.pin(chronicleId, note.id, !note.pinned)) } catch (cause) { setError(message(cause)) }
  }
  async function archive(note: NotebookNote) {
    if (!window.confirm('¿Archivar «' + note.title + '»? Dejará de aparecer en el cuaderno.')) return
    try { await notebookApi.archive(chronicleId, note.id); setNotes((items) => items.filter((item) => item.id !== note.id)) } catch (cause) { setError(message(cause)) }
  }
  function renderContent(value: string) {
    const result: ReactNode[] = []; let cursor = 0
    for (const ref of parseMentions(value)) {
      result.push(value.slice(cursor, ref.start))
      result.push(<button className="nb2-mention" key={ref.start} type="button" onClick={() => void openResource(ref)}>@{ref.label}</button>)
      cursor = ref.end
    }
    result.push(value.slice(cursor)); return result
  }

  return <main className="nb2-workspace">
    <header className="nb2-header"><div><small>CRÓNICAS · CUADERNO</small><h1>Cuaderno de la crónica</h1></div>
      <label>Crónica activa<select aria-label="Crónica activa" value={chronicleId} disabled={loading || composer} onChange={(event) => { setChronicleId(event.target.value); setTag(''); setSearch(''); setSessionFilter(''); setSelectedId('') }}>{chronicles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="nb2-primary" disabled={!chronicleId || loading} onClick={() => startNote()}>✎ Nueva nota</button><button disabled={loading} onClick={() => setRevision((value) => value + 1)}>Actualizar</button>
    </header>
    <nav className="nb2-sections" aria-label="Secciones del cuaderno"><div>{(['SUMMARY', 'NOTES', 'SESSION', 'TAGS'] as Section[]).map((item) => <button aria-pressed={section === item} key={item} onClick={() => navigate(item)}>{labels[item]}</button>)}</div><div aria-label="Catálogo de recursos">{resourceSections.map((item) => <button aria-pressed={section === item} key={item} onClick={() => navigate(item)}>{labels[item]}</button>)}</div></nav>
    {error && <p role="alert" className="nb2-error">{error}</p>}{warning && <p role="status" className="nb2-warning">{warning}</p>}
    {loading ? <p role="status">Cargando cuaderno…</p> : !chronicleId ? <p>No participas en ninguna crónica.</p> : <>
      {section === 'SUMMARY' && <section className="nb2-panel"><h2>Resumen de la crónica</h2><p>{chronicles.find((item) => item.id === chronicleId)?.description || 'Sin descripción.'}</p><div className="nb2-summary"><button onClick={() => navigate('NOTES')}>{notes.length}<span>Entradas accesibles</span></button><button onClick={() => navigate('SESSION')}>{sessions.length}<span>Sesiones cargadas</span></button><button onClick={() => navigate('TAGS')}>{tagEntries.length}<span>Etiquetas</span></button></div><h3>Últimas entradas</h3>{notes.slice(0, 5).map((note) => <button className="nb2-row" key={note.id} onClick={() => showNote(note)}><strong>{note.title}</strong><span>{note.author.displayName} · {date(note.updatedAt)}</span></button>)}</section>}
      {section === 'TAGS' && <section className="nb2-panel"><h2>Explorar por etiquetas</h2><p>Encuentra las entradas que comparten una etiqueta dentro de esta crónica.</p><div className="nb2-tag-cloud">{tagEntries.map(([key, item]) => <button key={key} onClick={() => filterTag(item.label)}>#{item.label}<span>{item.count}</span></button>)}</div>{!tagEntries.length && <p>Añade etiquetas al crear o editar una nota para organizar el cuaderno.</p>}</section>}
      {(resourceSections.includes(section as ResourceType) || section === 'SESSION') && <section className="nb2-panel"><div className="nb2-panel-heading"><h2>{labels[section]}</h2><label>Buscar recurso<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><div className="nb2-catalog">{cards.filter((item) => item.targetType === section && (item.label + ' ' + item.description).toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).map((item) => <article key={item.targetId} className="nb2-resource-card"><small>{item.category || labels[section]}{item.restricted ? ' · Solo narrador' : ''}</small><h3>{item.label}</h3><p>{item.description || 'Sin descripción.'}</p><span>{notes.filter((note) => note.references.some((ref) => ref.targetId === item.targetId && ref.targetType === item.targetType) || section === 'SESSION' && note.sessionId === item.targetId).length} anotaciones accesibles</span><footer><button onClick={() => void openResource(item, true)}>Abrir ficha completa</button><button onClick={() => startNote(item)}>Añadir nota</button>{section === 'SESSION' && <button onClick={() => { setSessionFilter(item.targetId); setSection('NOTES'); setFilter('ALL'); setSearch('') }}>Ver notas de sesión</button>}</footer></article>)}</div>{!cards.some((item) => item.targetType === section) && <p>No hay {labels[section]?.toLowerCase()} disponibles para tu cuenta en esta crónica.</p>}</section>}
      {section === 'NOTES' && <section className="nb2-notes"><nav className="nb2-filters" aria-label="Filtros de notas">{([['ALL', 'Todo'], ['MINE', 'Mis notas'], ['SHARED', 'Compartido'], ['PINNED', 'Fijado']] as const).map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}<label className="nb2-search">Buscar notas<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label>Etiqueta<select value={tag} onChange={(event) => setTag(event.target.value)}><option value="">Todas</option>{tagEntries.map(([key, item]) => <option value={key} key={key}>#{item.label} ({item.count})</option>)}</select></label>{sessionFilter && <button onClick={() => setSessionFilter('')}>Quitar filtro de sesión ×</button>}</nav>
        <div className="nb2-columns"><aside className="nb2-note-list" aria-label="Entradas"><header><h2>Entradas</h2><span>{visibleNotes.length}</span></header>{groups.map((group) => <section key={group.name}><div className="nb2-group-heading"><h3>{group.name}</h3>{overview && group.items.length > 3 && <button onClick={() => setFilter(group.filter)}>Ver todas</button>}</div>{(overview ? group.items.slice(0, 3) : group.items).map((note) => <button className="nb2-note-item" aria-pressed={activeNote?.id === note.id} key={note.id} onClick={() => setSelectedId(note.id)}><strong>{note.title}{note.pinned ? ' ★' : ''}</strong><span>{note.author.displayName} · {date(note.updatedAt)}</span><small>{visibilityLabels[note.visibility]}</small><p>{readable(note.content).slice(0, 95)}</p></button>)}{!group.items.length && <p className="nb2-muted">No hay entradas en este apartado.</p>}</section>)}</aside>
          <article className="nb2-reader" aria-label="Lectura de la nota">{activeNote ? <><header><div><small>{visibilityLabels[activeNote.visibility]}</small><h2>{activeNote.title}</h2><p>{activeNote.author.displayName} · {date(activeNote.updatedAt)}</p></div>{<div className="nb2-actions"><button onClick={() => void pin(activeNote)} aria-label={activeNote.pinned ? 'Desfijar entrada' : 'Fijar entrada'}>{activeNote.pinned ? '★' : '☆'}</button>{activeNote.canEdit && <button onClick={() => startNote(undefined, activeNote)}>Editar</button>}</div>}</header><div className="nb2-prose">{renderContent(activeNote.content)}</div>{activeNote.references.length > 0 && <div className="nb2-linked"><h3>Recursos vinculados</h3>{activeNote.references.map((ref) => <button key={ref.id} onClick={() => void openResource({ ...ref, label: ref.label || 'Recurso' })}>{ref.label || labels[ref.targetType] || 'Recurso'} ↗</button>)}</div>}<footer><div className="nb2-tag-cloud">{activeNote.tags.map((item) => <button key={item} onClick={() => filterTag(item)}>#{item}</button>)}{!activeNote.tags.length && <span>Sin etiquetas</span>}</div>{activeNote.canEdit && <button onClick={() => void archive(activeNote)}>Archivar entrada</button>}</footer></> : <p>No hay notas con estos filtros.</p>}</article>
          <aside className="nb2-context"><h2>Contexto de la crónica</h2><strong>{chronicles.find((item) => item.id === chronicleId)?.name}</strong><p>{activeNote?.session?.title || 'Nota general de la crónica'}</p><h3>Etiquetas</h3><div className="nb2-tag-cloud">{tagEntries.slice(0, 12).map(([key, item]) => <button key={key} onClick={() => filterTag(item.label)}>#{item.label} ({item.count})</button>)}</div><p className="nb2-muted">Pulsa una referencia del texto para consultar su ficha.</p></aside>
        </div></section>}
    </>}
    {previewOpen && <Modal title={fullSheet ? 'Ficha del recurso' : 'Vista previa del recurso'} close={closePreview} wide={fullSheet}>{previewError ? <p role="alert">{previewError}</p> : !preview ? <p role="status">Cargando ficha…</p> : <><small>{labels[preview.targetType] || preview.targetType} · {preview.category}</small><h3>{preview.label}</h3><p>{preview.status.toLowerCase() === 'active' ? 'Activo' : preview.status}</p><div className="nb2-prose">{preview.description || 'Sin descripción disponible.'}</div>{preview.narrativeRole && <p><strong>Función narrativa:</strong> {preview.narrativeRole}</p>}{fullSheet ? <><NotebookResourceDetails resource={preview} />{preview.parentLocationId && <button onClick={() => void openResource({ targetType: 'LOCATION', targetId: preview.parentLocationId!, label: 'Localización superior' }, true)}>Abrir localización superior</button>}{preview.narratorDetails && <section className="nb2-private"><h3>Información del narrador</h3><p>{preview.narratorDetails}</p></section>}<h3>Anotaciones del recurso ({resourceNotes.length})</h3>{resourceNotes.map((note) => <button className="nb2-row" key={note.id} onClick={() => showNote(note)}><strong>{note.title}</strong><span>{note.author.displayName} · {visibilityLabels[note.visibility]}</span></button>)}{!resourceNotes.length && <p>No hay anotaciones accesibles todavía.</p>}<button className="nb2-primary" onClick={() => startNote({ targetType: preview.targetType, targetId: preview.targetId, label: preview.label })}>Añadir nota sobre este recurso</button></> : <button className="nb2-primary" onClick={() => setFullSheet(true)}>Abrir ficha completa</button>}<p className="nb2-muted">Se muestra la información disponible para tu cuenta. Las notas privadas solo las ve su autor.</p></>}</Modal>}
    {composer && <Modal title={editingId ? 'Editar nota' : 'Nueva nota'} wide close={() => { if (!saving) setComposer(false) }}><form onSubmit={save}>{editorError && <p className="nb2-error" role="alert">{editorError}</p>}<label>Título<input autoFocus required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Contenido<textarea ref={textarea} required maxLength={20000} rows={9} value={content} onChange={(event) => { setContent(event.target.value); setCaret(event.target.selectionStart); setMentionOpen(!!mentionAt(event.target.value, event.target.selectionStart)); setMentionIndex(0) }} onSelect={(event) => setCaret(event.currentTarget.selectionStart)} onKeyDown={(event) => { if (!mentionOpen) return; if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setMentionOpen(false) } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setMentionIndex((value) => Math.max(0, Math.min(mentionChoices.length - 1, value + (event.key === 'ArrowDown' ? 1 : -1)))) } else if (event.key === 'Enter' && mentionChoices[mentionIndex]) { event.preventDefault(); chooseMention(mentionChoices[mentionIndex]!) } }} /></label><button type="button" onClick={() => { setMentionOpen((value) => !value); setMentionIndex(0) }}>@ Referenciar recurso</button>{mentionOpen && <div className="nb2-mention-menu" aria-label="Sugerencias de recursos">{mentionChoices.map((item, index) => <button type="button" className={index === mentionIndex ? 'is-active' : ''} key={item.targetType + item.targetId} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseMention(item)}><strong>{item.label}</strong><span>{labels[item.targetType]}{item.restricted ? ' · Solo narrador' : ''}</span></button>)}{!mentionChoices.length && <p>No hay coincidencias.</p>}</div>}<p className="nb2-muted">Escribe @ y el nombre. Selecciona el recurso o pulsa Intro. La referencia se insertará donde estás escribiendo.</p>
      {attached.length > 0 && <fieldset><legend>Recursos vinculados a la nota</legend>{attached.map((ref) => <span className="nb2-attached" key={ref.targetType + ref.targetId}>{ref.label}<button aria-label={'Desvincular ' + ref.label} type="button" onClick={() => setAttached((items) => items.filter((item) => item !== ref))}>×</button></span>)}</fieldset>}
      <div className="nb2-form-row"><label>Visibilidad<select value={visibility} onChange={(event) => setVisibility(event.target.value as NotebookVisibility)}>{Object.entries(visibilityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Sesión<select value={noteSession} onChange={(event) => setNoteSession(event.target.value)}><option value="">Nota general de la crónica</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.title || 'Sesión ' + item.sessionNumber}</option>)}</select></label></div>
      {visibility === 'SELECTED_PLAYERS' && <fieldset><legend>Jugadores destinatarios ({audience.length})</legend>{(context?.players ?? []).filter((item) => item.id !== context?.viewerUserId).map((item) => <label className="nb2-checkbox" key={item.id}><input type="checkbox" checked={audience.includes(item.id)} onChange={(event) => setAudience((items) => event.target.checked ? [...items, item.id] : items.filter((id) => id !== item.id))} />{item.displayName} <small>@{item.username}</small></label>)}{!(context?.players ?? []).some((item) => item.id !== context?.viewerUserId) && <p>No hay otros jugadores disponibles.</p>}<p className="nb2-muted">Podrán verla tú, los jugadores marcados y el narrador de la crónica.</p></fieldset>}
      <label>Etiquetas <input value={tagDraft} maxLength={32} onChange={(event) => setTagDraft(event.target.value)} placeholder="Escribe una etiqueta" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); const next = tagDraft.trim().replace(/^#/, ''); if (next && noteTags.length < 12 && !noteTags.some((item) => tagKey(item) === tagKey(next))) { setNoteTags([...noteTags, next]); setTagDraft('') } } }} /></label><p className="nb2-muted">Pulsa Intro para añadir otra. La etiqueta que quede escrita también se guardará.</p><div className="nb2-tag-cloud">{noteTags.map((item) => <button key={item} type="button" aria-label={'Quitar etiqueta ' + item} onClick={() => setNoteTags((items) => items.filter((value) => value !== item))}>#{item} ×</button>)}</div><footer><button type="button" disabled={saving} onClick={() => setComposer(false)}>Cancelar</button><button className="nb2-primary" type="submit" disabled={saving || !title.trim() || !content.trim() || visibility === 'SELECTED_PLAYERS' && !audience.length}>{saving ? 'Guardando…' : 'Guardar nota'}</button></footer>
    </form></Modal>}
  </main>
}

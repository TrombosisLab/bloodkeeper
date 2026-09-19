import { useEffect, useMemo, useState } from 'react'
import { createChronicleGateway } from '../../chronicles/infrastructure/chronicle.api'
import { notebookApi } from '../infrastructure/notebook.api'
import type { NotebookNote } from '../types/notebook.types'
import './notebook-fresh-prototype.css'

type Chronicle = { readonly id: string; readonly name: string; readonly description: string | null }
type Session = { readonly id: string; readonly title: string | null; readonly sessionNumber: number | null; readonly realDate: string | null; readonly status: string; readonly summary: string | null }
type FreshSection = 'SUMMARY' | 'CLUES' | 'SESSIONS' | 'ARCHIVE'

const chronicleGateway = createChronicleGateway()

const sectionLabels: Record<FreshSection, string> = {
  SUMMARY: 'Resumen',
  CLUES: 'Pistas',
  SESSIONS: 'Sesiones',
  ARCHIVE: 'Archivo',
}

const shortDate = (value: string) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
const authorDate = (note: NotebookNote) => note.author.displayName + ' · ' + shortDate(note.updatedAt)
const excerpt = (value: string, length: number) => value.length > length ? value.slice(0, length).trimEnd() + '…' : value

export function NotebookFreshPrototype() {
  const [chronicles, setChronicles] = useState<readonly Chronicle[]>([])
  const [chronicleId, setChronicleId] = useState('')
  const [notes, setNotes] = useState<readonly NotebookNote[]>([])
  const [sessions, setSessions] = useState<readonly Session[]>([])
  const [section, setSection] = useState<FreshSection>('SUMMARY')
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadChronicles() {
      try {
        const items = await chronicleGateway.list()
        if (!cancelled) {
          setChronicles(items)
          setChronicleId((current) => current || items[0]?.id || '')
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las crónicas.')
      }
    }
    void loadChronicles()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadNotes() {
      if (!chronicleId) { setNotes([]); setLoading(false); return }
      setLoading(true); setError('')
      try {
        const page = await notebookApi.list(chronicleId)
        if (!cancelled) {
          setNotes(page.items)
          setSelectedNoteId((current) => current && page.items.some((item) => item.id === current) ? current : page.items[0]?.id || '')
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las entradas.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadNotes()
    return () => { cancelled = true }
  }, [chronicleId])


  useEffect(() => {
    let cancelled = false
    async function loadSessions() {
      if (!chronicleId) { setSessions([]); return }
      try {
        const page = await chronicleGateway.sessions(chronicleId, { limit: 50, offset: 0 })
        if (!cancelled) setSessions(page.items)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las sesiones.')
      }
    }
    void loadSessions()
    return () => { cancelled = true }
  }, [chronicleId])

  const chronicle = useMemo(() => chronicles.find((item) => item.id === chronicleId), [chronicles, chronicleId])
  const recent = notes.slice(0, 3)
  const selected = notes.find((item) => item.id === selectedNoteId) ?? recent[0] ?? null
  const latest = notes[0] ?? null
  const privateCount = notes.filter((item) => item.visibility === 'PRIVATE').length
  const sharedCount = notes.length - privateCount

  return <main className="fresh-notebook" aria-label="Nuevo cuaderno experimental">
    <header className="fresh-notebook__toolbar">
      <div className="fresh-notebook__brand"><span>CUADERNO DE PRUEBA</span><strong>Nuevo cuaderno</strong></div>
      <label className="fresh-notebook__chronicle">Crónica activa<select value={chronicleId} onChange={(event) => { setChronicleId(event.target.value); setSection('SUMMARY'); setIsOpen(false) }}>{chronicles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <a className="fresh-notebook__back" href="#/notebook">Volver al cuaderno actual</a>{isOpen ? <button className="fresh-notebook__close" type="button" onClick={() => setIsOpen(false)}>Cerrar cuaderno</button> : null}
    </header>
    {error ? <p className="fresh-notebook__error" role="alert">{error}</p> : null}
    {loading ? <p className="fresh-notebook__loading">Preparando las páginas…</p> : !isOpen ? <section className="fresh-cover" aria-label="Portada del cuaderno">
      <button className="fresh-cover__book" type="button" onClick={() => setIsOpen(true)} aria-label={'Abrir el cuaderno ' + (chronicle?.name || 'de la crónica')}>
        <span className="fresh-cover__kicker">DIARIO DE LA CRÓNICA</span>
        <span className="fresh-cover__code">BK · 01</span>
        <h1>{chronicle?.name || 'Nueva crónica'}</h1>
        <span className="fresh-cover__rule" />
        <p>{chronicle?.description || 'Pistas, sesiones y memoria de la noche.'}</p>
        <span className="fresh-cover__hint">Pulsar para abrir</span>
      </button>
    </section> : <section className="fresh-notebook__stage">
      <div className="fresh-bookmarks" aria-label="Secciones del nuevo cuaderno">{(Object.keys(sectionLabels) as FreshSection[]).map((item) => <button key={item} className={section === item ? 'is-active' : ''} type="button" onClick={() => setSection(item)}>{sectionLabels[item]}</button>)}</div>
      <article className="fresh-book">
        <div className="fresh-book__stack" aria-hidden="true" />
        <div className={'fresh-book__pages' + (section === 'SUMMARY' ? ' fresh-book__pages--summary' : '')}>
          {section === 'SUMMARY' ? <>
            <section className="fresh-page fresh-page--left">
              <div className="fresh-page__running"><span>BK · 01</span><span>DIARIO DE LA CRÓNICA</span><time>{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</time></div>
              <h1>{chronicle?.name || 'Nueva crónica'}</h1>
              <div className="fresh-rule" />
              <p className="fresh-page__lead">{chronicle?.description || 'La ciudad no duerme. Sólo aprende a ocultar mejor aquello que sucede después de medianoche.'}</p>
              <span className="fresh-stamp">CONFIDENCIAL · COTERIE</span>

              <p className="fresh-handwriting">«{latest ? excerpt(latest.content, 116) : 'Empieza por el puerto. Todos evitan hablar del almacén 7.'}»</p>
              <span className="fresh-page__number">1</span>
            </section>
            <section className="fresh-page fresh-page--right">
              <p className="fresh-page__eyebrow">MEMORIA RECIENTE</p><h2>Últimas entradas</h2><div className="fresh-rule fresh-rule--short" />
              <div className="fresh-entry-list">{recent.length ? recent.map((note, index) => <button className="fresh-entry" key={note.id} type="button" onClick={() => { setSelectedNoteId(note.id); setSection('CLUES') }}><strong>{String(index + 1).padStart(2, '0')}</strong><span><b>{note.title}</b><small>{excerpt(note.content, 70)}</small></span><i>→</i></button>) : <p className="fresh-empty">Todavía no hay entradas en esta crónica.</p>}</div>
              {latest ? <aside className="fresh-sticky"><span>NOTA DE LA MESA</span>{excerpt(latest.content, 105)}</aside> : null}
              <span className="fresh-page__number">2</span>
            </section>
          </> : <section className="fresh-page fresh-page--single">
            <div className="fresh-page__running"><span>BK · ARCHIVO</span><span>{sectionLabels[section].toUpperCase()}</span><span>{chronicle?.name || 'Nueva crónica'}</span></div>
            <p className="fresh-page__eyebrow">{section === 'CLUES' ? 'PISTAS Y ANOTACIONES' : section === 'SESSIONS' ? 'MEMORIA DE LAS SESIONES' : 'ARCHIVO DE LA CRÓNICA'}</p>
            <h2>{sectionLabels[section]}</h2><div className="fresh-rule" />
            {section === 'CLUES' && selected ? <div className="fresh-reading"><span className="fresh-reading__meta">{authorDate(selected)}</span><h3>{selected.title}</h3><p>{selected.content}</p>{selected.references.length ? <div className="fresh-references"><span>REFERENCIAS EN LA NOTA</span>{selected.references.map((reference) => <button type="button" key={reference.id}>{reference.label || reference.targetType} ↗</button>)}</div> : null}</div> : null}
            {section === 'CLUES' && !selected ? <p className="fresh-empty">No hay pistas anotadas todavía.</p> : null}
            {section === 'SESSIONS' ? <div className="fresh-session-list">{sessions.length ? sessions.map((session, index) => <article className="fresh-session-card" key={session.id}><div className="fresh-session-card__meta"><span>{session.realDate ? shortDate(session.realDate) : 'FECHA NO INDICADA'}</span><span>{session.status}</span></div><h3>{session.title || ('Sesión ' + String(index + 1).padStart(2, '0'))}</h3><p>{session.summary || 'Sin resumen disponible todavía.'}</p></article>) : <div className="fresh-empty fresh-empty--large"><strong>Aún no hay sesiones anotadas.</strong><span>Cuando la crónica tenga una sesión, aparecerá aquí.</span></div>}</div> : null}
            {section === 'ARCHIVE' ? <div className="fresh-archive"><div><strong>{notes.length}</strong><span>entradas accesibles</span></div><div><strong>{sharedCount}</strong><span>compartidas</span></div><div><strong>{privateCount}</strong><span>privadas</span></div></div> : null}
            <span className="fresh-page__number">{section === 'CLUES' ? '03' : section === 'SESSIONS' ? '04' : '05'}</span>
          </section>}
        </div>
      </article>
    </section>}
  </main>
}

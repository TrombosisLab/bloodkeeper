import { useEffect, useState } from 'react'

import { globalHistoryGateway } from '../infrastructure/global-history.api'
import type {
  ChronicleArchive as ChronicleArchiveData,
  GlobalHistoryChronicle,
} from '../types/global-history.types'

export function ChronicleArchive() {
  const [chronicles, setChronicles] = useState<readonly GlobalHistoryChronicle[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [archive, setArchive] = useState<ChronicleArchiveData | null>(null)
  const [loadingChronicles, setLoadingChronicles] = useState(true)
  const [loadingArchive, setLoadingArchive] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void globalHistoryGateway.chronicles()
      .then(({ items }) => {
        if (!active) return
        setChronicles(items)
        setSelectedId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null)
      })
      .catch(() => { if (active) setError('No se pudieron cargar tus crónicas.') })
      .finally(() => { if (active) setLoadingChronicles(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setArchive(null)
      return
    }
    let active = true
    setLoadingArchive(true)
    setError('')
    void globalHistoryGateway.chronicleArchive(selectedId)
      .then((response) => { if (active) setArchive(response) })
      .catch(() => { if (active) { setArchive(null); setError('No se pudo abrir el archivo de esta crónica.') } })
      .finally(() => { if (active) setLoadingArchive(false) })
    return () => { active = false }
  }, [selectedId])

  return (
    <section className="chronicle-archive" aria-label="Archivo de crónicas">
      <aside className="chronicle-archive__list">
        <header>
          <p>MEMORIA DE MESA</p>
          <h2>Tus crónicas</h2>
        </header>
        {loadingChronicles ? <p className="chronicle-archive__empty">Buscando tus crónicas…</p> : chronicles.length === 0 ? (
          <p className="chronicle-archive__empty">Aquí aparecerán las crónicas en las que participas.</p>
        ) : (
          <ul>{chronicles.map((chronicle) => (
            <li key={chronicle.id}>
              <button type="button" className={selectedId === chronicle.id ? 'is-active' : undefined} aria-pressed={selectedId === chronicle.id} onClick={() => setSelectedId(chronicle.id)}>
                <span>CRÓNICA</span><strong>{chronicle.name}</strong>
              </button>
            </li>
          ))}</ul>
        )}
      </aside>

      <section className="chronicle-archive__entries" aria-live="polite">
        {error ? <p className="chronicle-archive__empty" role="alert">{error}</p> : loadingArchive ? <p className="chronicle-archive__empty">Abriendo el archivo…</p> : archive ? (
          <>
            <header>
              <p>ARCHIVO DE CRÓNICA</p>
              <h2>{archive.chronicle.name}</h2>
              <span>{archive.items.length} {archive.items.length === 1 ? 'recuerdo' : 'recuerdos'}</span>
            </header>
            {archive.items.length === 0 ? <p className="chronicle-archive__empty">Todavía no hay resúmenes compartidos de partidas o historias cerradas.</p> : (
              <ol>{archive.items.map((item) => (
                <li key={`${item.kind}:${item.id}`}>
                  <article>
                    <div className="chronicle-archive__eyebrow">
                      <span>{item.kind === 'session' ? item.sessionNumber ? `SESIÓN ${item.sessionNumber}` : 'SESIÓN' : 'HISTORIA CERRADA'}</span>
                      {item.date ? <time dateTime={item.date}>{new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</time> : null}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </article>
                </li>
              ))}</ol>
            )}
          </>
        ) : <p className="chronicle-archive__empty">Selecciona una crónica para consultar su memoria compartida.</p>}
      </section>
    </section>
  )
}

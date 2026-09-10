import { createPortal } from 'react-dom'
/* REMOVE_PLAY_RESOURCES_SUBHEADERS_V1 */
import { useEffect, useMemo, useState } from 'react'
import { createChronicleGateway } from '../infrastructure/chronicle.api'
import type { ChronicleApiSnapshot } from '../types/chronicle-api.types'
import { ChronicleListCreate } from './ChronicleListCreate'
import './play-hub.css'

const gateway = createChronicleGateway()
const PAGE_SIZE = 3

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

interface PlayHubProps {
  readonly onOpenCharacter?: (characterId: string) => void
}

export function PlayHub({ onOpenCharacter }: PlayHubProps) {
  const [chronicles, setChronicles] = useState<readonly ChronicleApiSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(chronicles.length / PAGE_SIZE))
  const visibleChronicles = useMemo(
    () => chronicles.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [chronicles, currentPage],
  )

  async function loadChronicles() {
    setLoading(true)
    setError('')

    try {
      const result = await gateway.listPage({ limit: 25, offset: 0 })
      setChronicles(result.items.filter((chronicle) => chronicle.status === 'active'))
      setCurrentPage(0)
    } catch {
      setError('No se pudieron cargar las crónicas activas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadChronicles()
  }, [])

  if (selectedId !== null) {
    return (
      <ChronicleListCreate
        canCreateChronicles={false}
        initialDetailSection="play"
        onBackFromOpened={() => setSelectedId(null)}
        onOpenCharacter={onOpenCharacter}
        openChronicleId={selectedId}
      />
    )
  }

  return (
    <section className="play-hub">
      {typeof document !== 'undefined' && document.getElementById('app-header-page-actions')
        ? createPortal(
            <div className="play-hub__actions">
        <button disabled={loading} onClick={() => void loadChronicles()} type="button">
          Actualizar
        </button>
      </div>,
            document.getElementById('app-header-page-actions')!,
          )
        : null}


      {loading ? <p className="play-hub__status">Cargando crónicas activas…</p> : null}
      {!loading && error ? <p className="play-hub__error" role="alert">{error}</p> : null}
      {!loading && !error && chronicles.length === 0 ? (
        <section className="play-hub__empty">
          <h2>No tienes una crónica activa</h2>
          <p>Cuando una crónica esté activa y participes en ella, aparecerá aquí.</p>
        </section>
      ) : null}
      {!loading && !error && chronicles.length > 0 ? (
        <>
          <div className="play-hub__grid">
            {visibleChronicles.map((chronicle) => (
              <article className="play-hub__card" key={chronicle.id}>
                <div className="play-hub__cover">
                  <span aria-hidden="true">V5</span>
                  <img
                    alt=""
                    onError={(event) => { event.currentTarget.style.display = 'none' }}
                    src={`/api/chronicles/${chronicle.id}/cover`}
                  />
                </div>
                <div className="play-hub__content">
                  <small>CRÓNICA ACTIVA</small>
                  <h2>{chronicle.name}</h2>
                  <p>{chronicle.description || 'Sin descripción.'}</p>
                  <span>Actualizada {formatDate(chronicle.updatedAt)}</span>
                </div>
                <button className="play-hub__enter" onClick={() => setSelectedId(chronicle.id)} type="button">
                  Entrar a jugar →
                </button>
              </article>
            ))}
          </div>
          {pageCount > 1 ? (
            <nav aria-label="Navegación de crónicas" className="play-hub__pager">
              <button disabled={currentPage === 0} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} type="button">
                ← Anteriores
              </button>
              <span>{currentPage + 1} de {pageCount}</span>
              <button disabled={currentPage === pageCount - 1} onClick={() => setCurrentPage((page) => Math.min(pageCount - 1, page + 1))} type="button">
                Siguientes →
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

// PLAY_REFRESH_HEADER_ACTIONS_V1

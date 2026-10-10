import { useEffect, useState } from 'react'
import { readGuideResource } from '../infrastructure/story-guide-resources.api'
import type { GuideResource } from '../infrastructure/story-guide-resources.api'

export function StoryGuideResources({ chronicleId, ids, readOnly, onChange }: { chronicleId: string; ids: readonly string[]; readOnly: boolean; onChange: (ids: readonly string[]) => void }) {
  const [items, setItems] = useState<GuideResource[]>([]), [details, setDetails] = useState<Record<string, GuideResource | null>>({})
  const [source, setSource] = useState('chronicle'), [query, setQuery] = useState(''), [choice, setChoice] = useState(''), [opened, setOpened] = useState<string | null>(null), [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      try {
        const all: GuideResource[] = []; let offset: number | null = 0
        while (offset !== null) {
          const page: { items: GuideResource[]; nextOffset: number | null } | null = await readGuideResource(chronicleId, '?offset=' + offset, controller.signal)
          if (!page || !Array.isArray(page.items) || !(page.nextOffset === null || Number.isInteger(page.nextOffset) && page.nextOffset > offset)) throw new Error('Paginación inválida.')
          all.push(...page.items); if (all.length > 500) throw new Error('Hay más de 500 recursos.'); offset = page.nextOffset
        }
        setItems(all)
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Error al consultar recursos.') }
    })()
    return () => controller.abort()
  }, [chronicleId])
  useEffect(() => {
    const controller = new AbortController()
    void (async () => { try {
      const pairs = []
      for (const id of ids) pairs.push([id, await readGuideResource<GuideResource>(chronicleId, '/' + encodeURIComponent(id), controller.signal)] as const)
      setDetails(Object.fromEntries(pairs))
    } catch { if (!controller.signal.aborted) setError('No se pudieron actualizar las fichas; no se muestra información guardada en caché.') } })()
    return () => controller.abort()
  }, [chronicleId, ids.join(',')])
  const filtered = items.filter(item => (source !== 'chronicle' || item.inChronicle) && !ids.includes(item.id) && item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <section className="story-guide__connection-form"><strong>Recursos relacionados</strong><small>Enlaces a la ficha original. No incorpora recursos a la crónica ni cambia su visibilidad.</small>
    {error ? <p role="alert">{error}</p> : null}
    <label>Origen del recurso<select value={source} onChange={e => { setSource(e.target.value); setChoice('') }}><option value="chronicle">Recursos de esta crónica</option><option value="library">Biblioteca reutilizable</option></select></label>
    <label>Buscar recurso<input value={query} onChange={e => { setQuery(e.target.value); setChoice('') }} /></label>
    <label>Recurso<select value={choice} onChange={e => setChoice(e.target.value)}><option value="">Selecciona un recurso</option>{filtered.map(item => <option key={item.id} value={item.id}>{item.name} · {item.kind}</option>)}</select></label>
    <button type="button" disabled={readOnly || !choice || ids.length >= 12 || !!error} onClick={() => { onChange([...ids, choice]); setChoice('') }}>＋ Relacionar recurso</button>
    {ids.map(id => <div key={id}><span>{details[id]?.name ?? 'Recurso no disponible'} {details[id]?.status === 'archived' ? '(archivado)' : ''}</span><button type="button" disabled={!details[id] || !!error} onClick={async () => {
      setOpened(null)
      try { const fresh = await readGuideResource<GuideResource>(chronicleId, '/' + encodeURIComponent(id), new AbortController().signal); setDetails(current => ({ ...current, [id]: fresh })); setOpened(id) } catch { setError('La ficha ya no está disponible o autorizada.') }
    }}>Consultar ficha</button><button type="button" disabled={readOnly} aria-label="Quitar referencia al recurso" onClick={() => { onChange(ids.filter(value => value !== id)); setOpened(null) }}>×</button>
    {opened === id && details[id] && !error ? <article><h4>{details[id]!.name}</h4><p>{details[id]!.summary || 'Sin descripción.'}</p><strong>Nota privada del narrador</strong><p style={{ whiteSpace: 'pre-wrap' }}>{details[id]!.narratorNotes || 'Sin notas privadas.'}</p><button type="button" onClick={() => setOpened(null)}>Cerrar ficha</button></article> : null}</div>)}
  </section>
}

import { FormEvent, useEffect, useState } from 'react'
import { createLifecycleTrashGateway, LifecycleTrashApiError } from '../infrastructure/lifecycle-trash.api'
import type { LifecycleTrashDependencies, LifecycleTrashItem, LifecycleTrashKind } from '../types/lifecycle-trash.types'
import './lifecycle-trash-panel.css'

const api = createLifecycleTrashGateway()

const kinds: readonly { value: '' | LifecycleTrashKind; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'user', label: 'Usuarios' },
  { value: 'participant', label: 'Participantes' },
  { value: 'chronicle', label: 'Crónicas' },
  { value: 'character', label: 'Personajes' },
  { value: 'story', label: 'Historias' },
  { value: 'session', label: 'Sesiones' },
  { value: 'event', label: 'Sucesos' },
  { value: 'npc', label: 'PNJ' },
  { value: 'location', label: 'Localizaciones' },
  { value: 'resource', label: 'Recursos' },
]

function kindLabel(kind: LifecycleTrashKind): string {
  return kinds.find((value) => value.value === kind)?.label ?? kind
}

export function LifecycleTrashPanel() {
  const [items, setItems] = useState<readonly LifecycleTrashItem[]>([])
  const [counts, setCounts] = useState<Partial<Record<LifecycleTrashKind, number>>>({})
  const [kind, setKind] = useState<'' | LifecycleTrashKind>('')
  const [query, setQuery] = useState('')
  const [updatedFrom, setUpdatedFrom] = useState('')
  const [updatedTo, setUpdatedTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<LifecycleTrashDependencies | null>(null)

  const load = async (
    selectedKind: '' | LifecycleTrashKind = kind,
    selectedQuery: string = query,
    selectedFrom: string = updatedFrom,
    selectedTo: string = updatedTo,
  ) => {
    setLoading(true)
    try {
      const page = await api.list({ kind: selectedKind || undefined, query: selectedQuery, updatedFrom: selectedFrom, updatedTo: selectedTo, limit: 100, offset: 0 })
      setItems(page.items)
      setCounts(page.counts)
      setMessage(page.nextOffset === null ? '' : 'Se muestran los primeros 100 elementos.')
    } catch {
      setMessage('No se pudo cargar el archivo y la papelera.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load('', '', '', '') }, [])

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void load()
  }

  const inspect = async (value: LifecycleTrashItem) => {
    setBusy(value.id)
    try {
      setDetails(await api.dependencies(value.kind, value.id))
      setMessage('')
    } catch {
      setMessage('No se pudieron calcular las dependencias.')
    } finally {
      setBusy(null)
    }
  }

  const restore = async (value: LifecycleTrashItem) => {
    if (!window.confirm('¿Restaurar ' + value.label + '?')) return
    setBusy(value.id)
    try {
      await api.restore(value.kind, value.id)
      setDetails(null)
      setMessage('Elemento restaurado.')
      await load()
    } catch (error) {
      setMessage(error instanceof LifecycleTrashApiError && error.blockers.length > 0
        ? error.blockers.join(' · ')
        : 'No se pudo restaurar el elemento.')
    } finally {
      setBusy(null)
    }
  }

  const purge = async (value: LifecycleTrashItem) => {
    setBusy(value.id)
    try {
      const dependencies = await api.dependencies(value.kind, value.id)
      setDetails(dependencies)
      if (!dependencies.canPurge) {
        setMessage(dependencies.blockers.join(' · '))
        return
      }
      const confirmation = window.prompt('El borrado es irreversible. Escribe exactamente: ' + value.label)
      if (confirmation === null) return
      await api.purge(value.kind, value.id, confirmation)
      setDetails(null)
      setMessage('Elemento eliminado definitivamente.')
      await load()
    } catch (error) {
      setMessage(error instanceof LifecycleTrashApiError && error.blockers.length > 0
        ? error.blockers.join(' · ')
        : 'No se pudo eliminar definitivamente el elemento.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="lifecycle-trash">
      <header className="lifecycle-trash__header">
        <div><p className="eyebrow">CICLO DE VIDA</p><h2>Archivo y papelera</h2><p>Restaura elementos o elimina definitivamente sólo los que no conservan historia protegida.</p></div>
        <span>{items.length}</span>
      </header>

      <div className="lifecycle-trash__counts" aria-label="Elementos archivados por tipo">
        {kinds.filter((value): value is { value: LifecycleTrashKind; label: string } => value.value !== '').map((value) => (
          <button key={value.value} type="button" className={kind === value.value ? 'is-active' : ''} onClick={() => { setKind(value.value); void load(value.value, query, updatedFrom, updatedTo) }}>
            <span>{value.label}</span><strong>{counts[value.value] ?? 0}</strong>
          </button>
        ))}
      </div>

      <form className="lifecycle-trash__filters" onSubmit={search}>
        <select aria-label="Tipo de elemento" value={kind} onChange={(event) => setKind(event.target.value as '' | LifecycleTrashKind)}>
          {kinds.map((value) => <option key={value.value || 'all'} value={value.value}>{value.label}</option>)}
        </select>
        <input aria-label="Buscar en archivo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o contexto" />
        <label><span>Desde</span><input aria-label="Actualizado desde" type="date" value={updatedFrom} onChange={(event) => setUpdatedFrom(event.target.value)} /></label>
        <label><span>Hasta</span><input aria-label="Actualizado hasta" type="date" value={updatedTo} onChange={(event) => setUpdatedTo(event.target.value)} /></label>
        <button type="submit">Buscar</button>
      </form>

      {message ? <p className="lifecycle-trash__notice" role="status">{message}</p> : null}

      <div className="lifecycle-trash__layout">
        <article className="lifecycle-trash__list">
          {loading ? <p>Cargando archivo…</p> : items.length === 0 ? <p className="lifecycle-trash__empty">No hay elementos archivados o desactivados.</p> : items.map((value) => (
            <div className="lifecycle-trash__item" key={value.kind + ':' + value.id}>
              <div><small>{kindLabel(value.kind)}</small><strong>{value.label}</strong><span>{value.context ?? 'Sin contexto adicional'}</span></div>
              <div className="lifecycle-trash__actions">
                <button type="button" disabled={busy === value.id} onClick={() => void inspect(value)}>Dependencias</button>
                <button type="button" disabled={!value.canRestore || busy === value.id} onClick={() => void restore(value)}>Restaurar</button>
                {value.kind !== 'participant' && value.canPurge ? <button type="button" className="lifecycle-trash__purge" disabled={busy === value.id} onClick={() => void purge(value)}>Eliminar definitivamente</button> : null}
              </div>
            </div>
          ))}
        </article>

        <aside className="lifecycle-trash__details">
          <p className="eyebrow">DEPENDENCIAS</p>
          {details === null ? <p>Selecciona un elemento para analizar si puede eliminarse de forma segura.</p> : <>
            <h3>{details.label}</h3>
            <dl>{Object.entries(details.counts).map(([name, count]) => <div key={name}><dt>{name.replaceAll('_', ' ')}</dt><dd>{count}</dd></div>)}</dl>
            {details.blockers.length > 0 ? <><strong>Bloqueos</strong><ul>{details.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></> : <p className="lifecycle-trash__safe">Sin dependencias protegidas.</p>}
          </>}
        </aside>
      </div>
    </section>
  )
}

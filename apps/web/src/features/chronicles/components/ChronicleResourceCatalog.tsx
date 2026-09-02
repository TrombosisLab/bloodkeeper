import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './chronicle-resource-catalog.css'

export type ChronicleResourceCatalogKind = 'document' | 'artifact' | 'organization'
export type ChronicleResourceOrder = 'name' | 'recent'

interface Item {
  readonly id: string
  readonly kind: ChronicleResourceCatalogKind
  readonly name: string
  readonly summary: string | null
  readonly narratorNotes: string | null
  readonly visibility: 'narrator_only' | 'chronicle_participants'
  readonly metadata: unknown
  readonly status: 'active' | 'archived'
  readonly createdAt: string
  readonly updatedAt: string
}

interface Props {
  readonly chronicleId: string
  readonly kind: ChronicleResourceCatalogKind
  readonly query: string
  readonly order: ChronicleResourceOrder
  readonly onCountChange?: (kind: ChronicleResourceCatalogKind, count: number) => void
}

const labels = {
  document: { plural: 'Documentos', singular: 'Documento', description: 'Añade material escrito, pistas, cartas o archivos de consulta.' },
  artifact: { plural: 'Artefactos', singular: 'Artefacto', description: 'Registra objetos narrativos, reliquias y elementos con historia propia.' },
  organization: { plural: 'Organizaciones', singular: 'Organización', description: 'Documenta facciones, instituciones, cultos y grupos de poder.' },
} as const

async function responseJson(response: Response) {
  const value = await response.json().catch(() => null)
  if (!response.ok) throw new Error('RESOURCE_REQUEST_FAILED')
  return value
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function ChronicleResourceCatalog({ chronicleId, kind, query, order, onCountChange }: Props) {
  const [items, setItems] = useState<readonly Item[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [visibility, setVisibility] = useState<'narrator_only' | 'chronicle_participants'>('narrator_only')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const copy = labels[kind]

  async function load(preferredId?: string) {
    setError(null)
    try {
      const value = await responseJson(await fetch('/api/chronicles/' + chronicleId + '/resources?kind=' + kind + '&limit=100&offset=0', { credentials: 'include' })) as { items: readonly Item[] }
      setItems(value.items)
      onCountChange?.(kind, value.items.length)
      setSelected(value.items.find((item) => item.id === preferredId) ?? value.items[0] ?? null)
    } catch {
      setError('No se pudo cargar el catálogo.')
    }
  }

  useEffect(() => {
    setShowCreateForm(false)
    setEditing(false)
    void load()
  }, [chronicleId, kind])

  const visibleItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es')
    return [...items]
      .filter((item) => !term || (item.name + ' ' + (item.summary ?? '')).toLocaleLowerCase('es').includes(term))
      .sort((left, right) => order === 'recent' ? Date.parse(right.updatedAt) - Date.parse(left.updatedAt) : left.name.localeCompare(right.name, 'es'))
  }, [items, order, query])

  function resetForm() {
    setName('')
    setSummary('')
    setNotes('')
    setVisibility('narrator_only')
  }

  function closeForms() {
    resetForm()
    setShowCreateForm(false)
    setEditing(false)
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = name.trim()
    if (!normalizedName) {
      setError('El nombre del recurso es obligatorio.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const created = await responseJson(await fetch('/api/chronicles/' + chronicleId + '/resources', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, name: normalizedName, summary: summary.trim() || null, narratorNotes: notes.trim() || null, visibility }),
      })) as Item
      closeForms()
      await load(created.id)
    } catch {
      setError('No se pudo crear el recurso.')
    } finally {
      setBusy(false)
    }
  }

  function beginEdit() {
    if (!selected) return
    setName(selected.name)
    setSummary(selected.summary ?? '')
    setNotes(selected.narratorNotes ?? '')
    setVisibility(selected.visibility)
    setEditing(true)
    setShowCreateForm(false)
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const normalizedName = name.trim()
    if (!normalizedName) {
      setError('El nombre del recurso es obligatorio.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await responseJson(await fetch('/api/chronicles/' + chronicleId + '/resources/' + selected.id, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizedName, summary: summary.trim() || null, narratorNotes: notes.trim() || null, visibility }),
      }))
      closeForms()
      await load(selected.id)
    } catch {
      setError('No se pudo actualizar el recurso.')
    } finally {
      setBusy(false)
    }
  }

  async function archive() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await responseJson(await fetch('/api/chronicles/' + chronicleId + '/resources/' + selected.id + '/archive', { method: 'PATCH', credentials: 'include' }))
      await load(selected.id)
    } catch {
      setError('No se pudo archivar el recurso.')
    } finally {
      setBusy(false)
    }
  }

  const fields = <>
    <label><span>Nombre</span><input required value={name} onChange={(event) => setName(event.target.value)} /></label>
    <label><span>Resumen narrativo</span><textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
    <label><span>Notas privadas</span><textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    <label><span>Visibilidad en la mesa</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as 'narrator_only' | 'chronicle_participants')}><option value="narrator_only">Solo Narrador</option><option value="chronicle_participants">Compartido con participantes</option></select></label>
  </>

  return <section className="chronicle-resource-catalog" aria-label={'Gestión de ' + copy.plural}>
    <button type="button" className="chronicle-resource-catalog__create-launcher" aria-expanded={showCreateForm} aria-controls="chronicle-resource-catalog-create" onClick={() => { resetForm(); setEditing(false); setShowCreateForm((current) => !current) }}>
      <span><strong>Crear {copy.singular}</strong><small>{copy.description}</small></span><i aria-hidden="true">{showCreateForm ? '−' : '+'}</i>
    </button>

    {showCreateForm ? <form id="chronicle-resource-catalog-create" className="chronicle-resource-catalog__create-panel" onSubmit={create}><header><h3>Crear {copy.singular.toLocaleLowerCase('es')}</h3><button type="button" onClick={closeForms}>Cancelar</button></header><div className="chronicle-resource-catalog__fields">{fields}</div><button type="submit" disabled={busy || !name.trim()}>{busy ? 'Guardando…' : 'Crear ' + copy.singular}</button></form> : null}
    {error ? <p className="chronicle-resource-catalog__error" role="alert">{error}</p> : null}

    <div className="chronicle-resource-catalog__workspace">
      <aside className="chronicle-resource-catalog__browser" aria-label={'Listado de ' + copy.plural}>
        <header><h3>{copy.plural}</h3><span>{visibleItems.length}</span></header>
        {visibleItems.length === 0 ? <p className="chronicle-resource-catalog__empty-list">No hay {copy.plural.toLocaleLowerCase('es')} que coincidan con los filtros.</p> : <ul>{visibleItems.map((item) => <li key={item.id}><button type="button" className={selected?.id === item.id ? 'is-active' : ''} aria-pressed={selected?.id === item.id} onClick={() => { setSelected(item); setEditing(false) }}><strong>{item.name}</strong><small>{item.summary ?? 'Sin resumen'}</small><em>{item.status === 'active' ? 'Activo' : 'Archivado'}</em></button></li>)}</ul>}
      </aside>

      <main className="chronicle-resource-catalog__detail">
        {selected === null ? <div className="chronicle-resource-catalog__detail-empty"><span>{copy.singular.toLocaleUpperCase('es')}</span><h3>Selecciona una entrada</h3><p>Abre un elemento del listado o crea el primer recurso de esta categoría.</p></div> : editing ? <form className="chronicle-resource-catalog__edit" onSubmit={update}><header><div><small>DETALLE DEL {copy.singular.toLocaleUpperCase('es')}</small><h3>Editar {selected.name}</h3></div></header><div className="chronicle-resource-catalog__fields">{fields}</div><div className="chronicle-resource-catalog__actions"><button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button><button type="button" onClick={closeForms}>Cancelar</button></div></form> : <>
          <header className="chronicle-resource-catalog__detail-heading"><div><small>DETALLE DEL {copy.singular.toLocaleUpperCase('es')}</small><h3>{selected.name}</h3></div><div><span>{selected.status === 'active' ? 'Activo' : 'Archivado'}</span><button type="button" onClick={beginEdit}>Editar</button></div></header>
          <div className="chronicle-resource-catalog__detail-grid"><article className="is-wide"><h4>Descripción narrativa</h4><p>{selected.summary ?? 'Sin resumen.'}</p></article><article className="is-private"><small>SOLO NARRADOR</small><h4>Notas privadas</h4><p>{selected.narratorNotes ?? 'Sin notas.'}</p></article><article><h4>Estado del recurso</h4><dl><dt>Tipo</dt><dd>{copy.singular}</dd><dt>Estado</dt><dd>{selected.status === 'active' ? 'Activo' : 'Archivado'}</dd><dt>Visibilidad</dt><dd>{selected.visibility === 'chronicle_participants' ? 'Compartido' : 'Solo Narrador'}</dd></dl></article><article><h4>Registro</h4><dl><dt>Creado</dt><dd>{displayDate(selected.createdAt)}</dd><dt>Actualizado</dt><dd>{displayDate(selected.updatedAt)}</dd></dl></article></div>
          {selected.status === 'active' ? <footer className="chronicle-resource-catalog__actions"><button type="button" disabled={busy} onClick={() => void archive()}>Archivar</button></footer> : null}
        </>}
      </main>
    </div>
  </section>
}

import { useEffect, useMemo, useState } from 'react'
import './chronicle-resource-catalog.css'
import { ChronicleEntityImage } from './ChronicleEntityImage'

export type ChronicleResourceCatalogKind = 'npc' | 'location' | 'document' | 'artifact' | 'organization'
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

interface LibraryItem {
  readonly id: string
  readonly kind: ChronicleResourceCatalogKind
  readonly name: string
  readonly summary: string | null
  readonly narratorNotes: string | null
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
  npc: { plural: 'PNJ', singular: 'PNJ', description: 'Vincula un PNJ del catálogo global a esta crónica.' },
  location: { plural: 'Localizaciones', singular: 'Localización', description: 'Vincula una localización del catálogo global a esta crónica.' },
  document: { plural: 'Documentos', singular: 'Documento', description: 'Vincula una ficha del catálogo global a esta crónica.' },
  artifact: { plural: 'Artefactos', singular: 'Artefacto', description: 'Vincula una ficha del catálogo global a esta crónica.' },
  organization: { plural: 'Organizaciones', singular: 'Organización', description: 'Vincula una ficha del catálogo global a esta crónica.' },
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
  const [libraryItems, setLibraryItems] = useState<readonly LibraryItem[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [showAttachForm, setShowAttachForm] = useState(false)
  const [selectedLibraryId, setSelectedLibraryId] = useState('')
  const [visibility, setVisibility] = useState<'narrator_only' | 'chronicle_participants'>('narrator_only')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const copy = labels[kind]

  async function load(preferredId?: string) {
    setError(null)
    try {
      const [linkedValue, libraryValue] = await Promise.all([
        await responseJson(await fetch('/api/chronicles/' + chronicleId + '/resources?kind=' + kind + '&limit=100&offset=0', { credentials: 'include' })) as { items: readonly Item[] },
        await responseJson(await fetch('/api/library/resources?kind=' + kind + '&status=active', { credentials: 'include' })) as { items: readonly LibraryItem[] },
      ])
      setItems(linkedValue.items)
      const linkedIds = new Set(linkedValue.items.map((item) => item.id))
      setLibraryItems(libraryValue.items.filter((item) => !linkedIds.has(item.id)))
      onCountChange?.(kind, linkedValue.items.length)
      const nextSelected = linkedValue.items.find((item) => item.id === preferredId) ?? linkedValue.items[0] ?? null
      setSelected(nextSelected)
      setVisibility(nextSelected?.visibility ?? 'narrator_only')
      setSelectedLibraryId((current) => current && libraryValue.items.some((item) => item.id === current && !linkedIds.has(item.id)) ? current : libraryValue.items.find((item) => !linkedIds.has(item.id))?.id ?? '')
    } catch {
      setError('No se pudo cargar el catálogo global de recursos.')
    }
  }

  useEffect(() => {
    setShowAttachForm(false)
    void load()
  }, [chronicleId, kind])

  const visibleItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es')
    return [...items].filter((item) => !term || (item.name + ' ' + (item.summary ?? '')).toLocaleLowerCase('es').includes(term)).sort((left, right) => order === 'recent' ? Date.parse(right.updatedAt) - Date.parse(left.updatedAt) : left.name.localeCompare(right.name, 'es'))
  }, [items, order, query])

  async function attach() {
    if (!selectedLibraryId) {
      setError('Selecciona un recurso global.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await responseJson(await fetch('/api/library/resources/' + selectedLibraryId + '/attach', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chronicleId, visibility }),
      }))
      setShowAttachForm(false)
      await load(selectedLibraryId)
    } catch {
      setError('No se pudo añadir el recurso a esta crónica.')
    } finally {
      setBusy(false)
    }
  }

  async function saveVisibility() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await responseJson(await fetch('/api/chronicles/' + chronicleId + '/resources/' + selected.id, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      }))
      await load(selected.id)
    } catch {
      setError('No se pudo actualizar la visibilidad del recurso.')
    } finally {
      setBusy(false)
    }
  }

  async function detach() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await responseJson(await fetch('/api/chronicles/' + chronicleId + '/resources/' + selected.id, { method: 'DELETE', credentials: 'include' }))
      await load()
    } catch {
      setError('No se pudo quitar el recurso de esta crónica.')
    } finally {
      setBusy(false)
    }
  }

  const assetType = kind === 'npc' ? 'NPC' : kind === 'location' ? 'LOCATION' : 'RESOURCE'

  return <section className="chronicle-resource-catalog" aria-label={'Gestión de ' + copy.plural}>
    <button type="button" className="chronicle-resource-catalog__create-launcher" aria-expanded={showAttachForm} aria-controls="chronicle-resource-catalog-attach" onClick={() => setShowAttachForm((current) => !current)}>
      <span><strong>Añadir recurso existente</strong><small>{copy.description}</small></span><i aria-hidden="true">{showAttachForm ? '−' : '+'}</i>
    </button>
    {showAttachForm ? <section id="chronicle-resource-catalog-attach" className="chronicle-resource-catalog__create-panel" aria-label="Añadir recurso global"><header><div><h3>Catálogo global</h3><small>Los recursos se crean y editan desde Recursos.</small></div><a href="#/resources">Gestionar Recursos</a></header>{libraryItems.length > 0 ? <><label><span>Recurso de {copy.plural.toLocaleLowerCase('es')}</span><select value={selectedLibraryId} onChange={(event) => setSelectedLibraryId(event.target.value)}><option value="">Selecciona una ficha…</option>{libraryItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Visibilidad en esta crónica</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as 'narrator_only' | 'chronicle_participants')}><option value="narrator_only">Solo Narrador</option><option value="chronicle_participants">Compartido con participantes</option></select></label><button type="button" onClick={() => void attach()} disabled={busy || !selectedLibraryId}>{busy ? 'Añadiendo…' : 'Añadir a esta crónica'}</button></> : <p>No hay recursos disponibles de esta categoría. <a href="#/resources">Crea o revisa la ficha en Recursos.</a></p>}</section> : null}
    {error ? <p className="chronicle-resource-catalog__error" role="alert">{error}</p> : null}
    <div className="chronicle-resource-catalog__workspace">
      <aside className="chronicle-resource-catalog__browser" aria-label={'Listado de ' + copy.plural}><header><h3>{copy.plural}</h3><span>{visibleItems.length}</span></header>{visibleItems.length === 0 ? <p className="chronicle-resource-catalog__empty-list">No hay {copy.plural.toLocaleLowerCase('es')} vinculados a esta crónica.</p> : <ul>{visibleItems.map((item) => <li key={item.id}><button type="button" className={selected?.id === item.id ? 'is-active' : ''} aria-pressed={selected?.id === item.id} onClick={() => setSelected(item)}><strong>{item.name}</strong><small>{item.summary ?? 'Sin resumen'}</small><em>{item.status === 'active' ? 'Activo' : 'Archivado'}</em></button></li>)}</ul>}</aside>
      <main className="chronicle-resource-catalog__detail">
        {selected === null ? <div className="chronicle-resource-catalog__detail-empty"><span>{copy.singular.toLocaleUpperCase('es')}</span><h3>Selecciona una entrada</h3><p>Vincula una ficha existente desde el catálogo global de Recursos.</p></div> : <><header className="chronicle-resource-catalog__detail-heading"><div><small>DETALLE DEL {copy.singular.toLocaleUpperCase('es')}</small><h3>{selected.name}</h3></div><div><span>{selected.status === 'active' ? 'Activo' : 'Archivado'}</span><button type="button" disabled={busy} onClick={() => void detach()}>Quitar de esta crónica</button></div></header><ChronicleEntityImage key={selected.id} chronicleId={chronicleId} assetType={assetType} assetId={selected.id} label={selected.name} /><div className="chronicle-resource-catalog__detail-grid"><article className="is-wide"><h4>Descripción narrativa</h4><p>{selected.summary ?? 'Sin resumen.'}</p></article><article className="is-private"><small>SOLO NARRADOR</small><h4>Notas privadas</h4><p>{selected.narratorNotes ?? 'Sin notas.'}</p></article><article><h4>Estado del recurso</h4><dl><dt>Tipo</dt><dd>{copy.singular}</dd><dt>Estado</dt><dd>{selected.status === 'active' ? 'Activo' : 'Archivado'}</dd><dt>Visibilidad actual</dt><dd>{selected.visibility === 'chronicle_participants' ? 'Compartido con participantes' : 'Solo Narrador'}</dd></dl></article><article className="chronicle-resource-catalog__visibility-editor"><h4>Visibilidad en esta crónica</h4><label><span>Quién puede verlo</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as 'narrator_only' | 'chronicle_participants')}><option value="narrator_only">Solo Narrador</option><option value="chronicle_participants">Compartido con participantes</option></select></label><button type="button" disabled={busy || selected.status !== 'active'} onClick={() => void saveVisibility()}>{busy ? 'Guardando…' : 'Guardar visibilidad'}</button></article><article><h4>Registro</h4><dl><dt>Creado</dt><dd>{displayDate(selected.createdAt)}</dd><dt>Actualizado</dt><dd>{displayDate(selected.updatedAt)}</dd></dl></article></div></>}
      </main>
    </div>
  </section>
}

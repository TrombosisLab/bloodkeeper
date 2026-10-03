import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import type {
  FormEvent,
} from 'react'

import {
  globalHistoryGateway,
} from '../infrastructure/global-history.api'
import { ChronicleArchive } from './ChronicleArchive'

import type {
  GlobalHistoryCategory,
  GlobalHistoryChronicle,
  GlobalHistoryEntry,
  GlobalHistoryEntryInput,
  GlobalHistoryList,
  GlobalHistorySourceKind,
  GlobalHistoryStatus,
  GlobalHistoryVisibility,
  HistoryReference,
} from '../types/global-history.types'

import './global-history-page.css'

const categories = [
  'event',
  'era',
  'person',
  'organization',
  'place',
  'other',
] as const satisfies readonly GlobalHistoryCategory[]
const HISTORY_PAGE_SIZE = 5

const categoryLabels:
  Record<GlobalHistoryCategory, string> = {
    event: 'Acontecimientos',
    era: 'Épocas',
    person: 'Personajes',
    organization: 'Organizaciones',
    place: 'Lugares',
    other: 'Otros',
  }

const categorySingular:
  Record<GlobalHistoryCategory, string> = {
    event: 'Acontecimiento',
    era: 'Época',
    person: 'Personaje',
    organization: 'Organización',
    place: 'Lugar',
    other: 'Otro',
  }

const sourceLabels:
  Record<GlobalHistorySourceKind, string> = {
    canon: 'Canon oficial',
    custom: 'Creación propia',
    alternate: 'Versión alternativa',
  }

const visibilityLabels:
  Record<GlobalHistoryVisibility, string> = {
    all_users: 'Todos los usuarios',
    narrators_only: 'Solo narradores',
    private: 'Privada',
  }

const statusLabels:
  Record<GlobalHistoryStatus, string> = {
    draft: 'Borrador',
    published: 'Publicada',
    archived: 'Archivada',
  }

interface HistoryDraft {
  readonly references: readonly HistoryReference[]
  readonly imageCaption: string
  readonly imageCredit: string
  readonly title: string
  readonly periodLabel: string
  readonly startYear: string
  readonly endYear: string
  readonly category: GlobalHistoryCategory
  readonly summary: string
  readonly content: string
  readonly sourceKind: GlobalHistorySourceKind
  readonly visibility: GlobalHistoryVisibility
  readonly status: 'draft' | 'published'
  readonly tags: string
  readonly chronicleIds: readonly string[]
}

const emptyDraft: HistoryDraft = {
  references: [], imageCaption: '', imageCredit: '',
  title: '',
  periodLabel: '',
  startYear: '',
  endYear: '',
  category: 'event',
  summary: '',
  content: '',
  sourceKind: 'custom',
  visibility: 'all_users',
  status: 'draft',
  tags: '',
  chronicleIds: [],
}

function yearLabel(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} a. C.`
  }

  return String(year)
}

function periodFor(
  entry: GlobalHistoryEntry,
): string {
  if (entry.periodLabel?.trim()) {
    return entry.periodLabel
  }

  if (
    entry.startYear !== null &&
    entry.endYear !== null &&
    entry.startYear !== entry.endYear
  ) {
    return `${yearLabel(entry.startYear)}–${yearLabel(entry.endYear)}`
  }

  if (entry.startYear !== null) {
    return yearLabel(entry.startYear)
  }

  if (entry.endYear !== null) {
    return yearLabel(entry.endYear)
  }

  return 'Fecha desconocida'
}

function draftFor(
  entry: GlobalHistoryEntry,
): HistoryDraft {
  return {
    references: entry.references ?? [], imageCaption: entry.imageCaption ?? '', imageCredit: entry.imageCredit ?? '',
    title: entry.title,
    periodLabel:
      entry.periodLabel ?? '',
    startYear:
      entry.startYear?.toString() ?? '',
    endYear:
      entry.endYear?.toString() ?? '',
    category: entry.category,
    summary: entry.summary ?? '',
    content: entry.content,
    sourceKind: entry.sourceKind,
    visibility: entry.visibility,
    status:
      entry.status === 'published'
        ? 'published'
        : 'draft',
    tags: entry.tags.join(', '),
    chronicleIds:
      entry.chronicles.map(
        (chronicle) => chronicle.id,
      ),
  }
}

function inputFor(
  draft: HistoryDraft,
): GlobalHistoryEntryInput {
  const tags = draft.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  return {
    references: draft.references, imageCaption: draft.imageCaption.trim() || null, imageCredit: draft.imageCredit.trim() || null,
    title: draft.title.trim(),
    periodLabel:
      draft.periodLabel.trim() || null,
    startYear:
      draft.startYear.trim() === ''
        ? null
        : Number(draft.startYear),
    endYear:
      draft.endYear.trim() === ''
        ? null
        : Number(draft.endYear),
    category: draft.category,
    summary:
      draft.summary.trim() || null,
    content: draft.content.trim(),
    sourceKind: draft.sourceKind,
    visibility: draft.visibility,
    status: draft.status,
    tags,
    chronicleIds: draft.chronicleIds,
  }
}

function chronologyValue(
  entry: GlobalHistoryEntry,
): number {
  return entry.startYear ??
    entry.endYear ??
    Number.NEGATIVE_INFINITY
}

export function GlobalHistoryPage() {
  const [data, setData] =
    useState<GlobalHistoryList | null>(null)
  const [selectedId, setSelectedId] =
    useState<string | null>(null)
  const [search, setSearch] =
    useState('')
  const [category, setCategory] =
    useState<GlobalHistoryCategory | 'all'>('all')
  const [historyView, setHistoryView] =
    useState<'world' | 'chronicles'>('world')
  const [entryPage, setEntryPage] = useState(0)
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'published' | 'draft'>('all')
  const [oldestFirst, setOldestFirst] =
    useState(true)
  const [editing, setEditing] =
    useState<GlobalHistoryEntry | 'new' | null>(null)
  const [draft, setDraft] =
    useState<HistoryDraft>(emptyDraft)
  const [loading, setLoading] =
    useState(true)
  const [saving, setSaving] =
    useState(false)
  const [message, setMessage] =
    useState('')
  const [catalog, setCatalog] = useState<readonly HistoryReference[]>([])
  const [referenceSearch, setReferenceSearch] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [preview, setPreview] = useState<{ label: string; description: string; category?: string } | null>(null)
  const [expandedImage, setExpandedImage] = useState(false)

  async function load(
    preferredId?: string,
  ): Promise<void> {
    setLoading(true)

    try {
      const response =
        await globalHistoryGateway.list()
      setData(response)
      setSelectedId((current) => {
        const desired =
          preferredId ?? current

        return response.items.some(
          (entry) =>
            entry.id === desired,
        )
          ? desired
          : response.items[0]?.id ?? null
      })
    } catch {
      setMessage(
        'No se pudo cargar la historia global.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const normalizedSearch =
      search.trim().toLocaleLowerCase('es')

    const items = (data?.items ?? [])
      .filter(
        (entry) =>
          category === 'all' ||
          entry.category === category,
      )
      .filter(
        (entry) =>
          statusFilter === 'all' ||
          entry.status === statusFilter,
      )
      .filter((entry) => {
        if (!normalizedSearch) return true

        return [
          entry.title,
          entry.periodLabel ?? '',
          entry.summary ?? '',
          entry.content,
          ...entry.tags,
        ].some((value) =>
          value
            .toLocaleLowerCase('es')
            .includes(normalizedSearch),
        )
      })
      .slice()

    items.sort((left, right) => {
      const difference =
        chronologyValue(left) -
        chronologyValue(right)

      if (difference !== 0) {
        return oldestFirst
          ? difference
          : -difference
      }

      return left.title.localeCompare(
        right.title,
        'es',
      )
    })

    return items
  }, [
    category,
    data?.items,
    oldestFirst,
    search,
    statusFilter,
  ])

  const pageCount = Math.ceil(filtered.length / HISTORY_PAGE_SIZE)
  const currentEntryPage = Math.min(entryPage, Math.max(0, pageCount - 1))
  const pageEntries = filtered.slice(
    currentEntryPage * HISTORY_PAGE_SIZE,
    (currentEntryPage + 1) * HISTORY_PAGE_SIZE,
  )
  const selected =
    pageEntries.find(
      (entry) => entry.id === selectedId,
    ) ?? pageEntries[0] ?? null

  useEffect(() => {
    setEntryPage(0)
  }, [category, oldestFirst, search, statusFilter])

  useEffect(() => {
    if (editing === null && preview === null && !expandedImage) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [editing, preview, expandedImage])

  useEffect(() => {
    if (editing === null) return
    let active = true
    void globalHistoryGateway.catalog().then(result => { if (active) setCatalog(result.items) }).catch(() => { if (active) setMessage('No se pudo cargar el selector de menciones.') })
    return () => { active = false }
  }, [editing])

  function beginCreate(): void {
    setImageFile(null); setRemoveImage(false); setReferenceSearch('')
    setDraft(emptyDraft)
    setEditing('new')
    setMessage('')
  }

  function beginEdit(
    entry: GlobalHistoryEntry,
  ): void {
    setImageFile(null); setRemoveImage(false); setReferenceSearch('')
    setDraft(draftFor(entry))
    setEditing(entry)
    setMessage('')
  }

  function updateDraft<K extends keyof HistoryDraft>(
    key: K,
    value: HistoryDraft[K],
  ): void {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function toggleChronicle(
    chronicle: GlobalHistoryChronicle,
  ): void {
    updateDraft(
      'chronicleIds',
      draft.chronicleIds.includes(
        chronicle.id,
      )
        ? draft.chronicleIds.filter(
            (id) => id !== chronicle.id,
          )
        : [
            ...draft.chronicleIds,
            chronicle.id,
          ],
    )
  }

  async function save(
    event: FormEvent,
  ): Promise<void> {
    event.preventDefault()

    if (
      editing === null ||
      !draft.title.trim() ||
      saving
    ) {
      return
    }

    setSaving(true)

    try {
      const input = inputFor(draft)
      const saved = editing === 'new'
        ? await globalHistoryGateway.create(input)
        : await globalHistoryGateway.update(
            editing.id,
            input,
          )

      // Keep the persisted ID after a partial save, so retrying cannot create duplicates.
      setEditing(saved)
      if (imageFile) await globalHistoryGateway.uploadImage(saved.id, imageFile)
      else if (removeImage) await globalHistoryGateway.removeImage(saved.id)
      setImageFile(null); setRemoveImage(false)
      setEditing(null)
      setMessage(
        editing === 'new'
          ? 'Entrada histórica creada.'
          : 'Entrada histórica actualizada.',
      )
      await load(saved.id)
    } catch {
      setMessage(
        'No se pudo guardar la entrada. Revisa los campos e inténtalo de nuevo.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function archive(
    entry: GlobalHistoryEntry,
  ): Promise<void> {
    if (
      !window.confirm(
        `¿Archivar “${entry.title}”?`,
      )
    ) {
      return
    }

    try {
      await globalHistoryGateway.archive(
        entry.id,
      )
      setMessage('Entrada histórica archivada.')
      await load()
    } catch {
      setMessage(
        'No se pudo archivar la entrada.',
      )
    }
  }

  const headerActions =
    typeof document !== 'undefined'
      ? document.getElementById(
          'app-header-page-actions',
        )
      : null

  async function openReference(ref: HistoryReference): Promise<void> {
    if (!selected) return
    try { setPreview(await globalHistoryGateway.reference(selected.id, ref.key)) }
    catch { setPreview({ label: ref.label, description: 'Conoces su nombre, pero no tienes acceso a más información sobre este elemento.' }) }
  }

  function mentionText(text: string) {
    return text.split(/(\[\[(?:resource|character|npc|location):[0-9a-f-]{36}\]\])/gi).map((part, index) => {
      const ref = selected?.references?.find(r => `[[${r.key}]]` === part)
      return ref ? <button key={index} type="button" className="history-mention" onClick={() => void openReference(ref)}>{ref.label}</button> : part
    })
  }

  return (
    <main className="global-history">
      {historyView === 'world' && headerActions !== null &&
      data?.canManage
        ? createPortal(
            <button
              type="button"
              className="global-history__new-button"
              onClick={beginCreate}
            >
              ＋ Nueva entrada
            </button>,
            headerActions,
          )
        : null}

      <nav
        className="global-history__categories"
        aria-label="Archivo de Historia"
      >
        <button
          type="button"
          className={
            historyView === 'world' && category === 'all'
              ? 'is-active'
              : undefined
          }
          onClick={() => { setHistoryView('world'); setCategory('all') }}
        >
          <span>Todo</span>
          <strong>{data?.items.length ?? 0}</strong>
        </button>

        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={
              historyView === 'world' && category === item
                ? 'is-active'
                : undefined
            }
            onClick={() => { setHistoryView('world'); setCategory(item) }}
          >
            <span>{categoryLabels[item]}</span>
            <strong>
              {data?.items.filter(
                (entry) =>
                  entry.category === item,
              ).length ?? 0}
            </strong>
          </button>
        ))}
        <button
          type="button"
          className={historyView === 'chronicles' ? 'is-active' : undefined}
          aria-pressed={historyView === 'chronicles'}
          onClick={() => setHistoryView('chronicles')}
        >
          <span>Crónicas</span>
        </button>
      </nav>

      {historyView === 'chronicles' ? <ChronicleArchive /> : <section className="global-history__workspace">
        <aside className="global-history__timeline">
          <div className="global-history__filters">
            <label>
              <span>Buscar</span>
              <input
                type="search"
                value={search}
                placeholder="Nombre, periodo o etiqueta"
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

            <label>
              <span>Orden</span>
              <select
                value={
                  oldestFirst
                    ? 'oldest'
                    : 'newest'
                }
                onChange={(event) =>
                  setOldestFirst(
                    event.target.value ===
                      'oldest',
                  )
                }
              >
                <option value="oldest">
                  Más antiguo primero
                </option>
                <option value="newest">
                  Más reciente primero
                </option>
              </select>
            </label>

            {data?.canManage ? (
              <label>
                <span>Estado</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        typeof statusFilter,
                    )
                  }
                >
                  <option value="all">Todos</option>
                  <option value="published">Publicadas</option>
                  <option value="draft">Borradores</option>
                </select>
              </label>
            ) : null}
          </div>

          {loading ? (
            <p className="global-history__empty">
              Abriendo el archivo histórico…
            </p>
          ) : filtered.length === 0 ? (
            <p className="global-history__empty">
              No hay entradas para estos filtros.
            </p>
          ) : (
            <ol>
              {pageEntries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={
                      selected?.id === entry.id
                        ? 'is-active'
                        : undefined
                    }
                    onClick={() =>
                      setSelectedId(entry.id)
                    }
                  >
                    <time>{periodFor(entry)}</time>
                    <span>
                      {categorySingular[
                        entry.category
                      ]}
                    </span>
                    <strong>{entry.title}</strong>
                    {entry.imageUpdatedAt ? <img className="history-thumbnail" src={globalHistoryGateway.imageUrl(entry.id, entry.imageUpdatedAt)} alt="" loading="lazy" /> : null}
                    {entry.summary ? (
                      <small>{entry.summary}</small>
                    ) : null}
                  </button>
                </li>
              ))}
            </ol>
          )}
          {!loading && filtered.length > HISTORY_PAGE_SIZE ? (
            <nav className="global-history__pagination" aria-label="Páginas de entradas históricas">
              <span>
                {currentEntryPage * HISTORY_PAGE_SIZE + 1}–{Math.min((currentEntryPage + 1) * HISTORY_PAGE_SIZE, filtered.length)} de {filtered.length}
              </span>
              <div>
                <button
                  type="button"
                  aria-label="Entradas anteriores"
                  disabled={currentEntryPage === 0}
                  onClick={() => {
                    const nextPage = Math.max(0, currentEntryPage - 1)
                    setEntryPage(nextPage)
                    setSelectedId(filtered[nextPage * HISTORY_PAGE_SIZE]?.id ?? null)
                  }}
                >
                  ← Anterior
                </button>
                <strong aria-live="polite">{currentEntryPage + 1} / {pageCount}</strong>
                <button
                  type="button"
                  aria-label="Entradas siguientes"
                  disabled={currentEntryPage + 1 >= pageCount}
                  onClick={() => {
                    const nextPage = Math.min(pageCount - 1, currentEntryPage + 1)
                    setEntryPage(nextPage)
                    setSelectedId(filtered[nextPage * HISTORY_PAGE_SIZE]?.id ?? null)
                  }}
                >
                  Siguiente →
                </button>
              </div>
            </nav>
          ) : null}
        </aside>

        <section className="global-history__detail">
          {selected ? (
            <article>
              <header>
                <div>
                  <p>
                    {categorySingular[
                      selected.category
                    ]}
                    {' · '}
                    {periodFor(selected)}
                  </p>
                  <h2>{selected.title}</h2>
                </div>

                <div className="global-history__badges">
                  <span data-kind={selected.sourceKind}>
                    {sourceLabels[
                      selected.sourceKind
                    ]}
                  </span>
                  {data?.canManage ? (
                    <>
                      <span>
                        {statusLabels[
                          selected.status
                        ]}
                      </span>
                      <span>
                        {visibilityLabels[
                          selected.visibility
                        ]}
                      </span>
                    </>
                  ) : null}
                </div>
              </header>

              {selected.summary ? (
                <p className="global-history__summary">
                  {selected.summary}
                </p>
              ) : null}

              {selected.imageUpdatedAt ? <figure className="history-figure">
                <button type="button" aria-label="Ampliar imagen" onClick={() => setExpandedImage(true)}><img src={globalHistoryGateway.imageUrl(selected.id, selected.imageUpdatedAt)} alt={selected.imageCaption || selected.title} /></button>
                <figcaption>{selected.imageCaption}{selected.imageCredit ? <small>Crédito: {selected.imageCredit}</small> : null}</figcaption>
              </figure> : null}

              <div className="global-history__content">
                {mentionText(selected.content || 'Esta entrada todavía no tiene un desarrollo completo.')}
              </div>

              {selected.references?.length ? <section className="history-related"><h3>Elementos relacionados</h3>{selected.references.map(ref => <button type="button" key={ref.key} onClick={() => void openReference(ref)}>{ref.type === 'character' ? 'Personaje' : 'Recurso'} · {ref.label}</button>)}</section> : null}

              {selected.tags.length > 0 ? (
                <ul className="global-history__tags">
                  {selected.tags.map((tag) => (
                    <li key={tag}>#{tag}</li>
                  ))}
                </ul>
              ) : null}

              {selected.chronicles.length > 0 ? (
                <section className="global-history__links">
                  <h3>Crónicas relacionadas</h3>
                  <ul>
                    {selected.chronicles.map(
                      (chronicle) => (
                        <li key={chronicle.id}>
                          {chronicle.name}
                        </li>
                      ),
                    )}
                  </ul>
                </section>
              ) : null}

              <footer>
                <span>
                  Incorporado por {selected.author.displayName}
                </span>

                {selected.canEdit ? (
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        beginEdit(selected)
                      }
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() =>
                        void archive(selected)
                      }
                    >
                      Archivar
                    </button>
                  </div>
                ) : null}
              </footer>
            </article>
          ) : (
            <div className="global-history__welcome">
              <span aria-hidden="true">⌛</span>
              <h2>{data?.items.length ? 'Sin resultados' : 'Una historia aún por escribir'}</h2>
              <p>
                {data?.items.length
                  ? 'No hay entradas que coincidan con estos filtros. Cambia la categoría o la búsqueda.'
                  : 'Selecciona una entrada de la cronología para consultar su desarrollo.'}
              </p>
              {data?.canManage ? (
                <button
                  type="button"
                  onClick={beginCreate}
                >
                  {data?.items.length ? 'Nueva entrada' : 'Crear la primera entrada'}
                </button>
              ) : null}
            </div>
          )}
        </section>
      </section>}

      {message ? (
        <p
          className="global-history__message"
          role="status"
        >
          {message}
        </p>
      ) : null}

      {editing !== null ? (
        <div
          className="global-history-editor__backdrop"
          role="presentation"
        >
          <section
            className="global-history-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-history-editor-title"
          >
            <header>
              <div>
                <p>Archivo histórico global</p>
                <h2 id="global-history-editor-title">
                  {editing === 'new'
                    ? 'Nueva entrada histórica'
                    : 'Editar entrada histórica'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                disabled={saving}
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </header>

            <form onSubmit={(event) => void save(event)}>
              <div className="global-history-editor__grid">
                <label className="is-wide">
                  <span>Título</span>
                  <input
                    autoFocus
                    required
                    maxLength={160}
                    value={draft.title}
                    onChange={(event) =>
                      updateDraft(
                        'title',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Categoría</span>
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      updateDraft(
                        'category',
                        event.target.value as
                          GlobalHistoryCategory,
                      )
                    }
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {categorySingular[item]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Periodo mostrado</span>
                  <input
                    maxLength={120}
                    placeholder="Ej.: Finales del siglo XV"
                    value={draft.periodLabel}
                    onChange={(event) =>
                      updateDraft(
                        'periodLabel',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Año inicial</span>
                  <input
                    type="number"
                    min={-100000}
                    max={100000}
                    placeholder="Para ordenar"
                    value={draft.startYear}
                    onChange={(event) =>
                      updateDraft(
                        'startYear',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Año final</span>
                  <input
                    type="number"
                    min={-100000}
                    max={100000}
                    placeholder="Opcional"
                    value={draft.endYear}
                    onChange={(event) =>
                      updateDraft(
                        'endYear',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Fuente</span>
                  <select
                    value={draft.sourceKind}
                    onChange={(event) =>
                      updateDraft(
                        'sourceKind',
                        event.target.value as
                          GlobalHistorySourceKind,
                      )
                    }
                  >
                    {(
                      Object.keys(sourceLabels) as
                        GlobalHistorySourceKind[]
                    ).map((item) => (
                      <option key={item} value={item}>
                        {sourceLabels[item]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Visibilidad</span>
                  <select
                    value={draft.visibility}
                    onChange={(event) =>
                      updateDraft(
                        'visibility',
                        event.target.value as
                          GlobalHistoryVisibility,
                      )
                    }
                  >
                    {(
                      Object.keys(visibilityLabels) as
                        GlobalHistoryVisibility[]
                    ).map((item) => (
                      <option key={item} value={item}>
                        {visibilityLabels[item]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Estado</span>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft(
                        'status',
                        event.target.value as
                          'draft' | 'published',
                      )
                    }
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicada</option>
                  </select>
                </label>

                <label className="is-wide">
                  <span>Resumen</span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={draft.summary}
                    onChange={(event) =>
                      updateDraft(
                        'summary',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="is-wide">
                  <span>Desarrollo histórico</span>
                  <textarea
                    rows={9}
                    maxLength={20000}
                    value={draft.content}
                    onChange={(event) => {
                      updateDraft('content', event.target.value)
                      const query = event.target.value.match(/@([^@\n]{0,80})$/)
                      if (query) setReferenceSearch(query[1])
                    }}
                  />
                </label>

                <div className="history-editor-extras">
                  <h3>Menciones y elementos relacionados</h3>
                  <p>El nombre será visible para quien lea esta entrada. La ficha mantiene sus propios permisos.</p>
                  <label><span>Buscar recurso o personaje (@)</span><input value={referenceSearch} onChange={event => setReferenceSearch(event.target.value.replace(/^@/, ''))} placeholder="Nombre del recurso o personaje" /></label>
                  {referenceSearch.trim() ? <div className="history-reference-results">{catalog.filter(r => r.label.toLocaleLowerCase('es').includes(referenceSearch.toLocaleLowerCase('es'))).slice(0, 12).map(ref => <button type="button" key={ref.key} onClick={() => {
                    updateDraft('references', draft.references.some(r => r.key === ref.key) ? draft.references : [...draft.references, ref]);
                    const base = draft.content.replace(/@[^@\n]{0,80}$/, '')
                    updateDraft('content', `${base}${base && !/\s$/.test(base) ? ' ' : ''}[[${ref.key}]]`);
                    setReferenceSearch('')
                  }}>{ref.label} · {ref.category ?? ref.type}</button>)}</div> : null}
                  {draft.references.map(ref => <div key={ref.key}>{ref.label} <button type="button" onClick={() => { updateDraft('references', draft.references.filter(r => r.key !== ref.key)); updateDraft('content', draft.content.replaceAll(`[[${ref.key}]]`, ref.label)) }}>Quitar mención</button></div>)}
                  <h3>Imagen principal opcional</h3>
                  <label><span>Imagen (JPEG, PNG o WebP; máximo 5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
                    const file = event.target.files?.[0] ?? null
                    if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type))) { setMessage('Elige JPEG, PNG o WebP de hasta 5 MB.'); event.target.value = ''; return }
                    setImageFile(file); setRemoveImage(false)
                  }} /></label>
                  {editing !== 'new' && editing.imageUpdatedAt ? <><img className="history-image-preview" src={globalHistoryGateway.imageUrl(editing.id, editing.imageUpdatedAt)} alt="Imagen actual" /><label><input type="checkbox" checked={removeImage} onChange={event => { setRemoveImage(event.target.checked); setImageFile(null) }} />Eliminar imagen al guardar</label></> : null}
                  <label><span>Pie de foto</span><input maxLength={300} value={draft.imageCaption} onChange={event => updateDraft('imageCaption', event.target.value)} /></label>
                  <label><span>Crédito de la imagen</span><input maxLength={300} value={draft.imageCredit} onChange={event => updateDraft('imageCredit', event.target.value)} /></label>
                </div>

                <label className="is-wide">
                  <span>Etiquetas</span>
                  <input
                    value={draft.tags}
                    placeholder="camarilla, madrid, siglo xx"
                    onChange={(event) =>
                      updateDraft(
                        'tags',
                        event.target.value,
                      )
                    }
                  />
                  <small>Separadas por comas.</small>
                </label>
              </div>

              {(data?.availableChronicles.length ?? 0) > 0 ? (
                <fieldset>
                  <legend>Crónicas relacionadas</legend>
                  <p>
                    La entrada seguirá siendo global aunque no selecciones ninguna.
                  </p>
                  <div>
                    {data?.availableChronicles.map(
                      (chronicle) => (
                        <label key={chronicle.id}>
                          <input
                            type="checkbox"
                            checked={
                              draft.chronicleIds.includes(
                                chronicle.id,
                              )
                            }
                            onChange={() =>
                              toggleChronicle(chronicle)
                            }
                          />
                          <span>{chronicle.name}</span>
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>
              ) : null}

              <footer>
                {message ? <p role="status">{message}</p> : null}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="is-primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando…'
                    : 'Guardar entrada'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
      {preview || expandedImage ? <div className="global-history-editor__backdrop"><section className="global-history-editor history-preview" role="dialog" aria-modal="true" aria-label={expandedImage ? 'Imagen ampliada' : 'Elemento relacionado'}><header><h2>{expandedImage ? selected?.title : preview?.label}</h2><button type="button" aria-label="Cerrar vista" onClick={() => { setPreview(null); setExpandedImage(false) }}>×</button></header>{expandedImage && selected ? <img src={globalHistoryGateway.imageUrl(selected.id, selected.imageUpdatedAt)} alt={selected.imageCaption || selected.title} /> : <div><p>{preview?.category}</p><p>{preview?.description || 'Sin descripción compartida.'}</p></div>}</section></div> : null}
    </main>
  )
}

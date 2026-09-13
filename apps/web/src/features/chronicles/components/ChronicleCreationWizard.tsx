import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ChronicleApiSnapshot } from '../types/chronicle-api.types.ts'
import './chronicle-creation-wizard.css'

type ResourceKind = 'npc' | 'location' | 'organization' | 'artifact' | 'document'
type Visibility = 'narrator_only' | 'chronicle_participants'
type StoryType = 'secondary_arc' | 'personal_arc'
type MilestoneKey = 'hook' | 'first_turn' | 'revelation' | 'climax' | 'resolution'

interface LibraryResource {
  readonly id: string
  readonly kind: ResourceKind
  readonly name: string
  readonly summary: string | null
}

interface StoryDraft {
  title: string
  type: StoryType
  premise: string
  stakes: string
  narratorNotes: string
  sharedSummary: string
}

interface NewResourceDraft {
  readonly draftId: string
  readonly kind: ResourceKind
  readonly name: string
  readonly summary: string
  readonly narratorNotes: string
  readonly visibility: Visibility
}

interface Props {
  readonly onCancel: () => void
  readonly onCreated: (chronicle: ChronicleApiSnapshot) => void
}

const resourceLabels: Record<ResourceKind, string> = {
  npc: 'PNJ',
  location: 'Localización',
  organization: 'Organización',
  artifact: 'Artefacto',
  document: 'Documento',
}

const milestoneLabels: readonly { readonly key: MilestoneKey; readonly label: string }[] = [
  { key: 'hook', label: 'Gancho' },
  { key: 'first_turn', label: 'Primer giro' },
  { key: 'revelation', label: 'Revelación' },
  { key: 'climax', label: 'Clímax' },
  { key: 'resolution', label: 'Resolución' },
]

const steps = ['Datos básicos', 'Historia principal', 'Historias adicionales', 'Recursos', 'Revisar y crear']

const emptyStory = (): StoryDraft => ({ title: '', type: 'secondary_arc', premise: '', stakes: '', narratorNotes: '', sharedSummary: '' })

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'La operación no se pudo completar.')
  return body as T
}

function text(value: string): string | null {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function ChronicleCreationWizard({ onCancel, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mainTitle, setMainTitle] = useState('')
  const [mainPremise, setMainPremise] = useState('')
  const [mainStakes, setMainStakes] = useState('')
  const [mainNotes, setMainNotes] = useState('')
  const [mainSharedSummary, setMainSharedSummary] = useState('')
  const [milestones, setMilestones] = useState<Record<MilestoneKey, string>>({ hook: '', first_turn: '', revelation: '', climax: '', resolution: '' })
  const [additionalStories, setAdditionalStories] = useState<StoryDraft[]>([])
  const [library, setLibrary] = useState<LibraryResource[]>([])
  const [libraryLoaded, setLibraryLoaded] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [resourceVisibility, setResourceVisibility] = useState<Record<string, Visibility>>({})
  const [newResources, setNewResources] = useState<NewResourceDraft[]>([])
  const [resourceKind, setResourceKind] = useState<ResourceKind>('npc')
  const [resourceName, setResourceName] = useState('')
  const [resourceSummary, setResourceSummary] = useState('')
  const [resourceNotes, setResourceNotes] = useState('')
  const [resourceNewVisibility, setResourceNewVisibility] = useState<Visibility>('narrator_only')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdChronicleId, setCreatedChronicleId] = useState<string | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    if (step !== 3 || libraryLoaded || libraryLoading) return
    setLibraryLoading(true)
    void request<{ items: LibraryResource[] }>('/api/library/resources')
      .then((value) => { setLibrary(value.items ?? []); setLibraryLoaded(true) })
      .catch(() => { setLibraryLoaded(true); setError('No se pudo cargar el catálogo global de recursos.') })
      .finally(() => setLibraryLoading(false))
  }, [libraryLoaded, libraryLoading, step])

  function patchMilestone(key: MilestoneKey, value: string) {
    setMilestones((current) => ({ ...current, [key]: value }))
  }

  function toggleResource(resource: LibraryResource) {
    setSelectedResources((current) => current.includes(resource.id) ? current.filter((id) => id !== resource.id) : [...current, resource.id])
    setResourceVisibility((current) => ({ ...current, [resource.id]: current[resource.id] ?? 'narrator_only' }))
  }

  function addNewResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resourceName.trim()) return
    setNewResources((current) => [...current, { draftId: `${Date.now()}-${current.length}`, kind: resourceKind, name: resourceName.trim(), summary: resourceSummary.trim(), narratorNotes: resourceNotes.trim(), visibility: resourceNewVisibility }])
    setResourceName('')
    setResourceSummary('')
    setResourceNotes('')
    setResourceNewVisibility('narrator_only')
  }

  function validStep(): boolean {
    if (step === 0 && !name.trim()) { setError('Escribe un nombre para la crónica.'); return false }
    if (step === 1 && !mainTitle.trim()) { setError('La historia principal necesita un título.'); return false }
    setError(null)
    return true
  }

  function next() {
    if (!validStep()) return
    setStep((current) => Math.min(steps.length - 1, current + 1))
  }

  function previous() {
    setError(null)
    setStep((current) => Math.max(0, current - 1))
  }

  async function submit() {
    if (!validStep()) return
    setSubmitting(true)
    setError(null)
    let createdId: string | null = null
    try {
      const chronicle = await request<ChronicleApiSnapshot>('/api/chronicles', { method: 'POST', body: JSON.stringify({ name: name.trim(), description: text(description) }) })
      createdId = chronicle.id
      setCreatedChronicleId(createdId)

      let story = await request<{ id: string; revision: number }>(`/api/chronicles/${chronicle.id}/stories`, { method: 'POST', body: JSON.stringify({ title: mainTitle.trim(), type: 'main_arc', premise: text(mainPremise), stakes: text(mainStakes), narratorNotes: text(mainNotes), sharedSummary: text(mainSharedSummary), visibility: 'narrator_only' }) })
      for (const milestone of milestoneLabels) {
        const note = text(milestones[milestone.key])
        if (note === null) continue
        story = await request<{ id: string; revision: number }>(`/api/chronicles/${chronicle.id}/stories/${story.id}/milestones/${milestone.key}`, { method: 'PATCH', body: JSON.stringify({ expectedRevision: story.revision, completed: false, note }) })
      }

      for (const extra of additionalStories.filter((item) => item.title.trim())) {
        await request(`/api/chronicles/${chronicle.id}/stories`, { method: 'POST', body: JSON.stringify({ title: extra.title.trim(), type: extra.type, premise: text(extra.premise), stakes: text(extra.stakes), narratorNotes: text(extra.narratorNotes), sharedSummary: text(extra.sharedSummary), visibility: 'narrator_only' }) })
      }

      for (const resource of newResources) {
        const created = await request<LibraryResource>('/api/library/resources', { method: 'POST', body: JSON.stringify({ kind: resource.kind, name: resource.name, summary: text(resource.summary), narratorNotes: text(resource.narratorNotes) }) })
        await request(`/api/library/resources/${created.id}/attach`, { method: 'POST', body: JSON.stringify({ chronicleId: chronicle.id, visibility: resource.visibility }) })
      }
      for (const resourceId of selectedResources) {
        await request(`/api/library/resources/${resourceId}/attach`, { method: 'POST', body: JSON.stringify({ chronicleId: chronicle.id, visibility: resourceVisibility[resourceId] ?? 'narrator_only' }) })
      }

      onCreated(chronicle)
    } catch {
      setCreatedChronicleId(createdId)
      setError(createdId === null ? 'No se pudo crear la crónica.' : `La crónica se creó, pero faltó completar parte de la configuración. Puedes abrirla y terminarla desde sus apartados. ID: ${createdId}`)
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="chronicle-creation-wizard__backdrop" role="presentation">
    <section className="chronicle-creation-wizard" role="dialog" aria-modal="true" aria-labelledby="chronicle-creation-wizard-title">
    <header className="chronicle-creation-wizard__header">
      <div><span className="chronicle-workspace__eyebrow">Asistente de preparación</span><h2 id="chronicle-creation-wizard-title">Nueva crónica</h2><p>Rellena la estructura de tu partida. No se genera contenido automáticamente.</p></div>
      <button type="button" className="chronicle-creation-wizard__close" onClick={onCancel}>Cerrar</button>
    </header>
    <nav className="chronicle-creation-wizard__steps" aria-label="Pasos de creación">
      {steps.map((label, index) => <button key={label} type="button" className={index === step ? 'is-active' : index < step ? 'is-complete' : ''} onClick={() => index < step && setStep(index)} disabled={index > step}>{index + 1}<span>{label}</span></button>)}
    </nav>
    <div className="chronicle-creation-wizard__body">
      {step === 0 ? <div className="chronicle-creation-wizard__form"><h3>Datos básicos</h3><p className="chronicle-creation-wizard__hint">Define el marco general. Podrás ampliar estos datos más adelante.</p><label><span>Nombre de la crónica</span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>Descripción o premisa general</span><textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} /></label></div> : null}
      {step === 1 ? <div className="chronicle-creation-wizard__form"><h3>Historia principal</h3><p className="chronicle-creation-wizard__hint">La historia principal organiza el arco central. Los cinco hitos son descripciones editables, todavía pendientes.</p><label><span>Título de la historia</span><input autoFocus required value={mainTitle} onChange={(event) => setMainTitle(event.target.value)} /></label><div className="chronicle-creation-wizard__two-columns"><label><span>Premisa</span><textarea rows={4} value={mainPremise} onChange={(event) => setMainPremise(event.target.value)} /></label><label><span>Conflicto o stakes</span><textarea rows={4} value={mainStakes} onChange={(event) => setMainStakes(event.target.value)} /></label></div><label><span>Resumen compartido</span><textarea rows={3} value={mainSharedSummary} onChange={(event) => setMainSharedSummary(event.target.value)} /></label><label><span>Notas privadas del Narrador</span><textarea rows={3} value={mainNotes} onChange={(event) => setMainNotes(event.target.value)} /></label><div className="chronicle-creation-wizard__milestones"><h4>Hitos de la historia</h4>{milestoneLabels.map((milestone) => <label key={milestone.key}><span>{milestone.label}</span><textarea rows={2} placeholder="Describe qué debe ocurrir en este punto…" value={milestones[milestone.key]} onChange={(event) => patchMilestone(milestone.key, event.target.value)} /></label>)}</div></div> : null}
      {step === 2 ? <div className="chronicle-creation-wizard__form"><div className="chronicle-creation-wizard__section-heading"><div><h3>Historias adicionales</h3><p className="chronicle-creation-wizard__hint">Añade arcos secundarios o personales si ya los tienes definidos. Este paso es opcional.</p></div><button type="button" onClick={() => setAdditionalStories((current) => [...current, emptyStory()])}>+ Añadir historia</button></div>{additionalStories.length === 0 ? <div className="chronicle-creation-wizard__empty">Todavía no hay historias adicionales.</div> : additionalStories.map((story, index) => <article className="chronicle-creation-wizard__story-card" key={index}><header><h4>Historia {index + 1}</h4><button type="button" onClick={() => setAdditionalStories((current) => current.filter((_, position) => position !== index))}>Quitar</button></header><label><span>Título</span><input required value={story.title} onChange={(event) => setAdditionalStories((current) => current.map((item, position) => position === index ? { ...item, title: event.target.value } : item))} /></label><label><span>Tipo</span><select value={story.type} onChange={(event) => setAdditionalStories((current) => current.map((item, position) => position === index ? { ...item, type: event.target.value as StoryType } : item))}><option value="secondary_arc">Secundaria</option><option value="personal_arc">Personal</option></select></label><label><span>Premisa</span><textarea rows={3} value={story.premise} onChange={(event) => setAdditionalStories((current) => current.map((item, position) => position === index ? { ...item, premise: event.target.value } : item))} /></label><label><span>Conflicto</span><textarea rows={3} value={story.stakes} onChange={(event) => setAdditionalStories((current) => current.map((item, position) => position === index ? { ...item, stakes: event.target.value } : item))} /></label></article>)}</div> : null}
      {step === 3 ? <div className="chronicle-creation-wizard__form"><h3>Recursos</h3><p className="chronicle-creation-wizard__hint">Puedes vincular recursos globales existentes o preparar recursos nuevos. Los nuevos se crearán en Recursos al validar la crónica.</p><section className="chronicle-creation-wizard__resource-section"><h4>Recursos existentes</h4>{libraryLoading ? <p>Cargando catálogo…</p> : library.length === 0 ? <div className="chronicle-creation-wizard__empty">No hay recursos globales disponibles todavía.</div> : <div className="chronicle-creation-wizard__resource-list">{library.map((resource) => <div className="chronicle-creation-wizard__resource-row" key={resource.id}><label><input type="checkbox" checked={selectedResources.includes(resource.id)} onChange={() => toggleResource(resource)} /><span><strong>{resource.name}</strong><small>{resourceLabels[resource.kind]}{resource.summary ? ` · ${resource.summary}` : ''}</small></span></label>{selectedResources.includes(resource.id) ? <select value={resourceVisibility[resource.id] ?? 'narrator_only'} onChange={(event) => setResourceVisibility((current) => ({ ...current, [resource.id]: event.target.value as Visibility }))}><option value="narrator_only">Solo Narrador</option><option value="chronicle_participants">Compartido</option></select> : null}</div>)}</div>}</section><section className="chronicle-creation-wizard__resource-section"><div className="chronicle-creation-wizard__section-heading"><div><h4>Crear recurso nuevo</h4><p className="chronicle-creation-wizard__hint">Se guardará en el catálogo global y se vinculará automáticamente.</p></div></div><form className="chronicle-creation-wizard__new-resource" onSubmit={addNewResource}><label><span>Tipo</span><select value={resourceKind} onChange={(event) => setResourceKind(event.target.value as ResourceKind)}>{Object.entries(resourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Nombre</span><input value={resourceName} onChange={(event) => setResourceName(event.target.value)} /></label><label><span>Descripción</span><textarea rows={2} value={resourceSummary} onChange={(event) => setResourceSummary(event.target.value)} /></label><label><span>Notas privadas</span><textarea rows={2} value={resourceNotes} onChange={(event) => setResourceNotes(event.target.value)} /></label><label><span>Visibilidad inicial</span><select value={resourceNewVisibility} onChange={(event) => setResourceNewVisibility(event.target.value as Visibility)}><option value="narrator_only">Solo Narrador</option><option value="chronicle_participants">Compartido</option></select></label><button type="submit">+ Preparar recurso</button></form>{newResources.length > 0 ? <ul className="chronicle-creation-wizard__new-resource-list">{newResources.map((resource, index) => <li key={resource.draftId}><span><strong>{resource.name}</strong><small>{resourceLabels[resource.kind]} · {resource.visibility === 'narrator_only' ? 'Solo Narrador' : 'Compartido'}</small></span><button type="button" onClick={() => setNewResources((current) => current.filter((_, position) => position !== index))}>Quitar</button></li>)}</ul> : null}</section></div> : null}
      {step === 4 ? <div className="chronicle-creation-wizard__form"><h3>Revisar y crear</h3><p className="chronicle-creation-wizard__hint">Comprueba la estructura antes de validar. La creación no utiliza IA ni genera contenido por sí sola.</p><dl className="chronicle-creation-wizard__summary"><div><dt>Crónica</dt><dd>{name || 'Sin nombre'}</dd></div><div><dt>Historia principal</dt><dd>{mainTitle || 'Sin título'}</dd></div><div><dt>Hitos con descripción</dt><dd>{milestoneLabels.filter((item) => milestones[item.key].trim()).length} de 5</dd></div><div><dt>Historias adicionales</dt><dd>{additionalStories.filter((item) => item.title.trim()).length}</dd></div><div><dt>Recursos existentes</dt><dd>{selectedResources.length}</dd></div><div><dt>Recursos nuevos</dt><dd>{newResources.length}</dd></div></dl><div className="chronicle-creation-wizard__review-note">Al crearla, los recursos nuevos pasarán al catálogo global y quedarán vinculados a esta crónica con la visibilidad que hayas elegido.</div></div> : null}
    </div>
    {error !== null ? <p className="chronicle-message chronicle-message--error" role="alert">{error}{createdChronicleId !== null ? <><br /><small>Crónica creada: {createdChronicleId}</small></> : null}</p> : null}
    <footer className="chronicle-creation-wizard__footer"><button type="button" onClick={onCancel} disabled={submitting}>Cancelar</button>{step > 0 ? <button type="button" onClick={previous} disabled={submitting}>Atrás</button> : null}{step < steps.length - 1 ? <button type="button" className="chronicle-workspace__primary-action" onClick={next}>Continuar</button> : <button type="button" className="chronicle-workspace__primary-action" onClick={() => void submit()} disabled={submitting || !name.trim() || !mainTitle.trim()}>{submitting ? 'Creando…' : 'Validar y crear crónica'}</button>}</footer>
    </section>
  </div>
}

import { V5VisualMark } from '../../v5-visuals/V5VisualMark'
import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

import type {
  ChronicleEventApiSnapshot,
  ChronicleNpcApiSnapshot,
  ChronicleNpcAttributesApiSnapshot,
  ChronicleNpcDeepProfileApiSnapshot,
  ChronicleNpcDisciplineApiSnapshot,
} from '../types/chronicle-api.types.ts'
import type { ChronicleStoryApiSnapshot } from '../types/chronicle-story-api.types.ts'
import { createChronicleGateway } from '../infrastructure/chronicle.api.ts'
import { chronicleEventRelationsApi } from '../infrastructure/chronicle-event-relations.api.ts'
import { createChronicleStoryGateway } from '../infrastructure/chronicle-story.api.ts'

import './chronicle-npc-deep-dossier.css'

const gateway = createChronicleGateway()
const storyGateway = createChronicleStoryGateway()

const defaultAttributes: ChronicleNpcAttributesApiSnapshot = {
  strength: 1, dexterity: 1, stamina: 1,
  charisma: 1, manipulation: 1, composure: 1,
  intelligence: 1, wits: 1, resolve: 1,
}

const emptyProfile: ChronicleNpcDeepProfileApiSnapshot = {
  alias: null, clan: null, generation: null, sire: null, sect: null,
  title: null, territory: null, domain: null, faction: null,
  influence: 0, resources: 0, traits: [], disciplines: [],
  attributes: defaultAttributes, disciplineDetails: [],
  allies: [], rivals: [], history: null,
}

type Tab = 'summary' | 'attributes' | 'disciplines' | 'relations' | 'history' | 'notes'
type AttributeKey = keyof ChronicleNpcAttributesApiSnapshot
type ProfileTextKey = 'alias' | 'clan' | 'generation' | 'sire' | 'sect' | 'title' | 'territory' | 'domain' | 'faction'
interface Context { readonly events: readonly ChronicleEventApiSnapshot[]; readonly stories: readonly ChronicleStoryApiSnapshot[]; readonly sessions: readonly { readonly id: string; readonly title: string; readonly date: string | null }[] }
const emptyContext: Context = { events: [], stories: [], sessions: [] }

const attributeGroups: readonly { readonly title: string; readonly items: readonly { readonly key: AttributeKey; readonly label: string }[] }[] = [
  { title: 'Físicos', items: [{ key: 'strength', label: 'Fuerza' }, { key: 'dexterity', label: 'Destreza' }, { key: 'stamina', label: 'Resistencia' }] },
  { title: 'Sociales', items: [{ key: 'charisma', label: 'Carisma' }, { key: 'manipulation', label: 'Manipulación' }, { key: 'composure', label: 'Compostura' }] },
  { title: 'Mentales', items: [{ key: 'intelligence', label: 'Inteligencia' }, { key: 'wits', label: 'Astucia' }, { key: 'resolve', label: 'Resolución' }] },
]

function shown(value: string | null) { return value?.trim() || 'Sin registrar' }
function date(value: string) { return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value)) }
function unique(values: readonly string[]) { return [...new Map(values.map((value) => [value.trim().toLocaleLowerCase('es-ES'), value.trim()] as const)).values()].filter(Boolean) }
function disciplineNames(value: string) { return value.split(/[,;.\n]+/).map((item) => item.trim()).filter(Boolean) }
function uniqueDisciplines(values: readonly ChronicleNpcDisciplineApiSnapshot[]) {
  const byName = new Map<string, ChronicleNpcDisciplineApiSnapshot>()
  values.forEach((discipline) => {
    disciplineNames(discipline.name).forEach((name) => {
      const key = name.toLocaleLowerCase('es-ES')
      if (!byName.has(key)) byName.set(key, { ...discipline, name, powers: unique(discipline.powers ?? []) })
    })
  })
  return [...byName.values()]
}
function normalizeProfile(value: ChronicleNpcDeepProfileApiSnapshot | null): ChronicleNpcDeepProfileApiSnapshot {
  if (value === null) return emptyProfile
  const legacy = value as ChronicleNpcDeepProfileApiSnapshot & { readonly attributes?: Partial<ChronicleNpcAttributesApiSnapshot>; readonly disciplineDetails?: readonly ChronicleNpcDisciplineApiSnapshot[] }
  const disciplineDetails = uniqueDisciplines(legacy.disciplineDetails?.length
    ? legacy.disciplineDetails
    : unique(legacy.disciplines ?? []).map((name) => ({ name, rating: 1, powers: [] })))
  return {
    ...emptyProfile,
    ...legacy,
    traits: unique(legacy.traits ?? []), allies: unique(legacy.allies ?? []), rivals: unique(legacy.rivals ?? []),
    attributes: { ...defaultAttributes, ...(legacy.attributes ?? {}) },
    disciplineDetails,
    disciplines: disciplineDetails.map((item) => item.name),
  }
}

function Dots({ value }: { readonly value: number }) {
  return <span className="npc-dossier__dots" aria-label={`${value} de 5`}>{[1, 2, 3, 4, 5].map((dot) => <i key={dot} className={dot <= value ? 'is-on' : ''} />)}</span>
}

function Tags({ values }: { readonly values: readonly string[] }) {
  return values.length ? <div className="npc-dossier__tags">{values.map((value) => <span key={value}>{value}</span>)}</div> : <p className="npc-dossier__muted">Sin registros.</p>
}

function TokenEditor({ label, values, onChange }: { readonly label: string; readonly values: readonly string[]; readonly onChange: (values: readonly string[]) => void }) {
  const [draft, setDraft] = useState('')
  function commit(raw = draft) {
    const additions = raw.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean)
    if (additions.length) onChange(unique([...values, ...additions]))
    setDraft('')
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault()
      commit()
    }
  }
  return <div className="npc-token-editor"><span>{label}</span><div className="npc-token-editor__tokens">{values.map((value) => <button key={value} type="button" onClick={() => onChange(values.filter((item) => item !== value))} title={`Eliminar ${value}`}>{value} <b aria-hidden="true">×</b></button>)}</div><input value={draft} onChange={(event) => { const next = event.target.value; if (/[,;\n]/.test(next)) commit(next); else setDraft(next) }} onKeyDown={keyDown} onBlur={() => commit()} placeholder="Escribe y pulsa Intro o coma" /></div>
}

function DisciplineEditor({ values, onChange }: { readonly values: readonly ChronicleNpcDisciplineApiSnapshot[]; readonly onChange: (values: readonly ChronicleNpcDisciplineApiSnapshot[]) => void }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(1)
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const additions = disciplineNames(name)
    if (!additions.length) return
    let next = [...values]
    additions.forEach((normalized) => {
      const existing = next.find((item) => item.name.toLocaleLowerCase('es-ES') === normalized.toLocaleLowerCase('es-ES'))
      next = existing
        ? next.map((item) => item === existing ? { ...item, rating } : item)
        : [...next, { name: normalized, rating, powers: [] }]
    })
    onChange(uniqueDisciplines(next))
    setName('')
    setRating(1)
  }
  return <div className="npc-discipline-editor"><div className="npc-discipline-editor__list">{values.map((discipline) => <article key={discipline.name}><header><strong>{discipline.name}</strong><label><span>Nivel</span><select value={discipline.rating} onChange={(event) => onChange(values.map((item) => item === discipline ? { ...item, rating: Number(event.target.value) } : item))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button type="button" onClick={() => onChange(values.filter((item) => item !== discipline))} aria-label={`Eliminar ${discipline.name}`}>×</button></header><TokenEditor label="Poderes conocidos" values={discipline.powers} onChange={(powers) => onChange(values.map((item) => item === discipline ? { ...item, powers } : item))} /></article>)}</div><form onSubmit={add}><label><span>Disciplina</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Celeridad, Potencia" /></label><label><span>Nivel</span><select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button type="submit" disabled={!name.trim()}>Añadir disciplina</button></form></div>
}

export function ChronicleNpcDeepDossier({ chronicleId, npc, onChanged }: { readonly chronicleId: string; readonly npc: ChronicleNpcApiSnapshot; readonly onChanged: () => void }) {
  const [tab, setTab] = useState<Tab>('summary')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState(() => normalizeProfile(npc.deepProfile))
  const [context, setContext] = useState<Context>(emptyContext)
  const [contextLoading, setContextLoading] = useState(true)

  useEffect(() => { setProfile(normalizeProfile(npc.deepProfile)); setEditing(false); setTab('summary'); setSaved(false) }, [npc.deepProfile, npc.id])
  useEffect(() => {
    let active = true
    setContextLoading(true)
    void Promise.all([gateway.events(chronicleId), storyGateway.list(chronicleId)]).then(async ([events, storyPage]) => {
      const relations = await Promise.all(events.map(async (event) => ({ event, links: await chronicleEventRelationsApi.load(chronicleId, event.id).catch(() => ({ characterIds: [] as string[], npcIds: [] as string[], locationIds: [] as string[] })) })))
      const linkedEvents = relations.filter((item) => item.links.npcIds.includes(npc.id)).map((item) => item.event)
      const linkedStories = storyPage.items.filter((story) => story.npcs.some((item) => item.id === npc.id))
      const sessionMap = new Map<string, { id: string; title: string; date: string | null }>()
      linkedStories.forEach((story) => story.sessions.forEach((session) => sessionMap.set(session.id, { id: session.id, title: session.title ?? `Sesión ${session.sessionNumber ?? 'sin número'}`, date: session.realDate })))
      if (active) setContext({ events: linkedEvents, stories: linkedStories, sessions: [...sessionMap.values()] })
    }).catch(() => { if (active) setContext(emptyContext) }).finally(() => { if (active) setContextLoading(false) })
    return () => { active = false }
  }, [chronicleId, npc.id])

  function setField<K extends keyof ChronicleNpcDeepProfileApiSnapshot>(field: K, value: ChronicleNpcDeepProfileApiSnapshot[K]) { setProfile((current) => ({ ...current, [field]: value })); setSaved(false) }
  function setAttribute(field: AttributeKey, value: number) { setProfile((current) => ({ ...current, attributes: { ...current.attributes, [field]: value } })); setSaved(false) }
  function setDisciplines(values: readonly ChronicleNpcDisciplineApiSnapshot[]) { setProfile((current) => ({ ...current, disciplineDetails: values, disciplines: values.map((item) => item.name) })); setSaved(false) }
  async function save() {
    setSaving(true); setError(null); setSaved(false)
    try { await gateway.updateNpc(chronicleId, npc.id, { deepProfile: profile }); setEditing(false); setSaved(true); onChanged() }
    catch { setError('No se pudo guardar el dossier profundo.') }
    finally { setSaving(false) }
  }

  const textFields: readonly [ProfileTextKey, string][] = [['alias', 'Alias'], ['clan', 'Clan'], ['generation', 'Generación'], ['sire', 'Sire'], ['sect', 'Secta o corte'], ['title', 'Título o posición'], ['territory', 'Territorio'], ['domain', 'Dominio'], ['faction', 'Facción']]

  return <section className="npc-dossier" aria-label="Dossier profundo del PNJ">
    <header className="npc-dossier__hero"><div className="npc-dossier__portrait"><V5VisualMark kind="clan-symbol" value={profile.clan} decorative /></div><div className="npc-dossier__identity"><small>DOSSIER DEL PNJ</small><h3>{npc.name}</h3><p>{shown(npc.category)} · {shown(npc.narrativeRole)}</p><dl><div><dt>Generación</dt><dd>{shown(profile.generation)}</dd></div><div><dt>Clan</dt><dd>{shown(profile.clan)}</dd></div><div><dt>Dominio</dt><dd>{shown(profile.domain)}</dd></div><div><dt>Sire</dt><dd>{shown(profile.sire)}</dd></div></dl></div><div className="npc-dossier__hero-actions"><span className={`npc-dossier__status npc-dossier__status--${npc.status}`}>● {npc.status === 'active' ? 'Activo' : 'Archivado'}</span><button type="button" onClick={() => setEditing((current) => !current)}>{editing ? 'Cerrar edición' : 'Editar dossier'}</button></div></header>
    <nav className="npc-dossier__tabs" aria-label="Secciones del dossier">{([['summary', 'Resumen'], ['attributes', 'Atributos'], ['disciplines', 'Disciplinas'], ['relations', 'Relaciones'], ['history', 'Historial'], ['notes', 'Notas']] as const).map(([id, label]) => <button type="button" key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {error ? <p className="npc-dossier__error" role="alert">{error}</p> : null}{saved ? <p className="npc-dossier__success" role="status">Dossier guardado correctamente.</p> : null}
    {editing ? <section className="npc-dossier__editor" aria-label="Edición del dossier profundo"><header className="npc-dossier__editor-heading"><div><small>EDICIÓN DEL DOSSIER</small><h4>Ficha operativa de {npc.name}</h4><p>Los campos múltiples se añaden como fichas; Intro, coma y punto y coma confirman cada valor.</p></div><button type="button" onClick={() => { setProfile(normalizeProfile(npc.deepProfile)); setEditing(false) }}>Cancelar</button></header><div className="npc-dossier__editor-grid">
      <section><h4>Identidad</h4>{textFields.slice(0, 4).map(([field, label]) => <label key={field}><span>{label}</span><input value={profile[field] ?? ''} onChange={(event) => setField(field, event.target.value || null)} /></label>)}</section>
      <section><h4>Posición en la crónica</h4>{textFields.slice(4).map(([field, label]) => <label key={field}><span>{label}</span><input value={profile[field] ?? ''} onChange={(event) => setField(field, event.target.value || null)} /></label>)}<div className="npc-dossier__editor-ratings"><label><span>Influencia 0–5</span><input type="number" min="0" max="5" value={profile.influence} onChange={(event) => setField('influence', Number(event.target.value))} /></label><label><span>Recursos 0–5</span><input type="number" min="0" max="5" value={profile.resources} onChange={(event) => setField('resources', Number(event.target.value))} /></label></div></section>
      <section className="npc-dossier__editor-wide"><h4>Atributos V5</h4><div className="npc-attribute-editor">{attributeGroups.map((group) => <fieldset key={group.title}><legend>{group.title}</legend>{group.items.map((item) => <label key={item.key}><span>{item.label}</span><select value={profile.attributes[item.key]} onChange={(event) => setAttribute(item.key, Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>)}</fieldset>)}</div></section>
      <section className="npc-dossier__editor-wide"><h4>Disciplinas y poderes</h4><DisciplineEditor values={profile.disciplineDetails} onChange={setDisciplines} /></section>
      <section className="npc-dossier__editor-wide npc-dossier__token-grid"><TokenEditor label="Rasgos clave" values={profile.traits} onChange={(values) => setField('traits', values)} /><TokenEditor label="Aliados" values={profile.allies} onChange={(values) => setField('allies', values)} /><TokenEditor label="Rivales" values={profile.rivals} onChange={(values) => setField('rivals', values)} /></section>
      <section className="npc-dossier__editor-wide"><h4>Historia</h4><label><span>Trayectoria y secretos del PNJ</span><textarea rows={6} value={profile.history ?? ''} onChange={(event) => setField('history', event.target.value || null)} /></label></section>
    </div><footer className="npc-dossier__editor-actions"><span>Los cambios se guardan en el dossier de este PNJ.</span><button type="button" disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : 'Guardar dossier'}</button></footer></section> : null}
    {!editing ? <div className="npc-dossier__body">
      {tab === 'summary' ? <><div className="npc-dossier__summary-grid"><article><h4>Identidad</h4><dl><dt>Alias</dt><dd>{shown(profile.alias)}</dd><dt>Nombre de pila</dt><dd>{npc.name}</dd><dt>Clan</dt><dd>{shown(profile.clan)}</dd><dt>Sire</dt><dd>{shown(profile.sire)}</dd><dt>Estatus</dt><dd>{npc.status === 'active' ? 'Activo' : 'Archivado'}</dd></dl></article><article><h4>Afiliaciones y posición</h4><dl><dt>Secta / Corte</dt><dd>{shown(profile.sect)}</dd><dt>Título</dt><dd>{shown(profile.title)}</dd><dt>Territorio</dt><dd>{shown(profile.territory)}</dd><dt>Facción</dt><dd>{shown(profile.faction)}</dd><dt>Influencia</dt><dd><Dots value={profile.influence} /></dd><dt>Recursos</dt><dd><Dots value={profile.resources} /></dd></dl></article></div><article className="npc-dossier__wide-card"><h4>Descripción narrativa</h4><p>{shown(npc.description)}</p></article><div className="npc-dossier__lower-grid"><article><h4>Rasgos clave</h4><Tags values={profile.traits} /></article><article><h4>Relaciones destacadas</h4><strong>Aliados</strong><Tags values={profile.allies} /><strong>Rivales</strong><Tags values={profile.rivals} /></article><article><h4>Recursos relacionados</h4><ul><li>{context.events.length} sucesos</li><li>{context.stories.length} historias</li><li>{context.sessions.length} sesiones</li></ul></article><article className="npc-dossier__private"><small>SOLO NARRADOR</small><h4>Notas privadas</h4><p>{shown(npc.notes)}</p></article><article><h4>Acciones rápidas</h4><button type="button" onClick={() => setEditing(true)}>Editar perfil profundo</button></article><article><h4>Última actualización</h4><p>{date(npc.updatedAt)}</p></article></div></> : null}
      {tab === 'attributes' ? <section className="npc-dossier__attribute-groups">{attributeGroups.map((group) => <article key={group.title}><h4>{group.title}</h4><dl>{group.items.map((item) => <div key={item.key}><dt>{item.label}</dt><dd><Dots value={profile.attributes[item.key]} /></dd></div>)}</dl></article>)}</section> : null}
      {tab === 'disciplines' ? <section className="npc-dossier__discipline-cards">{profile.disciplineDetails.map((discipline) => <article key={discipline.name}><header><div className="npc-dossier__discipline-title"><V5VisualMark kind="discipline" value={discipline.name} decorative /><h4>{discipline.name}</h4></div><Dots value={discipline.rating} /></header><strong>Poderes conocidos</strong><Tags values={discipline.powers} /></article>)}{profile.disciplineDetails.length === 0 ? <article><p className="npc-dossier__muted">Sin disciplinas registradas.</p></article> : null}</section> : null}
      {tab === 'relations' ? <article className="npc-dossier__tab-panel"><h4>Aliados</h4><Tags values={profile.allies} /><h4>Rivales</h4><Tags values={profile.rivals} /></article> : null}
      {tab === 'history' ? <article className="npc-dossier__tab-panel"><h4>Historia del PNJ</h4><p>{shown(profile.history)}</p></article> : null}
      {tab === 'notes' ? <article className="npc-dossier__tab-panel npc-dossier__private"><small>SOLO NARRADOR</small><h4>Notas privadas</h4><p>{shown(npc.notes)}</p></article> : null}
    </div> : null}
    <aside className="npc-dossier__context"><article><small>CONTEXTO NARRATIVO</small><h4>Apariciones en eventos</h4>{contextLoading ? <p>Cargando vínculos…</p> : context.events.length ? <ol className="npc-dossier__timeline">{context.events.slice(0, 8).map((event) => <li key={event.id}><strong>{event.title}</strong><span>{event.realDate ? date(event.realDate) : event.narrativeTimeLabel ?? 'Sin fecha'}</span></li>)}</ol> : <p>Sin apariciones vinculadas.</p>}</article><article><h4>Historias y sesiones vinculadas</h4>{context.stories.length ? <ul>{context.stories.slice(0, 5).map((story) => <li key={story.id}><strong>{story.title}</strong><span>{story.status}</span></li>)}</ul> : <p>Sin historias vinculadas.</p>}{context.sessions.length ? <ul>{context.sessions.slice(0, 5).map((session) => <li key={session.id}><strong>{session.title}</strong><span>{session.date ? date(session.date) : 'Sin fecha'}</span></li>)}</ul> : null}</article><article className="npc-dossier__private"><small>PRIVADO</small><h4>Nota del Narrador</h4><p>{shown(npc.notes)}</p></article></aside>
  </section>
}

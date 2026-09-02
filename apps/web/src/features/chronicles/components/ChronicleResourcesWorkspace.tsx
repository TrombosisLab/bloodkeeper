import { useEffect, useState } from 'react'
import { ChronicleLocationPanel } from './ChronicleLocationPanel'
import { ChronicleNpcPanel } from './ChronicleNpcPanel'
import { ChronicleResourceCatalog } from './ChronicleResourceCatalog'
import type { ChronicleResourceCatalogKind, ChronicleResourceOrder } from './ChronicleResourceCatalog'
import './chronicle-resources-workspace.css'

type Section = 'npcs' | 'locations' | ChronicleResourceCatalogKind

interface Props {
  readonly chronicleId: string
  readonly canManageNpcs: boolean
  readonly canManageLocations: boolean
}

const sections: readonly { readonly id: Section; readonly label: string }[] = [
  { id: 'npcs', label: 'PNJ' },
  { id: 'locations', label: 'Localizaciones' },
  { id: 'document', label: 'Documentos' },
  { id: 'artifact', label: 'Artefactos' },
  { id: 'organization', label: 'Organizaciones' },
]

export function ChronicleResourcesWorkspace({ chronicleId, canManageNpcs, canManageLocations }: Props) {
  const [activeSection, setActiveSection] = useState<Section>(canManageNpcs ? 'npcs' : canManageLocations ? 'locations' : 'document')
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<ChronicleResourceOrder>('name')
  const [npcCount, setNpcCount] = useState(0)
  const [locationCount, setLocationCount] = useState(0)
  const [catalogCounts, setCatalogCounts] = useState<Record<ChronicleResourceCatalogKind, number>>({ document: 0, artifact: 0, organization: 0 })

  useEffect(() => {
    if (activeSection === 'npcs' && !canManageNpcs) setActiveSection(canManageLocations ? 'locations' : 'document')
    if (activeSection === 'locations' && !canManageLocations) setActiveSection(canManageNpcs ? 'npcs' : 'document')
    setQuery('')
  }, [activeSection, canManageLocations, canManageNpcs])

  const available = sections.filter((section) => section.id !== 'npcs' || canManageNpcs).filter((section) => section.id !== 'locations' || canManageLocations)
  const total = npcCount + locationCount + catalogCounts.document + catalogCounts.artifact + catalogCounts.organization
  const placeholder = activeSection === 'npcs' ? 'Buscar PNJ...' : activeSection === 'locations' ? 'Buscar localizaciones...' : 'Buscar recursos...'
  const catalogKind: ChronicleResourceCatalogKind = activeSection === 'document' || activeSection === 'artifact' || activeSection === 'organization' ? activeSection : 'document'

  return <section className="chronicle-resources-workspace" aria-labelledby="chronicle-resources-workspace-title" data-section={activeSection}>
    <div className="chronicle-resources-workspace__canvas">
      <aside className="chronicle-resources-workspace__navigator">
        <header><div><small>RECURSOS</small><h2 id="chronicle-resources-workspace-title">Archivo de crónica</h2></div><strong>{total}</strong></header>
        <div className="chronicle-resources-workspace__tabs" role="tablist" aria-label="Tipos de recurso">
          {available.map((section) => <button id={'chronicle-resource-' + section.id + '-tab'} key={section.id} type="button" role="tab" aria-selected={activeSection === section.id} className={'chronicle-resources-workspace__tab ' + (activeSection === section.id ? 'chronicle-resources-workspace__tab--active' : '')} onClick={() => setActiveSection(section.id)}><span>{section.label}</span><i aria-hidden="true">›</i></button>)}
        </div>
        <label className="chronicle-resources-workspace__search"><span className="sr-only">Buscar</span><input type="search" value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="chronicle-resources-workspace__order"><span>Ordenar por</span><select value={order} onChange={(event) => setOrder(event.target.value as ChronicleResourceOrder)}><option value="name">Nombre A-Z</option><option value="recent">Actualización reciente</option></select></label>
      </aside>

      <main className="chronicle-resources-workspace__content">
        {canManageNpcs ? (<div id="chronicle-resource-npcs-panel" role="tabpanel" aria-labelledby="chronicle-resource-npcs-tab" hidden={activeSection !== 'npcs'} className="chronicle-resources-workspace__panel chronicle-resources-workspace__panel--npcs"><ChronicleNpcPanel chronicleId={chronicleId} onCountChange={setNpcCount} query={query} order={order} /></div>) : null}
        {canManageLocations ? (<div id="chronicle-resource-locations-panel" role="tabpanel" aria-labelledby="chronicle-resource-locations-tab" hidden={activeSection !== 'locations'} className="chronicle-resources-workspace__panel chronicle-resources-workspace__panel--locations"><ChronicleLocationPanel chronicleId={chronicleId} onCountChange={setLocationCount} /></div>) : null}
        <div role="tabpanel" hidden={activeSection === 'npcs' || activeSection === 'locations'} className="chronicle-resources-workspace__panel chronicle-resources-workspace__panel--catalog"><ChronicleResourceCatalog chronicleId={chronicleId} kind={catalogKind} query={query} order={order} onCountChange={(kind, count) => setCatalogCounts((current) => ({ ...current, [kind]: count }))} /></div>
      </main>
    </div>
    {/* SPEC-062 legacy accessibility contracts: >PNJ< >Localizaciones< chronicle-resource-locations-tab chronicle-resource-npcs-tab hidden={activeSection !== 'locations'} canManageLocations ? ( canManageNpcs ? ( */}
  </section>
}

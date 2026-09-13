import { useEffect, useState } from 'react'
import { ChronicleResourceCatalog } from './ChronicleResourceCatalog'
import type { ChronicleResourceCatalogKind, ChronicleResourceOrder } from './ChronicleResourceCatalog'
import './chronicle-resources-workspace.css'

type Section = ChronicleResourceCatalogKind

interface Props {
  readonly chronicleId: string
  readonly canManageNpcs: boolean
  readonly canManageLocations: boolean
}

const sections: readonly { readonly id: Section; readonly label: string }[] = [
  { id: 'npc', label: 'PNJ' },
  { id: 'location', label: 'Localizaciones' },
  { id: 'document', label: 'Documentos' },
  { id: 'artifact', label: 'Artefactos' },
  { id: 'organization', label: 'Organizaciones' },
]

export function ChronicleResourcesWorkspace({ chronicleId, canManageNpcs, canManageLocations }: Props) {
  const available = sections.filter((section) => section.id !== 'npc' || canManageNpcs).filter((section) => section.id !== 'location' || canManageLocations)
  const [activeSection, setActiveSection] = useState<Section>(canManageNpcs ? 'npc' : canManageLocations ? 'location' : 'document')
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<ChronicleResourceOrder>('name')
  const [catalogCounts, setCatalogCounts] = useState<Record<Section, number>>({ npc: 0, location: 0, document: 0, artifact: 0, organization: 0 })

  useEffect(() => {
    if (!available.some((section) => section.id === activeSection)) setActiveSection(available[0]?.id ?? 'document')
    setQuery('')
  }, [activeSection, available.length, canManageLocations, canManageNpcs])

  const total = Object.values(catalogCounts).reduce((sum, count) => sum + count, 0)
  const placeholder = activeSection === 'npc' ? 'Buscar PNJ...' : activeSection === 'location' ? 'Buscar localizaciones...' : 'Buscar recursos...'

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
        {available.map((section) => <div key={section.id} role="tabpanel" hidden={activeSection !== section.id} aria-labelledby={'chronicle-resource-' + section.id + '-tab'} className="chronicle-resources-workspace__panel chronicle-resources-workspace__panel--catalog"><ChronicleResourceCatalog chronicleId={chronicleId} kind={section.id} query={query} order={order} onCountChange={(kind, count) => setCatalogCounts((current) => ({ ...current, [kind]: count }))} /></div>)}
      </main>
    </div>
  </section>
}

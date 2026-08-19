import {
  useEffect,
  useState,
} from 'react'

import {
  ChronicleLocationPanel,
} from './ChronicleLocationPanel'

import {
  ChronicleNpcPanel,
} from './ChronicleNpcPanel'

import './chronicle-resources-workspace.css'

type ChronicleResourceSection =
  | 'npcs'
  | 'locations'

interface ChronicleResourcesWorkspaceProps {
  readonly chronicleId: string
  readonly canManageNpcs: boolean
  readonly canManageLocations: boolean
}

export function ChronicleResourcesWorkspace({
  chronicleId,
  canManageNpcs,
  canManageLocations,
}: ChronicleResourcesWorkspaceProps) {
  const [
    activeSection,
    setActiveSection,
  ] = useState<ChronicleResourceSection>(
    canManageNpcs
      ? 'npcs'
      : 'locations',
  )

  const [
    npcCount,
    setNpcCount,
  ] = useState(0)

  const [
    locationCount,
    setLocationCount,
  ] = useState(0)

  useEffect(() => {
    if (
      activeSection === 'npcs' &&
      !canManageNpcs &&
      canManageLocations
    ) {
      setActiveSection('locations')
    }

    if (
      activeSection === 'locations' &&
      !canManageLocations &&
      canManageNpcs
    ) {
      setActiveSection('npcs')
    }
  }, [
    activeSection,
    canManageNpcs,
    canManageLocations,
  ])

  return (
    <section
      className="chronicle-resources-workspace"
      aria-labelledby="chronicle-resources-workspace-title"
    >
      <div className="chronicle-resources-workspace__heading">
        <div>
          <span>
            Información privada del Narrador
          </span>

          <h2 id="chronicle-resources-workspace-title">
            Recursos
          </h2>
        </div>

        <span className="chronicle-resources-workspace__count">
          {npcCount + locationCount}
        </span>
      </div>

      <div
        className="chronicle-resources-workspace__tabs"
        role="tablist"
        aria-label="Tipos de recurso"
      >
        {canManageNpcs ? (
          <button
            id="chronicle-resource-npcs-tab"
            type="button"
            role="tab"
            aria-selected={
              activeSection === 'npcs'
            }
            aria-controls="chronicle-resource-npcs-panel"
            className={
              'chronicle-resources-workspace__tab ' +
              (
                activeSection === 'npcs'
                  ? 'chronicle-resources-workspace__tab--active'
                  : ''
              )
            }
            onClick={() =>
              setActiveSection('npcs')
            }
          >
            <span>PNJ</span>
            <strong>{npcCount}</strong>
          </button>
        ) : null}

        {canManageLocations ? (
          <button
            id="chronicle-resource-locations-tab"
            type="button"
            role="tab"
            aria-selected={
              activeSection === 'locations'
            }
            aria-controls="chronicle-resource-locations-panel"
            className={
              'chronicle-resources-workspace__tab ' +
              (
                activeSection === 'locations'
                  ? 'chronicle-resources-workspace__tab--active'
                  : ''
              )
            }
            onClick={() =>
              setActiveSection('locations')
            }
          >
            <span>Localizaciones</span>
            <strong>{locationCount}</strong>
          </button>
        ) : null}
      </div>

      {canManageNpcs ? (
        <div
          id="chronicle-resource-npcs-panel"
          role="tabpanel"
          aria-labelledby="chronicle-resource-npcs-tab"
          hidden={activeSection !== 'npcs'}
          className="chronicle-resources-workspace__panel"
        >
          <ChronicleNpcPanel
            chronicleId={chronicleId}
            onCountChange={setNpcCount}
          />
        </div>
      ) : null}

      {canManageLocations ? (
        <div
          id="chronicle-resource-locations-panel"
          role="tabpanel"
          aria-labelledby="chronicle-resource-locations-tab"
          hidden={
            activeSection !== 'locations'
          }
          className="chronicle-resources-workspace__panel"
        >
          <ChronicleLocationPanel
            chronicleId={chronicleId}
            onCountChange={
              setLocationCount
            }
          />
        </div>
      ) : null}
    </section>
  )
}

import { useEffect, useState } from 'react'

// CHRONICLE_SESSION_NPC_GENERIC_DICE_V1

import { DiceHistoryPanel } from '../../dice/components/DiceHistoryPanel'
import { DiceRollPanel } from '../../dice/components/DiceRollPanel'

import './chronicle-session-dice-launcher.css'

type LauncherMode = 'npc' | 'generic' | 'd10'

interface Props {
  readonly chronicleId: string
  readonly sessionId: string
}

interface GlobalNpcResource {
  readonly id: string
  readonly name: string
}

async function loadNpcResources(
  chronicleId: string,
): Promise<readonly GlobalNpcResource[]> {
  const response = await fetch(
    `/api/library/resources/for-chronicle/${encodeURIComponent(chronicleId)}?kind=npc`,
    { credentials: 'include' },
  )
  if (!response.ok) throw new Error('NPC_RESOURCES_UNAVAILABLE')
  const payload = await response.json() as { items?: unknown }
  return Array.isArray(payload.items)
    ? payload.items.filter((item): item is GlobalNpcResource => {
        if (item === null || typeof item !== 'object') return false
        const value = item as Record<string, unknown>
        return typeof value.id === 'string' && typeof value.name === 'string'
      })
    : []
}

function closeOnEscape(setOpen: (value: boolean) => void): () => void {
  const listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false)
  }
  globalThis.document.addEventListener('keydown', listener)
  return () => globalThis.document.removeEventListener('keydown', listener)
}

export function ChronicleSessionDiceLauncher({
  chronicleId,
  sessionId,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<LauncherMode>('generic')
  const [npcResources, setNpcResources] = useState<readonly GlobalNpcResource[]>([])
  const [npcId, setNpcId] = useState('')
  const [npcLoading, setNpcLoading] = useState(false)
  const [npcError, setNpcError] = useState<string | null>(null)
  const [historyReload, setHistoryReload] = useState(0)

  useEffect(() => {
    if (!open || mode !== 'npc') return
    let active = true
    setNpcLoading(true)
    setNpcError(null)
    void loadNpcResources(chronicleId)
      .then((items) => {
        if (!active) return
        setNpcResources(items)
        setNpcId((current) => items.some((item) => item.id === current) ? current : items[0]?.id ?? '')
      })
      .catch(() => {
        if (active) setNpcError('No se pudieron cargar los PNJ de Recursos.')
      })
      .finally(() => {
        if (active) setNpcLoading(false)
      })
    return () => { active = false }
  }, [chronicleId, mode, open])

  useEffect(() => {
    if (!open) return
    const restore = closeOnEscape(setOpen)
    const previousOverflow = globalThis.document.body.style.overflow
    globalThis.document.body.style.overflow = 'hidden'
    return () => {
      restore()
      globalThis.document.body.style.overflow = previousOverflow
    }
  }, [open])

  const selectedNpc = npcResources.find((item) => item.id === npcId)
  const npcDescription = selectedNpc === undefined
    ? undefined
    : `PNJ · ${selectedNpc.name}`

  function rollCompleted() {
    setHistoryReload((value) => value + 1)
  }

  return (
    <>
      <section className="chronicle-session-dice-launcher">
        <div>
          <span>Dados V5</span>
          <h2>Lanzador de dados</h2>
          <p>PNJ de Recursos o tiradas genéricas para esta sesión.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)}>Abrir lanzador</button>
      </section>

      <DiceHistoryPanel
        key={historyReload}
        chronicleId={chronicleId}
        sessionId={sessionId}
        contextLabel="Historial de la sesión seleccionada"
      />

      {open ? (
        <div className="chronicle-session-dice-launcher__backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false) }}>
          <section className="chronicle-session-dice-launcher__dialog" role="dialog" aria-modal="true" aria-label="Lanzador de dados de la sesión">
            <header className="chronicle-session-dice-launcher__dialog-header">
              <div><span>Sesión actual</span><h2>Lanzador de dados</h2><p>Elige quién realiza la tirada.</p></div>
              <button type="button" aria-label="Cerrar lanzador" onClick={() => setOpen(false)}>×</button>
            </header>
            <nav className="chronicle-session-dice-launcher__modes" aria-label="Tipo de tirada">
              <button type="button" className={mode === 'npc' ? 'is-active' : ''} onClick={() => setMode('npc')}>PNJ de Recursos</button>
              <button type="button" className={mode === 'generic' ? 'is-active' : ''} onClick={() => setMode('generic')}>Genérica</button>
              <button type="button" className={mode === 'd10' ? 'is-active' : ''} onClick={() => setMode('d10')}>Dados d10</button>
            </nav>

            {mode === 'npc' ? (
              <div className="chronicle-session-dice-launcher__target">
                <div className="chronicle-session-dice-launcher__npc-selectors">
                  <label>PNJ de Recursos<select value={npcId} onChange={(event) => setNpcId(event.target.value)} disabled={npcLoading || npcResources.length === 0}>
                    {npcResources.length === 0 ? <option value="">No hay PNJ vinculados a esta crónica</option> : null}
                    {npcResources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select></label>
                </div>
                {npcLoading ? <p>Cargando PNJ vinculados…</p> : null}
                {npcError ? <p role="alert">{npcError}</p> : null}
                {selectedNpc ? <DiceRollPanel key={npcId} mode="manual" manualTitle="Tirada del PNJ" manualSubtitle="Introduce la reserva que necesites para este PNJ." manualPreset={{ pool: 3, hunger: 0, description: npcDescription }} chronicleId={chronicleId} sessionId={sessionId} onRollCompleted={rollCompleted} /> : null}
              </div>
            ) : null}

            {mode === 'd10' ? (
              <DiceRollPanel
                key="session-d10"
                mode="manual"
                manualVariant="d10"
                manualTitle="Lanzamiento d10"
                manualSubtitle="Elige uno o dos dados de 10 caras."
                manualPreset={{ pool: 1, hunger: 0, description: 'Lanzamiento d10' }}
                chronicleId={chronicleId}
                sessionId={sessionId}
                onRollCompleted={rollCompleted}
              />
            ) : null}
            {mode === 'generic' ? <DiceRollPanel mode="manual" manualTitle="Tirada genérica" manualSubtitle="Para cualquier situación que no necesite asociarse a un nombre." manualPreset={{ pool: 3, hunger: 0 }} chronicleId={chronicleId} sessionId={sessionId} onRollCompleted={rollCompleted} /> : null}
          </section>
        </div>
      ) : null}
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'

import { ViewStateStatus } from '../../../components/ui/ViewStateStatus'

import './dashboard.css'

interface DashboardProps {
  readonly displayName: string
  readonly canAccessChronicles: boolean
  readonly canCreateChronicles: boolean
  readonly onNavigateCharacters: () => void
  readonly onNavigateChronicles: () => void
}

type DashboardChronicle = {
  id: string
  name: string
  description?: string | null
  status?: string | null
  characterCount?: number | null
  narratorName?: string | null
  locationName?: string | null
  currentObjective?: string | null
  organizationName?: string | null
  threatName?: string | null
  currentSessionName?: string | null
  currentSessionStatus?: string | null
}

type DashboardCharacter = {
  id: string
  name: string
  clan?: string | null
  generation?: string | number | null
  concept?: string | null
  hunger?: number | null
  health?: number | string | null
  willpower?: number | string | null
  humanity?: number | null
  bloodPotency?: number | null
}

type DashboardContext = {
  chronicles: DashboardChronicle[]
  continuation?: {
    chronicleName?: string | null
    characterName?: string | null
    sessionName?: string | null
    sessionStatus?: string | null
  } | null
  selectedChronicle?: {
    id?: string | null
    name?: string | null
    description?: string | null
    narratorName?: string | null
    locationName?: string | null
    currentObjective?: string | null
    organizationName?: string | null
    threatName?: string | null
    currentSessionName?: string | null
    currentSessionStatus?: string | null
  } | null
  characters: DashboardCharacter[]
  selectedCharacter?: DashboardCharacter | null
  session?: {
    name?: string | null
    status?: string | null
    number?: number | null
    summary?: string | null
  } | null
  previousSession?: {
    summary?: string | null
  } | null
  context?: {
    locationName?: string | null
    npcName?: string | null
    organizationName?: string | null
    threatName?: string | null
  } | null
  pending?: {
    experience?: number | null
    publicNotes?: number | null
    desireNeedsUpdate?: boolean | null
  } | null
}

const emptyContext: DashboardContext = {
  chronicles: [],
  characters: [],
  selectedCharacter: null,
  selectedChronicle: null,
  continuation: null,
  session: null,
  previousSession: null,
  context: null,
  pending: null,
}

function text(value: unknown, fallback = 'Sin registrar') {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function metricValue(value: unknown, fallback = 0) {
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    return numberValue(record.current ?? record.value ?? record.total, fallback)
  }
  return numberValue(value, fallback)
}

function statusLabel(status: string | null | undefined) {
  if (status === 'active') return 'Sesion activa'
  if (status === 'preparation') return 'Proxima sesion'
  if (status === 'completed') return 'Completada'
  return 'Sin sesion programada'
}

function Track({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div className="dashboard-track">
      <span className="dashboard-track__label">{label}</span>
      <span className="dashboard-track__dots" aria-label={label + ': ' + value + ' de ' + max}>
        {Array.from({ length: max }, (_, index) => (
          <i key={index} className={index < value ? 'is-filled' : ''} aria-hidden="true" />
        ))}
      </span>
      <strong>{value}</strong>
    </div>
  )
}

export function Dashboard({
  displayName,
  canAccessChronicles,
  canCreateChronicles,
  onNavigateCharacters,
  onNavigateChronicles,
}: DashboardProps) {
  const [data, setData] = useState<DashboardContext>(emptyContext)
  const [selectedChronicleId, setSelectedChronicleId] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(canAccessChronicles)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    if (!canAccessChronicles) {
      setData(emptyContext)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (selectedChronicleId) params.set('chronicleId', selectedChronicleId)
    if (selectedCharacterId) params.set('characterId', selectedCharacterId)
    fetch('/api/dashboard/context?' + params.toString(), { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo cargar el contexto de Inicio.')
        return response.json() as Promise<DashboardContext>
      })
      .then((nextData) => {
        if (!cancelled) setData({ ...emptyContext, ...nextData })
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar Inicio.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [canAccessChronicles, requestVersion, selectedCharacterId, selectedChronicleId])

  const selectedChronicle = data.selectedChronicle ?? data.chronicles[0] ?? null
  const characters = data.characters ?? []
  const selectedCharacter = data.selectedCharacter ?? characters[0] ?? null
  const session = data.session
  const context = data.context
  const pending = data.pending
  const selectedId = selectedChronicle?.id ?? null

  const chronicleTitle = text(selectedChronicle?.name, 'Selecciona una cronica')
  const characterName = text(selectedCharacter?.name, 'Sin personaje asociado')
  const characterPortrait = selectedCharacter ? '/api/characters/' + selectedCharacter.id + '/portrait' : null
  const sessionTitle = text(session?.name ?? selectedChronicle?.currentSessionName, 'Sin sesion preparada')
  const previousSummary = text(data.previousSession?.summary, 'Todavia no hay resumen de la sesion anterior.')
  const currentObjective = text(session?.summary ?? selectedChronicle?.currentObjective, 'El narrador aun no ha publicado un objetivo.')
  const characterCountLabel = characters.length > 1 ? characters.length + ' personajes' : '1 personaje'
  const status = statusLabel(session?.status ?? selectedChronicle?.currentSessionStatus)
  const hasContinuation = Boolean(data.continuation && (data.continuation?.chronicleName || data.continuation?.characterName || data.continuation?.sessionName))

  const statValues = useMemo(() => ({
    hunger: metricValue(selectedCharacter?.hunger),
    health: metricValue(selectedCharacter?.health, 0),
    willpower: metricValue(selectedCharacter?.willpower, 0),
    humanity: metricValue(selectedCharacter?.humanity, 0),
    bloodPotency: metricValue(selectedCharacter?.bloodPotency, 0),
  }), [selectedCharacter])

  if (!canAccessChronicles) {
    return <section className="dashboard dashboard--empty"><span className="dashboard__eyebrow">Inicio</span><h1>Bienvenido, {displayName}</h1><p>No tienes acceso a ninguna cronica activa.</p></section>
  }

  return (
    <section className="dashboard" aria-labelledby="dashboard-title" aria-busy={loading} data-view-state={loading ? 'loading' : error ? 'error' : data.chronicles.length === 0 ? 'empty' : 'content'}>
      <header className="dashboard__hero">
        <div>
          <span className="dashboard__eyebrow">Inicio</span>
          <h1 id="dashboard-title">Bienvenido, {displayName}</h1>
          <p>Selecciona una cronica activa y consulta el estado de tu personaje.</p>
        </div>
        {hasContinuation ? (
          <aside className="dashboard-continue">
            <span className="dashboard__eyebrow">Continuar donde lo dejaste</span>
            <strong>{text(data.continuation?.chronicleName)} · {text(data.continuation?.characterName)}</strong>
            <p><b>{text(data.continuation?.sessionStatus, 'Sesion')}</b> · {text(data.continuation?.sessionName, 'Sin sesion')}</p>
            <button type="button" className="button button--accent" onClick={() => onNavigateChronicles()}>Continuar</button>
          </aside>
        ) : null}
      </header>

      {loading ? <ViewStateStatus state="loading" className="dashboard-message">Cargando contexto...</ViewStateStatus> : null}
      {error ? <div className="dashboard-message dashboard-message--error" data-view-state="error" role="alert" aria-live="assertive"><span>{error}</span><button type="button" onClick={() => setRequestVersion((value) => value + 1)}>Reintentar</button></div> : null}

      {!loading && !error && data.chronicles.length === 0 ? (
        canCreateChronicles ? (
          <div className="dashboard-message" data-view-state="empty" role="status" aria-live="polite"><span>Aun no participas en ninguna cronica.</span><button type="button" onClick={onNavigateChronicles}>Gestionar cronicas</button></div>
        ) : (
          <ViewStateStatus state="empty" className="dashboard-message">Aun no participas en ninguna cronica.</ViewStateStatus>
        )
      ) : null}

      {!loading && !error && data.chronicles.length > 0 ? (
        <>
          <section className="dashboard-section" aria-labelledby="dashboard-chronicles-title">
            <div className="dashboard-section__heading"><div><span className="dashboard__eyebrow">Tu mesa de juego</span><h2 id="dashboard-chronicles-title">Tus cronicas activas</h2></div><span className="dashboard-count">{data.chronicles.length}</span></div>
            <div className="dashboard-chronicle-cards">
              {data.chronicles.map((chronicle) => {
                const active = chronicle.id === selectedId
                return (
                  <button type="button" key={chronicle.id} className={'dashboard-chronicle-card' + (active ? ' is-selected' : '')} onClick={() => { setSelectedChronicleId(chronicle.id); setSelectedCharacterId(null) }} aria-pressed={active}>
                    <span className="dashboard-chronicle-card__image" aria-hidden="true"><span>V5</span><img src={'/api/chronicles/' + chronicle.id + '/cover'} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /></span>
                    <span className="dashboard-chronicle-card__body"><strong>{chronicle.name}</strong><em>{text(selectedCharacter?.name, 'Sin personaje')}</em><span className="dashboard-chronicle-card__meta">{text(selectedCharacter?.clan, 'Clan sin registrar')}</span><span className="dashboard-badge">{statusLabel(chronicle.status)}</span></span>
                    <span className="dashboard-chronicle-card__arrow" aria-hidden="true">{active ? '✓' : '›'}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="dashboard-context-bar">
            <div><span className="dashboard-context-bar__mark">◈</span><strong>{chronicleTitle}</strong></div>
            <label>Personaje<select value={selectedCharacter?.id ?? ''} onChange={(event) => setSelectedCharacterId(event.target.value || null)} disabled={characters.length < 2}><option value="">{characterName}</option>{characters.filter((character) => character.id !== selectedCharacter?.id).map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select></label>
            <button type="button" className="button" onClick={onNavigateChronicles}>Cambiar cronica</button>
          </div>

          <section className="dashboard-primary-grid">
            <article className="dashboard-panel dashboard-character-panel">
              <div className="dashboard-panel__heading"><div><span className="dashboard__eyebrow">Tu personaje</span><h2>{characterName}</h2></div><span className="dashboard-status">Activo</span></div>
              <div className="dashboard-character-panel__content">
                <div className="dashboard-portrait"><span>{characterName.slice(0, 1).toUpperCase()}</span>{characterPortrait ? <img src={characterPortrait} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}</div>
                <div className="dashboard-character-panel__details"><p><b>Clan</b><span>{text(selectedCharacter?.clan)}</span></p><p><b>Generacion</b><span>{text(selectedCharacter?.generation)}</span></p><p><b>Concepto</b><span>{text(selectedCharacter?.concept)}</span></p><div className="dashboard-tracks"><Track label="Hambre" value={statValues.hunger} /><Track label="Salud" value={statValues.health} /><Track label="Voluntad" value={statValues.willpower} /><Track label="Humanidad" value={statValues.humanity} max={10} /><Track label="Potencia de sangre" value={statValues.bloodPotency} /></div></div>
              </div>
              <button type="button" className="button button--accent dashboard-panel__wide-action" onClick={onNavigateCharacters}>Abrir ficha</button>
            </article>

            <article className="dashboard-panel dashboard-chronicle-panel">
              <div className="dashboard-panel__heading"><div><span className="dashboard__eyebrow">Cronica seleccionada</span><h2>{chronicleTitle}</h2></div><span className="dashboard-status">{status}</span></div>
              <div className="dashboard-chronicle-panel__backdrop" aria-hidden="true"><span>◈</span>{selectedId ? <img src={'/api/chronicles/' + selectedId + '/cover'} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}</div>
              <dl className="dashboard-facts"><div><dt>Sesion</dt><dd>{sessionTitle}</dd></div><div><dt>Narrador</dt><dd>{text(selectedChronicle?.narratorName, 'El Narrador')}</dd></div><div><dt>Localizacion</dt><dd>{text(context?.locationName ?? selectedChronicle?.locationName)}</dd></div><div><dt>Objetivo actual</dt><dd>{currentObjective}</dd></div></dl>
              <p className="dashboard-chronicle-panel__description">{text(selectedChronicle?.description, 'La cronica aun no tiene una descripcion publicada.')}</p>
              <button type="button" className="button button--accent dashboard-panel__wide-action" onClick={onNavigateChronicles}>Entrar en cronica</button>
            </article>
          </section>

          <section className="dashboard-panel dashboard-previous"><span className="dashboard__eyebrow">Anteriormente...</span><p>{previousSummary}</p></section>

          <section className="dashboard-secondary-grid">
            <article className="dashboard-panel dashboard-ambition"><div className="dashboard-panel__heading"><h2>Ambicion y deseo</h2></div><div className="dashboard-dual-copy"><div><span className="dashboard-icon">♛</span><div><b>Ambicion</b><p>{text((selectedCharacter as DashboardCharacter & { ambition?: string | null } | null)?.ambition, 'Define hacia donde quiere llevar su historia.')}</p></div></div><div><span className="dashboard-icon">◈</span><div><b>Deseo</b><p>{text((selectedCharacter as DashboardCharacter & { desire?: string | null } | null)?.desire, 'Todavia no hay un deseo pendiente de actualizar.')}</p></div></div></div></article>
            <article className="dashboard-panel dashboard-now"><div className="dashboard-panel__heading"><h2>Ahora mismo</h2></div><div className="dashboard-now__grid"><p><span className="dashboard-icon">⌖</span><b>Localizacion</b><span>{text(context?.locationName ?? selectedChronicle?.locationName)}</span></p><p><span className="dashboard-icon">♙</span><b>PNJ relevante</b><span>{text(context?.npcName)}</span></p><p><span className="dashboard-icon">⌘</span><b>Organizacion</b><span>{text(context?.organizationName ?? selectedChronicle?.organizationName)}</span></p><p><span className="dashboard-icon">✹</span><b>Amenaza conocida</b><span>{text(context?.threatName ?? selectedChronicle?.threatName)}</span></p></div></article>
          </section>

          <section className="dashboard-panel dashboard-pending"><span className="dashboard__eyebrow">Pendiente</span><div><p><strong>☆</strong><b>{numberValue(pending?.experience)} PX disponibles</b></p><p><strong>↻</strong><span>{pending?.desireNeedsUpdate ? 'Deseo pendiente de actualizar' : 'Deseo al dia'}</span></p><p><strong>✉</strong><span>{numberValue(pending?.publicNotes)} notas nuevas del Narrador</span></p></div></section>
        </>
      ) : null}
    </section>
  )
}

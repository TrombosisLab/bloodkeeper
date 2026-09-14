import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  createDiceGateway,
  DiceApiError,
} from '../infrastructure/dice.api.ts'

import {
  DiceDieVisual,
} from './DiceDieVisual.tsx'

import type {
  DiceGateway,
  DicePoolContextSource,
  DiceRollHistoryItem,
} from '../types/dice.types.ts'

import './dice-history-panel.css'

const defaultGateway = createDiceGateway()

interface DiceHistoryPanelProps {
  readonly characterId?: string
  readonly chronicleId?: string
  readonly sessionId?: string
  readonly contextLabel?: string
  readonly refreshIntervalMs?: number
  readonly gateway?: DiceGateway
}

const sourceLabels: Readonly<
  Record<DicePoolContextSource, string>
> = {
  manual: 'Manual',
  character: 'Personaje',
  action: 'Acción',
}

function rouseConsequenceLabel(value: string): string {
  if (value === 'hungerFrenzyTestRequired') return 'Prueba de Frenesí por Hambre · Dificultad 4'
  if (value === 'torporTriggered') return 'Torpor'
  return 'Sin consecuencia adicional'
}

const outcomeLabels = {
  success: 'Éxito',
  failure: 'Fallo',
  critical: 'Crítico',
  messy_critical: 'Crítico conflictivo',
  bestial_failure: 'Fallo bestial',
} as const

function historyError(error: unknown): string {
  if (error instanceof DiceApiError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') {
      return 'Tu sesión ya no permite consultar tiradas.'
    }
    if (
      error.code === 'DICE_ROLL_CONTEXT_PERMISSION_DENIED' ||
      error.code === 'DICE_CONTEXT_PERMISSION_DENIED' ||
      error.code === 'CHRONICLE_PERMISSION_DENIED'
    ) {
      return 'No tienes permiso para consultar este historial.'
    }
    if (
      error.code === 'DICE_CONTEXT_NOT_FOUND' ||
      error.code === 'DICE_ROLL_CONTEXT_NOT_FOUND'
    ) {
      return 'La crónica o la sesión seleccionada ya no está disponible.'
    }
    if (error.code === 'INVALID_DICE_RESPONSE') {
      return 'Hay una entrada antigua incompatible; el historial seguirá mostrando las nuevas tiradas.'
    }
    if (error.code === 'DICE_REQUEST_FAILED') {
      return 'El servidor no ha podido consultar el historial de tiradas.'
    }
    if (error.code === 'DICE_ROLL_NOT_FOUND') {
      return 'La tirada ya no está disponible.'
    }
  }
  return 'No se pudo cargar el historial de tiradas.'
}

function displayedTime(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function contextText(item: DiceRollHistoryItem): string {
  const parts = [
    item.characterId === null ? null : 'Personaje',
    item.chronicleId === null ? null : 'Crónica',
    item.sessionId === null ? null : 'Sesión',
  ].filter((part): part is string => part !== null)
  return parts.length === 0 ? 'Sin contexto' : parts.join(' · ')
}

function mergedItems(
  current: readonly DiceRollHistoryItem[],
  incoming: readonly DiceRollHistoryItem[],
): readonly DiceRollHistoryItem[] {
  const known = new Set(current.map((item) => item.id))
  return [
    ...current,
    ...incoming.filter((item) => !known.has(item.id)),
  ]
}

export function DiceHistoryPanel({
  characterId,
  chronicleId,
  sessionId,
  contextLabel = 'Tus tiradas recientes',
  refreshIntervalMs = 0,
  gateway = defaultGateway,
}: DiceHistoryPanelProps) {
  const titleId = useId()
  const [items, setItems] =
    useState<readonly DiceRollHistoryItem[]>([])
  const [nextCursor, setNextCursor] =
    useState<string | null>(null)
  const [source, setSource] =
    useState<DicePoolContextSource | ''>('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] =
    useState<DiceRollHistoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [detailLoadingId, setDetailLoadingId] =
    useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const loadingRef = useRef(false)

  async function load(
    reset: boolean,
    silent = false,
    requestedSource: DicePoolContextSource | '' = source,
    requestedDescription = description,
  ): Promise<void> {
    if (loadingRef.current) return
    loadingRef.current = true
    if (reset && !silent) setLoading(true)
    else if (!reset) setLoadingMore(true)
    if (!silent) setError(null)
    try {
      const page = await gateway.history({
        ...(characterId === undefined ? {} : { characterId }),
        ...(chronicleId === undefined ? {} : { chronicleId }),
        ...(sessionId === undefined ? {} : { sessionId }),
        ...(requestedSource === '' ? {} : { source: requestedSource }),
        ...(requestedDescription.trim().length === 0
          ? {}
          : { description: requestedDescription.trim() }),
        limit: 10,
        ...(!reset && nextCursor !== null
          ? { cursor: nextCursor }
          : {}),
      })
      setItems((current) =>
        reset ? page.items : mergedItems(current, page.items),
      )
      setNextCursor(page.nextCursor)
      if (reset && !silent) setSelected(null)
    } catch (loadError: unknown) {
      if (!silent) {
        setError(historyError(loadError))
        if (reset) {
          setItems([])
          setNextCursor(null)
        }
      }
    } finally {
      loadingRef.current = false
      if (!silent) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    void load(true)
  }, [characterId, chronicleId, sessionId, gateway])

  useEffect(() => {
    if (refreshIntervalMs < 1000) return
    const refresh = () => {
      if (globalThis.document.visibilityState !== 'visible') return
      void load(true, true)
    }
    const onVisibilityChange = () => {
      if (globalThis.document.visibilityState === 'visible') refresh()
    }
    const timer = globalThis.setInterval(refresh, refreshIntervalMs)
    globalThis.document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      globalThis.clearInterval(timer)
      globalThis.document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [
    characterId,
    chronicleId,
    sessionId,
    source,
    description,
    refreshIntervalMs,
    gateway,
  ])

  async function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await load(true)
    setFiltersOpen(false)
  }

  async function clearFilters(): Promise<void> {
    setSource('')
    setDescription('')
    await load(true, false, '', '')
    setFiltersOpen(false)
  }

  async function toggleDetail(item: DiceRollHistoryItem) {
    if (selected?.id === item.id) {
      setSelected(null)
      return
    }
    setDetailLoadingId(item.id)
    setError(null)
    try {
      setSelected(await gateway.historyDetail(item.id))
    } catch (detailError: unknown) {
      setError(historyError(detailError))
    } finally {
      setDetailLoadingId(null)
    }
  }

  return (
    <section
      className="dice-history-panel"
      aria-labelledby={titleId}
    >
      <header className="dice-history-panel__heading">
        <div>
          <span>Memoria inmutable</span>
          <h2 id={titleId}>Historial de tiradas</h2>
          <p>{contextLabel}</p>
          {refreshIntervalMs >= 1000 ? (
            <small className="dice-history-panel__live">
              ● Actualización automática
            </small>
          ) : null}
        </div>
        <div className="dice-history-panel__actions">
          <button
            type="button"
            className="dice-history-panel__filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls={`${titleId}-filters`}
            onClick={() => setFiltersOpen((current) => !current)}
          >
            {filtersOpen ? 'Ocultar filtros' : 'Buscar tiradas'}
            {source !== '' || description.trim().length > 0
              ? ' · Activos'
              : ''}
          </button>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>
      </header>

      {filtersOpen ? (
        <form
          id={`${titleId}-filters`}
          className="dice-history-panel__filters"
          onSubmit={filter}
        >
          <label>
            Origen
            <select
              value={source}
              onChange={(event) =>
                setSource(event.target.value as DicePoolContextSource | '')
              }
            >
              <option value="">Todos</option>
              <option value="manual">Manual</option>
              <option value="character">Personaje</option>
              <option value="action">Acción</option>
            </select>
          </label>
          <label>
            Buscar texto de la tirada
            <input
              type="search"
              maxLength={160}
              value={description}
              placeholder="Ej.: persecución, ritual, 1d10…"
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="dice-history-panel__filter-actions">
            <button type="submit" disabled={loading}>
              Aplicar filtros
            </button>
            <button
              type="button"
              className="dice-history-panel__clear-filters"
              disabled={loading || (source === '' && description.trim().length === 0)}
              onClick={() => void clearFilters()}
            >
              Limpiar
            </button>
          </div>
        </form>
      ) : null}

      {error !== null ? (
        <p className="dice-history-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="dice-history-panel__state" aria-live="polite">
          Cargando historial…
        </p>
      ) : items.length === 0 ? (
        <p className="dice-history-panel__state">
          No hay tiradas para este contexto y filtros.
        </p>
      ) : (
        <ol className="dice-history-panel__list">
          {items.map((item) => (
            <li key={item.id} className="dice-history-panel__item">
              <button
                type="button"
                className="dice-history-panel__summary"
                aria-expanded={selected?.id === item.id}
                onClick={() => void toggleDetail(item)}
              >
                <span className="dice-history-panel__identity">
                  <strong>{item.actorDisplayName}</strong>
                  <small>
                    {item.description !== null ? `{item.description} · ` : ''}{sourceLabels[item.source]} · {contextText(item)}
                    {item.visibility === 'private' ? ' · Privada' : ''}
                  </small>
                </span>
                <span className="dice-history-panel__result">
                  <strong>
                    {item.roll.rouse === undefined
                      ? outcomeLabels[item.roll.outcome]
                      : `Control de Enardecimiento · ${outcomeLabels[item.roll.outcome]}`}
                  </strong>
                  <small>
                    {item.roll.rouse === undefined
                      ? `Reserva ${item.pool.finalPool} · ${item.roll.totalSuccesses}${item.roll.totalSuccesses === 1 ? ' éxito' : ' éxitos'}`
                      : `Hambre ${item.roll.rouse.hungerBefore} → ${item.roll.rouse.hungerAfter} · Dado usado ${item.roll.rouse.selectedResult}`}
                  </small>
                </span>
                <time dateTime={item.createdAt}>
                  {displayedTime(item.createdAt)}
                </time>
              </button>

              {detailLoadingId === item.id ? (
                <p className="dice-history-panel__detail-state">
                  Cargando detalle…
                </p>
              ) : selected?.id === item.id ? (
                <div
                  className="dice-history-panel__detail"
                  aria-label="Detalle de la tirada"
                >
                  {selected.description !== null ? (
                    <p>{selected.description}</p>
                  ) : null}
                  <dl>
                    <div>
                      <dt>Dificultad</dt>
                      <dd>{selected.roll.difficulty ?? 'Sin dificultad'}</dd>
                    </div>
                    <div>
                      <dt>Resultado especial</dt>
                      <dd>{outcomeLabels[selected.roll.outcome]}</dd>
                    </div>
                    {selected.roll.rouse !== undefined ? (
                      <>
                        <div>
                          <dt>Hambre antes y después</dt>
                          <dd>{selected.roll.rouse.hungerBefore} → {selected.roll.rouse.hungerAfter}</dd>
                        </div>
                        <div>
                          <dt>Consecuencia</dt>
                          <dd>{rouseConsequenceLabel(selected.roll.rouse.consequence)}</dd>
                        </div>
                      </>
                    ) : null}
                    <div>
                      <dt>Reglas</dt>
                      <dd>{selected.rulesVersion}</dd>
                    </div>
                  </dl>
                  <ol
                    className="dice-history-panel__dice"
                    aria-label="Dados individuales"
                  >
                    {selected.roll.dice.map((die, index) => (
                      <li
                        key={`${selected.id}-${index}`}
                        className={
                          die.type === 'hunger'
                            ? 'dice-history-panel__die dice-history-panel__die--hunger'
                            : 'dice-history-panel__die'
                        }
                        aria-label={`${die.type === 'hunger' ? 'Dado de Hambre' : 'Dado normal'}: ${die.value}`}
                      >
                        <DiceDieVisual die={die} />
                      </li>
                    ))}
                  </ol>
                  {selected.rerollParentId !== null ? (
                    <p className="dice-history-panel__relation">
                      Esta tirada deriva de una repetición anterior.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {nextCursor !== null ? (
        <button
          type="button"
          className="dice-history-panel__more"
          disabled={loadingMore}
          onClick={() => void load(false)}
        >
          {loadingMore ? 'Cargando…' : 'Mostrar más'}
        </button>
      ) : null}
    </section>
  )
}

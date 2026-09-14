import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  CharacterRouseCheckApiError,
  createCharacterRouseCheckOperationId,
} from '../../character-sheet/infrastructure/character-rouse-check.api'

import type {
  CharacterRouseCheckResult,
} from '../../character-sheet/types/character-rouse-check-persistence.types'

import {
  createDisciplinePowerRouseGateway,
} from '../infrastructure/discipline-power-rouse.api'

import type {
  DisciplinePowerRouseGateway,
  DisciplinePowerRouseProfile,
  DisciplinePowerRouseProfilesSnapshot,
} from '../types/discipline-power-rouse.types'

import './dice-roll-panel.css'

interface DisciplinePowerRousePanelProps {
  readonly characterId: string
  readonly hunger: number
  readonly reloadKey?: number
  readonly gateway?: DisciplinePowerRouseGateway
  readonly onApplied: (result: CharacterRouseCheckResult) => void
  readonly onConflictReload?: () => void
}

type PanelState = 'ready' | 'loading' | 'submitting' | 'error'

function errorMessage(error: unknown): string {
  if (error instanceof CharacterRouseCheckApiError) {
    if (error.status === 401) return 'Tu sesión ya no permite realizar controles.'
    if (error.status === 403) return 'No tienes permiso para usar los poderes de este personaje.'
    if (error.status === 409) return 'La ficha cambió en otra operación. Recárgala antes de continuar.'
    if (error.code === 'DISCIPLINE_POWER_ROUSE_UNAVAILABLE') return 'Este poder requiere un coste contextual y todavía no puede resolverse desde aquí.'
    if (error.status === 0 || error.status >= 500) return 'No se pudo conectar con el servidor.'
  }
  return 'No se pudieron cargar o realizar los controles de Disciplina.'
}

function resultLabel(result: CharacterRouseCheckResult): string {
  return result.success ? 'Éxito' : 'Fallo'
}

function selectedProfile(
  snapshot: DisciplinePowerRouseProfilesSnapshot | null,
  powerKey: string,
): DisciplinePowerRouseProfile | null {
  return snapshot?.profiles.find((profile) => profile.powerKey === powerKey) ?? null
}

export function DisciplinePowerRousePanel({
  characterId,
  hunger,
  reloadKey = 0,
  gateway,
  onApplied,
  onConflictReload,
}: DisciplinePowerRousePanelProps) {
  const resolvedGateway = useMemo(
    () => gateway ?? createDisciplinePowerRouseGateway(),
    [gateway],
  )
  const [snapshot, setSnapshot] = useState<DisciplinePowerRouseProfilesSnapshot | null>(null)
  const [powerKey, setPowerKey] = useState('')
  const [result, setResult] = useState<CharacterRouseCheckResult | null>(null)
  const [state, setState] = useState<PanelState>('loading')
  const [error, setError] = useState<string | null>(null)
  const operationIdRef = useRef<string | null>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    let active = true
    setState('loading')
    setError(null)
    setResult(null)
    void resolvedGateway.load(characterId)
      .then((nextSnapshot) => {
        if (!active) return
        setSnapshot(nextSnapshot)
        const firstReady = nextSnapshot.profiles.find((profile) => profile.status === 'ready')
        setPowerKey((current) => nextSnapshot.profiles.some((profile) => profile.powerKey === current && profile.status === 'ready')
          ? current
          : firstReady?.powerKey ?? '')
        setState('ready')
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setSnapshot(null)
        setPowerKey('')
        setError(errorMessage(loadError))
        setState('error')
      })
    return () => { active = false }
  }, [characterId, reloadKey, resolvedGateway])

  const readyProfiles = snapshot?.profiles.filter((profile) => profile.status === 'ready') ?? []
  const contextualProfiles = snapshot?.profiles.filter((profile) => profile.status === 'contextual') ?? []
  const profile = selectedProfile(snapshot, powerKey)
  const hungerMaximum = hunger >= 5
  const titleId = `discipline-rouse-${characterId}`

  async function execute(): Promise<void> {
    if (
      profile === null ||
      snapshot === null ||
      hungerMaximum ||
      submittingRef.current
    ) return

    submittingRef.current = true
    setState('submitting')
    setError(null)

    try {
      const operationId = operationIdRef.current ?? createCharacterRouseCheckOperationId()
      operationIdRef.current = operationId
      const nextResult = await resolvedGateway.execute(characterId, {
        expectedRevision: snapshot.characterRevision,
        operationId,
        powerKey: profile.powerKey,
      })
      operationIdRef.current = null
      setResult(nextResult)
      setState('ready')
      onApplied(nextResult)
    } catch (executeError: unknown) {
      if (!(executeError instanceof CharacterRouseCheckApiError) || (executeError.status !== 0 && executeError.status < 500)) {
        operationIdRef.current = null
      }
      setError(errorMessage(executeError))
      setState('error')
      if (executeError instanceof CharacterRouseCheckApiError && executeError.status === 409) onConflictReload?.()
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <section className="dice-roll-panel discipline-rouse-panel" aria-labelledby={titleId} data-mode="discipline-power">
      <header className="dice-roll-panel__header">
        <div>
          <span>Enardecimiento contextual</span>
          <h2 id={titleId}>Poder de Disciplina</h2>
        </div>
        <p>Usa el poder adquirido y conserva el mejor d10 cuando la regla lo permite.</p>
      </header>

      {state === 'loading' ? <p className="discipline-rouse-panel__state" role="status">Cargando poderes adquiridos…</p> : null}

      {state !== 'loading' && readyProfiles.length > 0 ? (
        <div className="discipline-rouse-panel__form">
          <label>
            Poder
            <select value={powerKey} onChange={(event) => { setPowerKey(event.target.value); setResult(null); setError(null) }} disabled={state === 'submitting'}>
              {readyProfiles.map((candidate) => <option key={candidate.powerKey} value={candidate.powerKey}>{candidate.powerName ?? candidate.powerKey}</option>)}
            </select>
          </label>

          {profile !== null ? (
            <div className="discipline-rouse-panel__summary">
              <span>{profile.disciplineKey ?? 'Disciplina'} · Nivel {profile.level ?? '—'}</span>
              <strong>{profile.dicePerCheck === 2 ? '2 d10 · se conserva el mayor' : '1 d10'}</strong>
            </div>
          ) : null}

          <button type="button" onClick={() => void execute()} disabled={state === 'submitting' || hungerMaximum || profile === null}>
            {state === 'submitting' ? 'Resolviendo…' : 'Realizar Control de Enardecimiento'}
          </button>
        </div>
      ) : null}

      {state !== 'loading' && readyProfiles.length === 0 ? (
        <p className="discipline-rouse-panel__state">
          {contextualProfiles.length > 0
            ? 'Tus poderes con coste contextual requieren información adicional antes de resolver el Control.'
            : 'No tienes poderes adquiridos con un Control de Enardecimiento disponible.'}
        </p>
      ) : null}

      {hungerMaximum && readyProfiles.length > 0 ? <p className="discipline-rouse-panel__notice" role="status">No disponible con Hambre 5.</p> : null}
      {error !== null ? <div className="discipline-rouse-panel__error" role="alert"><span>{error}</span>{state === 'error' && error.includes('cambió') && onConflictReload ? <button type="button" onClick={onConflictReload}>Recargar ficha</button> : null}</div> : null}

      {result !== null ? (
        <section className="discipline-rouse-panel__result" aria-live="polite" data-rouse-result={result.success ? 'success' : 'failure'}>
          <div><span>Último Control · {selectedProfile(snapshot, powerKey)?.powerName ?? 'Poder de Disciplina'}</span><strong>{resultLabel(result)}</strong><small>Hambre {result.hungerBefore} → {result.hungerAfter}</small></div>
          <div className="rouse-check__dice" aria-label="Dados del último Control de Enardecimiento">
            {result.rolls.map((roll, index) => <span key={`${index}:${roll}`} className={`rouse-check__die${roll === result.selectedResult ? ' rouse-check__die--selected' : ''}`} aria-label={`Dado ${index + 1}: ${roll}`}>{roll}</span>)}
          </div>
          {result.rolls.length > 1 ? <small>Resultado usado: {result.selectedResult}</small> : null}
        </section>
      ) : null}
    </section>
  )
}


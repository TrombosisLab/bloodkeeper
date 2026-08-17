import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { attributeDefinitions } from '../../character-creation/data/attribute-definitions.ts'
import { BLOOD_SORCERY_RITUAL_DEFINITIONS } from '../../character-creation/data/blood-sorcery-ritual-definitions.ts'
import { characterAdvantageDefinitions } from '../../character-creation/data/character-advantage-definitions.ts'
import { disciplineDefinitions } from '../../character-creation/data/discipline-definitions.ts'
import { disciplinePowerDefinitions } from '../../character-creation/data/discipline-power-definitions.ts'
import { oblivionCeremonyDefinitions } from '../../character-creation/data/oblivion-ceremony-definitions.ts'
import { skillDefinitions } from '../../character-creation/data/skill-definitions.ts'
import { thinBloodAlchemyFormulaCatalog } from '../../character-creation/data/thin-blood-alchemy-formulas.ts'
import { AdvantageInstanceDetailsEditor } from '../../character-creation/components/advantages/AdvantageInstanceDetailsEditor.tsx'
import { createInitialAdvantageInstanceDetails } from '../../character-creation/domain/advantage-instance-details-rules.ts'

import type { CharacterAdvantageSelectionDraft } from '../../character-creation/types/character-advantages-draft.types.ts'
import type { CharacterAdvantages, RatedTrait } from '../types/character-advantages.types.ts'
import type { CharacterProfilePhase } from '../types/character-sheet-model.types.ts'
import type {
  CharacterAdvancementKind,
  CharacterAdvancementPreview,
  CharacterAdvancementRequest,
  CharacterExperienceGateway,
  CharacterExperienceLedgerPage,
  CharacterExperienceMovement,
} from '../types/character-experience.types.ts'

import {
  CharacterExperienceApiError,
  createCharacterExperienceGateway,
} from '../infrastructure/character-experience.api.ts'

interface PersistedCharacterExperienceProps {
  characterId: string
  revision: number
  status: 'draft' | 'active' | 'archived'
  advantages: CharacterAdvantages
  profilePhase?: CharacterProfilePhase
  gateway?: CharacterExperienceGateway
  onPurchased?: () => void
}

const kindLabels: Readonly<Record<CharacterAdvancementKind, string>> = {
  attribute: 'Atributo',
  skill: 'Habilidad',
  specialty: 'Especialidad',
  discipline: 'Disciplina y Poder',
  ritual: 'Ritual',
  formula: 'Fórmula de Alquimia',
  ceremony: 'Ceremonia de Olvido',
  advantage: 'Ventaja',
  bloodPotency: 'Potencia de Sangre',
}

const vampireOnlyAdvancementKinds =
  new Set<CharacterAdvancementKind>([
    'discipline',
    'ritual',
    'formula',
    'ceremony',
    'bloodPotency',
  ])

export function advancementKindVisibleForProfile(
  profilePhase: CharacterProfilePhase | undefined,
  kind: CharacterAdvancementKind,
): boolean {
  return !(
    profilePhase === 'HUMAN' &&
    vampireOnlyAdvancementKinds.has(kind)
  )
}

const reasonLabels: Readonly<Record<string, string>> = {
  session_played: 'Sesión jugada',
  story_end: 'Final de historia',
  fast_session: 'Sesión con progreso rápido',
  purchase: 'Compra de evolución',
}

const movementLabels: Readonly<Record<CharacterExperienceMovement['type'], string>> = {
  grant: 'Concesión',
  spend: 'Gasto',
  correction: 'Corrección',
}

function allAdvantages(advantages: CharacterAdvantages): RatedTrait[] {
  return [
    ...advantages.advantages,
    ...advantages.backgrounds,
    ...advantages.flaws,
  ]
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function createEvolutionOperationId(): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof cryptoApi?.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
}

function errorMessage(error: unknown): string {
  if (error instanceof CharacterExperienceApiError) {
    switch (error.code) {
      case 'AUTHENTICATION_REQUIRED':
        return 'La sesión ha caducado. Vuelve a identificarte.'
      case 'CHARACTER_EXPERIENCE_PERMISSION_DENIED':
      case 'CHARACTER_ADVANCEMENT_PERMISSION_DENIED':
        return 'No tienes permiso para gestionar la Experiencia de este personaje.'
      case 'EXPERIENCE_INSUFFICIENT':
        return 'No hay Experiencia disponible suficiente para esta compra.'
      case 'CHARACTER_REVISION_CONFLICT':
        return 'La ficha cambió mientras confirmabas. Recárgala y vuelve a previsualizar.'
      case 'CHARACTER_ARCHIVED':
        return 'Un personaje archivado no puede evolucionar.'
      case 'CHARACTER_ADVANCEMENT_REJECTED':
      case 'CHARACTER_EVOLUTION_INVALID':
        return 'La mejora ya no cumple las reglas de evolución.'
      case 'CHARACTER_NOT_FOUND':
      case 'CHARACTER_EXPERIENCE_NOT_FOUND':
        return 'El personaje ya no está disponible.'
      default:
        return 'No se pudo completar la operación de Experiencia.'
    }
  }
  return 'No se pudo conectar con el servicio de Experiencia.'
}

function initialAdvantage(): CharacterAdvantageSelectionDraft {
  const definition = characterAdvantageDefinitions.find(
    (item) => item.active !== false && item.category !== 'flaw',
  ) ?? characterAdvantageDefinitions[0]
  if (!definition) {
    throw new Error('No hay Ventajas disponibles')
  }
  return {
    selectionId: 'evolution-preview',
    definitionKey: definition.key,
    category: definition.category,
    rating: definition.allowedRatings[0] ?? 1,
    origin: 'evolution',
    details: createInitialAdvantageInstanceDetails(definition),
  }
}

export function PersistedCharacterExperience({
  characterId,
  revision,
  status,
  advantages,
  profilePhase,
  gateway,
  onPurchased,
}: PersistedCharacterExperienceProps) {
  const resolvedGateway = useMemo(
    () => gateway ?? createCharacterExperienceGateway(),
    [gateway],
  )
  const [ledger, setLedger] = useState<CharacterExperienceLedgerPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showEvolution, setShowEvolution] = useState(false)
  const [kind, setKind] = useState<CharacterAdvancementKind>('attribute')
  const [primaryKey, setPrimaryKey] = useState<string>(attributeDefinitions[0]?.key ?? '')
  const [disciplineKey, setDisciplineKey] = useState<string>(disciplineDefinitions[0]?.key ?? '')
  const [powerKey, setPowerKey] = useState(
    disciplinePowerDefinitions.find((item) => item.disciplineKey === disciplineDefinitions[0]?.key)?.key ?? '',
  )
  const [specialtyName, setSpecialtyName] = useState('')
  const [advantageMode, setAdvantageMode] = useState<'new' | 'existing'>('new')
  const [advantage, setAdvantage] = useState<CharacterAdvantageSelectionDraft>(initialAdvantage)
  const [parentSelectionId, setParentSelectionId] = useState('')
  const [preview, setPreview] = useState<CharacterAdvancementPreview | null>(null)

  const existingAdvantages = allAdvantages(advantages).filter((item) => item.category !== 'flaw')
  const activeAdvantageDefinitions = characterAdvantageDefinitions.filter(
    (item) => item.active !== false && item.category !== 'flaw',
  )
  const selectedAdvantageDefinition = characterAdvantageDefinitions.find(
    (item) => item.key === advantage.definitionKey,
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMessage(null)
    void resolvedGateway.load(
      characterId,
      {
        limit: 25,
        offset: 0,
      },
    )
      .then((nextLedger) => {
        if (!cancelled) setLedger(nextLedger)
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [characterId, resolvedGateway])

  async function loadMoreExperience(): Promise<void> {
    const nextOffset =
      ledger?.nextOffset

    if (
      nextOffset === null ||
      nextOffset === undefined ||
      loadingMore
    ) {
      return
    }

    setLoadingMore(true)
    setMessage(null)

    try {
      const page =
        await resolvedGateway.load(
          characterId,
          {
            limit: 25,
            offset:
              nextOffset,
          },
        )

      setLedger((current) => {
        if (
          current === null ||
          current.characterId !==
            page.characterId
        ) {
          return page
        }

        return {
          characterId:
            page.characterId,
          total:
            page.total,
          spent:
            page.spent,
          available:
            page.available,
          movements: [
            ...current.movements,
            ...page.movements,
          ],
          nextOffset:
            page.nextOffset,
        }
      })
    } catch (error: unknown) {
      setMessage(
        errorMessage(error),
      )
    } finally {
      setLoadingMore(false)
    }
  }

  function resetPreview(): void {
    setPreview(null)
    setMessage(null)
  }

  function selectKind(nextKind: CharacterAdvancementKind): void {
    setKind(nextKind)
    if (nextKind === 'attribute') setPrimaryKey(attributeDefinitions[0]?.key ?? '')
    if (nextKind === 'skill' || nextKind === 'specialty') setPrimaryKey(skillDefinitions[0]?.key ?? '')
    if (nextKind === 'ritual') setPrimaryKey(BLOOD_SORCERY_RITUAL_DEFINITIONS[0]?.key ?? '')
    if (nextKind === 'formula') setPrimaryKey(thinBloodAlchemyFormulaCatalog[0]?.key ?? '')
    if (nextKind === 'ceremony') setPrimaryKey(oblivionCeremonyDefinitions[0]?.key ?? '')
    resetPreview()
  }

  function advancementRequest(): CharacterAdvancementRequest | null {
    if (kind === 'bloodPotency') return { kind }
    if (kind === 'specialty') {
      const name = specialtyName.trim()
      return primaryKey && name ? { kind, skillKey: primaryKey, name } : null
    }
    if (kind === 'discipline') {
      return disciplineKey && powerKey ? { kind, disciplineKey, powerKey } : null
    }
    if (kind === 'advantage') {
      if (advantageMode === 'existing') {
        const current = existingAdvantages.find((item) => item.key === advantage.selectionId)
        return current ? {
          kind,
          definitionKey: current.definitionKey,
          selectionId: current.key,
          targetRating: advantage.rating,
        } : null
      }
      return {
        kind,
        definitionKey: advantage.definitionKey,
        selectionId: null,
        targetRating: advantage.rating,
        parentSelectionId: parentSelectionId || null,
        ...(advantage.details === undefined ? {} : { details: advantage.details }),
      }
    }
    return primaryKey ? { kind, key: primaryKey } as CharacterAdvancementRequest : null
  }

  async function requestPreview(): Promise<void> {
    const request = advancementRequest()
    if (request === null) {
      setMessage('Completa los datos de la mejora antes de previsualizar.')
      return
    }
    setWorking(true)
    setMessage(null)
    try {
      setPreview(await resolvedGateway.preview(characterId, request))
    } catch (error: unknown) {
      setPreview(null)
      setMessage(errorMessage(error))
    } finally {
      setWorking(false)
    }
  }

  async function purchase(): Promise<void> {
    const request = advancementRequest()
    if (request === null || preview === null || !preview.eligible) return
    setWorking(true)
    setMessage(null)
    try {
      const result = await resolvedGateway.purchase(
        characterId,
        preview.revision,
        createEvolutionOperationId(),
        request,
      )

      const visibleMovementCount =
        Math.max(
          25,
          ledger?.movements.length ??
            25,
        )

      setLedger({
        characterId:
          result.experience.characterId,
        total:
          result.experience.total,
        spent:
          result.experience.spent,
        available:
          result.experience.available,
        movements:
          result.experience.movements.slice(
            0,
            visibleMovementCount,
          ),
        nextOffset:
          result.experience.movements.length >
          visibleMovementCount
            ? visibleMovementCount
            : null,
      })

      setPreview(null)
      setShowEvolution(false)
      setMessage('Compra aplicada. La ficha y el saldo ya están actualizados.')
      onPurchased?.()
    } catch (error: unknown) {
      setMessage(errorMessage(error))
    } finally {
      setWorking(false)
    }
  }

  function simpleOptions() {
    if (kind === 'attribute') return attributeDefinitions.map((item) => ({ key: item.key, label: item.label }))
    if (kind === 'skill' || kind === 'specialty') return skillDefinitions.map((item) => ({ key: item.key, label: item.label }))
    if (kind === 'ritual') return BLOOD_SORCERY_RITUAL_DEFINITIONS.map((item) => ({ key: item.key, label: `${item.name} · nivel ${item.level}` }))
    if (kind === 'formula') return thinBloodAlchemyFormulaCatalog.map((item) => ({ key: item.key, label: `${item.name} · nivel ${item.level}` }))
    if (kind === 'ceremony') return oblivionCeremonyDefinitions.map((item) => ({ key: item.key, label: `${item.name} · nivel ${item.level}` }))
    return []
  }

  const movementRows = ledger?.movements ?? []

  const visibleKindEntries =
    Object.entries(kindLabels).filter(
      ([value]) =>
        advancementKindVisibleForProfile(
          profilePhase,
          value as CharacterAdvancementKind,
        ),
    )

  return (
    <section className="sheet-section blood-experience-section persisted-experience" aria-labelledby="blood-experience-title" data-xp-panel="ready">
      <div className="section-title">
        <div>
          <p className="section-kicker">
            {profilePhase === 'HUMAN'
              ? 'Evolución'
              : 'Sangre y evolución'}
          </p>
          <h2 id="blood-experience-title">Experiencia</h2>
        </div>
        <span className="section-number">07</span>
      </div>

      {loading ? (
        <p className="persisted-experience__message" role="status">Cargando Experiencia…</p>
      ) : ledger !== null ? (
        <>
          <div className="experience-card persisted-experience__summary" data-xp-summary="loaded">
            <div><span>Experiencia disponible</span><strong>{ledger.available}</strong></div>
            <div><span>Experiencia gastada</span><strong>{ledger.spent}</strong></div>
            <div><span>Total obtenida</span><strong>{ledger.total}</strong></div>
          </div>

          <div className="persisted-experience__toolbar">
            {status !== 'archived' ? (
              <button type="button" className="persisted-experience__primary" aria-expanded={showEvolution} onClick={() => { setShowEvolution((visible) => !visible); resetPreview() }}>
                {showEvolution ? 'Cerrar evolución' : 'Evolucionar personaje'}
              </button>
            ) : <span className="persisted-experience__archived">La ficha archivada está en solo lectura.</span>}
          </div>

          {showEvolution ? (
            <div className="persisted-experience__evolution" data-xp-evolution="open">
              <div className="persisted-experience__form-grid">
                <label>
                  <span>Tipo de mejora</span>
                  <select value={kind} onChange={(event) => selectKind(event.target.value as CharacterAdvancementKind)}>
                    {visibleKindEntries.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>

                {simpleOptions().length > 0 ? (
                  <label>
                    <span>{kind === 'specialty' ? 'Habilidad' : 'Rasgo'}</span>
                    <select value={primaryKey} onChange={(event) => { setPrimaryKey(event.target.value); resetPreview() }}>
                      {simpleOptions().map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </label>
                ) : null}

                {kind === 'specialty' ? (
                  <label>
                    <span>Nueva Especialidad</span>
                    <input value={specialtyName} onChange={(event) => { setSpecialtyName(event.target.value); resetPreview() }} />
                  </label>
                ) : null}

                {kind === 'discipline' ? (
                  <>
                    <label>
                      <span>Disciplina</span>
                      <select value={disciplineKey} onChange={(event) => {
                        const next = event.target.value
                        setDisciplineKey(next)
                        setPowerKey(disciplinePowerDefinitions.find((item) => item.disciplineKey === next && item.active !== false)?.key ?? '')
                        resetPreview()
                      }}>
                        {disciplineDefinitions.filter((item) => item.active !== false).map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Poder del nuevo nivel</span>
                      <select value={powerKey} onChange={(event) => { setPowerKey(event.target.value); resetPreview() }}>
                        {disciplinePowerDefinitions.filter((item) => item.disciplineKey === disciplineKey && item.active !== false).map((item) => <option key={item.key} value={item.key}>{item.name} · nivel {item.level}</option>)}
                      </select>
                    </label>
                  </>
                ) : null}

                {kind === 'advantage' ? (
                  <>
                    <label>
                      <span>Operación</span>
                      <select value={advantageMode} onChange={(event) => { setAdvantageMode(event.target.value as 'new' | 'existing'); resetPreview() }}>
                        <option value="new">Nueva Ventaja</option>
                        <option value="existing" disabled={existingAdvantages.length === 0}>Mejorar Ventaja existente</option>
                      </select>
                    </label>
                    {advantageMode === 'new' ? (
                      <>
                        <label>
                          <span>Ventaja</span>
                          <select value={advantage.definitionKey} onChange={(event) => {
                            const definition = characterAdvantageDefinitions.find((item) => item.key === event.target.value)
                            if (!definition) return
                            setAdvantage({
                              selectionId: 'evolution-preview',
                              definitionKey: definition.key,
                              category: definition.category,
                              rating: definition.allowedRatings[0] ?? 1,
                              origin: 'evolution',
                              details: createInitialAdvantageInstanceDetails(definition),
                            })
                            resetPreview()
                          }}>
                            {activeAdvantageDefinitions.map((item) => <option key={item.key} value={item.key}>{item.name} · {item.category === 'merit' ? 'Mérito' : 'Trasfondo'}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Puntuación final</span>
                          <select value={advantage.rating} onChange={(event) => { setAdvantage({ ...advantage, rating: Number(event.target.value) }); resetPreview() }}>
                            {(selectedAdvantageDefinition?.allowedRatings ?? [1]).map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Ventaja padre, si procede</span>
                          <select value={parentSelectionId} onChange={(event) => { setParentSelectionId(event.target.value); resetPreview() }}>
                            <option value="">Sin relación padre</option>
                            {allAdvantages(advantages).map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
                          </select>
                        </label>
                      </>
                    ) : (
                      <>
                        <label>
                          <span>Ventaja existente</span>
                          <select value={advantage.selectionId} onChange={(event) => {
                            const current = existingAdvantages.find((item) => item.key === event.target.value)
                            if (!current) return
                            setAdvantage({
                              selectionId: current.key,
                              definitionKey: current.definitionKey,
                              category: current.category,
                              rating: current.value + 1,
                              origin: 'evolution',
                            })
                            resetPreview()
                          }}>
                            <option value="">Selecciona una Ventaja</option>
                            {existingAdvantages.map((item) => <option key={item.key} value={item.key}>{item.name} · actual {item.value}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Puntuación final</span>
                          <input type="number" min="1" max="5" value={advantage.rating} onChange={(event) => { setAdvantage({ ...advantage, rating: Number(event.target.value) }); resetPreview() }} />
                        </label>
                      </>
                    )}
                  </>
                ) : null}
              </div>

              {kind === 'advantage' && advantageMode === 'new' ? (
                <AdvantageInstanceDetailsEditor selection={advantage} onChange={(next) => { setAdvantage(next); resetPreview() }} />
              ) : null}

              <button type="button" className="persisted-experience__preview" disabled={working} onClick={() => void requestPreview()}>
                {working ? 'Consultando…' : 'Previsualizar coste y requisitos'}
              </button>

              {preview !== null ? (
                <div className={`persisted-experience__preview-card persisted-experience__preview-card--${preview.eligible ? 'eligible' : 'rejected'}`} data-xp-preview={preview.eligible ? 'eligible' : 'rejected'}>
                  <div className="persisted-experience__preview-values">
                    <div><span>Valor actual</span><strong>{preview.currentRating ?? '—'}</strong></div>
                    <div><span>Valor nuevo</span><strong>{preview.newRating ?? '—'}</strong></div>
                    <div><span>Coste calculado</span><strong>{preview.cost ?? '—'} XP</strong></div>
                    <div><span>Disponible</span><strong>{preview.available} XP</strong></div>
                  </div>
                  {preview.issues.length > 0 ? (
                    <ul className="persisted-experience__issues">{preview.issues.map((issue) => <li key={`${issue.code}:${issue.message}`}>{issue.message}</li>)}</ul>
                  ) : <p className="persisted-experience__eligible">La mejora cumple los requisitos actuales.</p>}
                  {preview.consequences.length > 0 ? <p className="persisted-experience__consequences">Dependencias: {preview.consequences.join(', ')}</p> : null}
                  <button type="button" className="persisted-experience__confirm" disabled={!preview.eligible || preview.cost === null || working || preview.revision !== revision} onClick={() => void purchase()}>
                    {preview.revision !== revision ? 'Recarga necesaria' : working ? 'Aplicando…' : 'Confirmar compra'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <details className="persisted-experience__history">
            <summary>Historial de Experiencia ({movementRows.length})</summary>
            {movementRows.length === 0 ? <p>No hay movimientos registrados.</p> : (
              <ol>
                {movementRows.map((movement) => (
                  <li key={movement.id}>
                    <div>
                      <strong>{movementLabels[movement.type]}</strong>
                      <span>{reasonLabels[movement.reason] ?? movement.reason}</span>
                    </div>
                    <div className="persisted-experience__movement-value">
                      <strong>{movement.component === 'spent' ? '−' : movement.amount >= 0 ? '+' : ''}{Math.abs(movement.amount)} XP</strong>
                      <time dateTime={movement.createdAt}>{displayDate(movement.createdAt)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {ledger.nextOffset !== null ? (
              <button
                type="button"
                className="persisted-experience__preview"
                disabled={loadingMore}
                onClick={() => void loadMoreExperience()}
              >
                {loadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            ) : null}
          </details>
        </>
      ) : null}

      {message !== null ? <p className="persisted-experience__message" role="status" aria-live="polite">{message}</p> : null}
    </section>
  )
}

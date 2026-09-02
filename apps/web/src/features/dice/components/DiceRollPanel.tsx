import {
  useMemo,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  createDiceGateway,
  DiceApiError,
} from '../infrastructure/dice.api.ts'

import type {
  CharacterDiceRollCommand,
  DiceGateway,
  DicePoolSnapshot,
  DiceRollSpecialResult,
  DiceTraitOption,
  ExecutedDiceRoll,
  ManualDiceRollCommand,
} from '../types/dice.types.ts'

import './dice-roll-panel.css'

interface DiceRollPanelProps {
  readonly mode: 'manual' | 'character'
  readonly characterId?: string
  readonly chronicleId?: string
  readonly sessionId?: string
  readonly attributes?: readonly DiceTraitOption[]
  readonly skills?: readonly DiceTraitOption[]
  readonly gateway?: DiceGateway
}

type PreparedCommand =
  | {
      readonly mode: 'manual'
      readonly command: ManualDiceRollCommand
    }
  | {
      readonly mode: 'character'
      readonly command: CharacterDiceRollCommand
    }

const defaultGateway = createDiceGateway()

const specialResultLabels: Readonly<
  Record<Exclude<DiceRollSpecialResult, 'none'>, string>
> = {
  critical: 'Crítico',
  messy_critical: 'Crítico conflictivo',
  bestial_failure: 'Fallo bestial',
}

function presentedOutcome(result: ExecutedDiceRoll): string {
  return result.roll.isSuccessful ? 'Éxito' : 'Fallo'
}

function specialResultLabel(
  result: ExecutedDiceRoll,
): string | null {
  return result.roll.specialResult === 'none'
    ? null
    : specialResultLabels[result.roll.specialResult]
}

function specialEvidenceLabel(
  result: ExecutedDiceRoll,
): string | null {
  if (result.roll.specialResult === 'critical') {
    return result.roll.specialEvidence.criticalPairs.length === 1
      ? '1 pareja crítica'
      : `${result.roll.specialEvidence.criticalPairs.length} parejas críticas`
  }
  if (result.roll.specialResult === 'messy_critical') {
    return 'Un Dado de Hambre participa en el crítico'
  }
  if (result.roll.specialResult === 'bestial_failure') {
    const count = result.roll.specialEvidence.bestialFailureDieIndices.length
    return count === 1
      ? '1 Dado de Hambre obtuvo un 1'
      : `${count} Dados de Hambre obtuvieron un 1`
  }
  return null
}

function successCountLabel(totalSuccesses: number): string {
  return totalSuccesses === 1 ? '1 éxito' : `${totalSuccesses} éxitos`
}

function optionalInteger(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value)
}

function errorMessage(error: unknown): string {
  if (error instanceof DiceApiError) {
    if (error.code === 'CHARACTER_NOT_FOUND') {
      return 'El personaje no está disponible para esta tirada.'
    }
    if (error.code === 'DICE_ROLL_RULE_VIOLATION') {
      return 'La reserva seleccionada no es válida.'
    }
    if (error.code === 'AUTHENTICATION_REQUIRED') {
      return 'Tu sesión ya no permite realizar tiradas.'
    }
  }
  return 'No se pudo completar la tirada.'
}

export function DiceRollPanel({
  mode,
  characterId,
  chronicleId,
  sessionId,
  attributes = [],
  skills = [],
  gateway = defaultGateway,
}: DiceRollPanelProps) {
  const [pool, setPool] = useState('3')
  const [hunger, setHunger] = useState('1')
  const [modifier, setModifier] = useState('0')
  const [modifierLabel, setModifierLabel] = useState('Modificador general')
  const [difficulty, setDifficulty] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] =
    useState<'contextual' | 'private'>('contextual')
  const [attribute, setAttribute] = useState(
    attributes[0]?.key ?? '',
  )
  const [skill, setSkill] = useState('')
  const [preview, setPreview] =
    useState<DicePoolSnapshot | null>(null)
  const [prepared, setPrepared] =
    useState<PreparedCommand | null>(null)
  const [result, setResult] =
    useState<ExecutedDiceRoll | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [rolling, setRolling] = useState(false)

  const titleId = useMemo(
    () => `dice-roll-${mode}-title`,
    [mode],
  )

  function invalidatePrepared(): void {
    setPreview(null)
    setPrepared(null)
    setResult(null)
    setError(null)
  }

  function presentedComponentLabel(
    key: string,
    fallback: string,
  ): string {
    const separator = key.lastIndexOf(':')
    const traitKey = separator === -1
      ? key
      : key.slice(separator + 1)
    return attributes.find((option) => option.key === traitKey)?.label
      ?? skills.find((option) => option.key === traitKey)?.label
      ?? fallback
  }

  function commandOptions() {
    const parsedModifier = optionalInteger(modifier)
    const parsedDifficulty = optionalInteger(difficulty)
    const normalizedDescription = description.trim()
    const normalizedLabel = modifierLabel.trim()
    return {
      ...(parsedModifier === undefined || parsedModifier === 0
        ? {}
        : {
            modifiers: [{
              key: 'userModifier',
              label: normalizedLabel || 'Modificador general',
              value: parsedModifier,
            }],
          }),
      ...(parsedDifficulty === undefined
        ? {}
        : { difficulty: parsedDifficulty }),
      ...(normalizedDescription === ''
        ? {}
        : { description: normalizedDescription }),
      ...(chronicleId === undefined ? {} : { chronicleId }),
      ...(sessionId === undefined ? {} : { sessionId }),
      ...(
        chronicleId === undefined && mode === 'manual'
          ? {}
          : { visibility }
      ),
    }
  }

  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPreparing(true)
    setError(null)
    setResult(null)

    try {
      if (mode === 'manual') {
        const command: ManualDiceRollCommand = {
          pool: Number(pool),
          hunger: Number(hunger),
          ...commandOptions(),
        }
        const snapshot = await gateway.previewManual(command)
        setPrepared(Object.freeze({ mode, command: Object.freeze(command) }))
        setPreview(snapshot)
      } else {
        const command: CharacterDiceRollCommand = {
          attribute,
          ...(skill === '' ? {} : { skill }),
          ...commandOptions(),
        }
        const snapshot = await gateway.previewCharacter(
          characterId ?? '',
          command,
        )
        setPrepared(Object.freeze({ mode, command: Object.freeze(command) }))
        setPreview(snapshot)
      }
    } catch (previewError: unknown) {
      setPreview(null)
      setPrepared(null)
      setError(errorMessage(previewError))
    } finally {
      setPreparing(false)
    }
  }

  async function rollPrepared() {
    if (prepared === null) {
      return
    }
    setRolling(true)
    setError(null)

    try {
      const executed = prepared.mode === 'manual'
        ? await gateway.manual(prepared.command)
        : await gateway.character(
            characterId ?? '',
            prepared.command,
          )
      setResult(executed)
    } catch (rollError: unknown) {
      setResult(null)
      setError(errorMessage(rollError))
    } finally {
      setRolling(false)
    }
  }

  return (
    <section
      className="dice-roll-panel"
      aria-labelledby={titleId}
      data-mode={mode}
    >
      <header className="dice-roll-panel__header">
        <div>
          <span>Dados V5</span>
          <h2 id={titleId}>
            {mode === 'manual'
              ? 'Tirada manual'
              : 'Tirada del personaje'}
          </h2>
        </div>
        <p>Prepara la reserva en el servidor antes de lanzar.</p>
      </header>

      <form className="dice-roll-panel__form" onSubmit={prepare}>
        {mode === 'manual' ? (
          <>
            <label>
              Reserva base
              <input
                type="number"
                min="1"
                step="1"
                required
                value={pool}
                onChange={(event) => {
                  invalidatePrepared()
                  setPool(event.target.value)
                }}
              />
            </label>
            <label>
              Hambre
              <input
                type="number"
                min="0"
                max="5"
                step="1"
                required
                value={hunger}
                onChange={(event) => {
                  invalidatePrepared()
                  setHunger(event.target.value)
                }}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Atributo
              <select
                required
                value={attribute}
                onChange={(event) => {
                  invalidatePrepared()
                  setAttribute(event.target.value)
                }}
              >
                {attributes.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Habilidad
              <select
                value={skill}
                onChange={(event) => {
                  invalidatePrepared()
                  setSkill(event.target.value)
                }}
              >
                <option value="">Sin habilidad</option>
                {skills.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label>
          Modificador
          <input
            type="number"
            step="1"
            value={modifier}
            onChange={(event) => {
              invalidatePrepared()
              setModifier(event.target.value)
            }}
          />
        </label>

        <label>
          Origen del modificador
          <input
            type="text"
            maxLength={80}
            value={modifierLabel}
            onChange={(event) => {
              invalidatePrepared()
              setModifierLabel(event.target.value)
            }}
          />
        </label>

        <label>
          Dificultad opcional
          <input
            type="number"
            min="1"
            step="1"
            value={difficulty}
            onChange={(event) => {
              invalidatePrepared()
              setDifficulty(event.target.value)
            }}
          />
        </label>

        <label className="dice-roll-panel__description">
          Descripción opcional
          <input
            type="text"
            maxLength={160}
            value={description}
            onChange={(event) => {
              invalidatePrepared()
              setDescription(event.target.value)
            }}
          />
        </label>

        {chronicleId !== undefined || mode === 'character' ? (
          <label>
            Visibilidad
            <select
              value={visibility}
              onChange={(event) => {
                invalidatePrepared()
                setVisibility(
                  event.target.value as 'contextual' | 'private',
                )
              }}
            >
              <option value="contextual">Visible para toda la crónica</option>
              <option value="private">Solo tú y el Narrador</option>
            </select>
          </label>
        ) : null}

        <button
          type="submit"
          disabled={preparing || rolling || (mode === 'character' && attribute === '')}
        >
          {preparing ? 'Preparando…' : 'Preparar reserva'}
        </button>
      </form>

      {error !== null ? (
        <p className="dice-roll-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      {preview !== null && prepared !== null ? (
        <section
          className="dice-pool-preview"
          aria-label="Reserva preparada"
          aria-live="polite"
        >
          <div className="dice-pool-preview__heading">
            <div>
              <span>Confirmación previa</span>
              <strong>Reserva final: {preview.finalPool}</strong>
            </div>
            <button
              type="button"
              onClick={rollPrepared}
              disabled={rolling}
            >
              {rolling
                ? 'Lanzando…'
                : result === null
                  ? 'Lanzar dados'
                  : 'Lanzar de nuevo'}
            </button>
          </div>

          {preview.context?.description !== null &&
          preview.context?.description !== undefined ? (
            <p>{preview.context.description}</p>
          ) : null}

          <ul className="dice-pool-preview__parts">
            {preview.components.map((component) => (
              <li key={component.key}>
                <span>
                  {presentedComponentLabel(
                    component.key,
                    component.label,
                  )}
                </span>
                <strong>{component.value}</strong>
              </li>
            ))}
            {preview.modifiers.map((item) => (
              <li key={item.key}>
                <span>{item.label}</span>
                <strong>{item.value >= 0 ? '+' : ''}{item.value}</strong>
              </li>
            ))}
          </ul>

          <dl className="dice-pool-preview__totals">
            <div><dt>Base</dt><dd>{preview.basePool}</dd></div>
            <div><dt>Modificadores</dt><dd>{preview.modifier >= 0 ? '+' : ''}{preview.modifier}</dd></div>
            <div><dt>Final</dt><dd>{preview.finalPool}</dd></div>
            <div><dt>Normales</dt><dd>{preview.normalDice}</dd></div>
            <div><dt>Hambre</dt><dd>{preview.hungerDice}</dd></div>
            <div><dt>Dificultad</dt><dd>{preview.difficulty ?? '—'}</dd></div>
          </dl>
        </section>
      ) : null}

      {result !== null ? (
        <section
          className="dice-roll-result"
          aria-label="Resultado de la tirada"
          aria-live="polite"
        >
          <div className="dice-roll-result__summary">
            <strong>{presentedOutcome(result)}</strong>
            {specialResultLabel(result) !== null ? (
              <mark className={`dice-roll-result__special dice-roll-result__special--${result.roll.specialResult}`}>
                {specialResultLabel(result)}
              </mark>
            ) : null}
            <span>{successCountLabel(result.roll.totalSuccesses)}</span>
            <small>
              Reserva {result.pool.basePool}
              {' · '}Modificador {result.pool.modifier >= 0 ? '+' : ''}{result.pool.modifier}
              {' · '}Final {result.pool.finalPool}
            </small>
          </div>

          {specialEvidenceLabel(result) !== null ? (
            <p className="dice-roll-result__evidence">
              {specialEvidenceLabel(result)}
            </p>
          ) : null}

          <ol className="dice-roll-result__dice">
            {result.roll.dice.map((die, index) => (
              <li
                key={`${die.type}-${index}`}
                className={`dice-roll-result__die dice-roll-result__die--${die.type}${die.isCriticalTen ? ' dice-roll-result__die--critical-ten' : ''}${die.isBestialFailureDie ? ' dice-roll-result__die--bestial-one' : ''}`}
                aria-label={`${die.type === 'hunger' ? 'Dado de Hambre' : 'Dado normal'}: ${die.value}`}
              >
                <span>{die.value}</span>
                <small>{die.type === 'hunger' ? 'Hambre' : 'Normal'}</small>
                {die.isCriticalTen ? <em>Diez crítico</em> : null}
                {die.isBestialFailureDie ? <em>Uno de Hambre</em> : null}
              </li>
            ))}
          </ol>

          {result.roll.meetsDifficulty !== null ? (
            <p className="dice-roll-result__difficulty">
              Dificultad {result.roll.difficulty}: {' '}
              {result.roll.meetsDifficulty ? 'superada' : 'no superada'}
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  )
}

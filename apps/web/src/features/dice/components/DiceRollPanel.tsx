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
  DiceGateway,
  DiceRollOutcome,
  DiceTraitOption,
  ExecutedDiceRoll,
} from '../types/dice.types.ts'

import './dice-roll-panel.css'

interface DiceRollPanelProps {
  readonly mode: 'manual' | 'character'
  readonly characterId?: string
  readonly attributes?: readonly DiceTraitOption[]
  readonly skills?: readonly DiceTraitOption[]
  readonly gateway?: DiceGateway
}

const defaultGateway = createDiceGateway()

const outcomeLabels: Readonly<Record<DiceRollOutcome, string>> = {
  success: 'Éxito',
  failure: 'Fallo',
  critical: 'Crítico',
  messy_critical: 'Crítico conflictivo',
  bestial_failure: 'Fallo bestial',
}

function presentedOutcome(result: ExecutedDiceRoll): string {
  if (result.roll.meetsDifficulty === false) {
    return 'Fallo'
  }

  return outcomeLabels[result.roll.outcome]
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
  attributes = [],
  skills = [],
  gateway = defaultGateway,
}: DiceRollPanelProps) {
  const [pool, setPool] = useState('3')
  const [hunger, setHunger] = useState('1')
  const [modifier, setModifier] = useState('0')
  const [difficulty, setDifficulty] = useState('')
  const [attribute, setAttribute] = useState(
    attributes[0]?.key ?? '',
  )
  const [skill, setSkill] = useState('')
  const [result, setResult] =
    useState<ExecutedDiceRoll | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)

  const titleId = useMemo(
    () => `dice-roll-${mode}-title`,
    [mode],
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRolling(true)
    setError(null)

    try {
      const parsedModifier = optionalInteger(modifier)
      const parsedDifficulty = optionalInteger(difficulty)
      const executed = mode === 'manual'
        ? await gateway.manual({
            pool: Number(pool),
            hunger: Number(hunger),
            modifier: parsedModifier,
            difficulty: parsedDifficulty,
          })
        : await gateway.character(
            characterId ?? '',
            {
              attribute,
              skill: skill === '' ? undefined : skill,
              modifier: parsedModifier,
              difficulty: parsedDifficulty,
            },
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
        <p>
          La reserva y el resultado se resuelven en el servidor.
        </p>
      </header>

      <form className="dice-roll-panel__form" onSubmit={submit}>
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
                onChange={(event) => setPool(event.target.value)}
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
                onChange={(event) => setHunger(event.target.value)}
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
                onChange={(event) => setAttribute(event.target.value)}
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
                onChange={(event) => setSkill(event.target.value)}
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
            onChange={(event) => setModifier(event.target.value)}
          />
        </label>

        <label>
          Dificultad opcional
          <input
            type="number"
            min="1"
            step="1"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          />
        </label>

        <button type="submit" disabled={rolling || (mode === 'character' && attribute === '')}>
          {rolling ? 'Lanzando…' : 'Lanzar dados'}
        </button>
      </form>

      {error !== null ? (
        <p className="dice-roll-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      {result !== null ? (
        <section
          className="dice-roll-result"
          aria-label="Resultado de la tirada"
          aria-live="polite"
        >
          <div className="dice-roll-result__summary">
            <strong>{presentedOutcome(result)}</strong>
            <span>{successCountLabel(result.roll.totalSuccesses)}</span>
            <small>
              Reserva {result.pool.basePool}
              {' · '}Modificador {result.pool.modifier >= 0 ? '+' : ''}{result.pool.modifier}
              {' · '}Final {result.pool.finalPool}
            </small>
          </div>

          <ol className="dice-roll-result__dice">
            {result.roll.dice.map((die, index) => (
              <li
                key={`${die.type}-${index}`}
                className={`dice-roll-result__die dice-roll-result__die--${die.type}`}
                aria-label={`${die.type === 'hunger' ? 'Dado de Hambre' : 'Dado normal'}: ${die.value}`}
              >
                <span>{die.value}</span>
                <small>{die.type === 'hunger' ? 'Hambre' : 'Normal'}</small>
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

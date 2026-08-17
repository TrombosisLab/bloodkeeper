import {
  useMemo,
  useState,
} from 'react'

import {
  clanKeys,
  getClanName,
} from '../../character-creation/data/clan-definitions'

import {
  generationOptions,
} from '../../character-creation/data/identity-options'

import {
  createCharacterInitialVampireGateway,
} from '../infrastructure/character-initial-vampire.api'

import {
  initialVampirePendingDecisionLabels,
  messageForInitialVampireTransitionError,
} from '../domain/initial-vampire-transition-ui-state'

import type {
  CharacterInitialVampireGateway,
} from '../infrastructure/character-initial-vampire.api'

import type {
  CharacterInitialVampirePendingDecision,
  CharacterInitialVampireTransitionReadModel,
} from '../types/character-transition-read-model.types'

interface PersistedInitialVampireTransitionProps {
  readonly transition:
    CharacterInitialVampireTransitionReadModel
  readonly gateway?:
    CharacterInitialVampireGateway
  readonly onResolved: () => void
}

export function PersistedInitialVampireTransition({
  transition,
  gateway,
  onResolved,
}: PersistedInitialVampireTransitionProps) {
  const resolvedGateway =
    useMemo(
      () =>
        gateway ??
        createCharacterInitialVampireGateway(),
      [gateway],
    )

  const [busyDecision, setBusyDecision] =
    useState<
      | CharacterInitialVampirePendingDecision
      | null
    >(null)

  const [message, setMessage] =
    useState<string | null>(null)

  const [clanKey, setClanKey] =
    useState('')

  const [generation, setGeneration] =
    useState('')

  const [sire, setSire] =
    useState('')

  const pending =
    transition.pendingDecisions

  const busy =
    busyDecision !== null

  async function resolve(
    decision:
      CharacterInitialVampirePendingDecision,
    operation: () => Promise<unknown>,
  ): Promise<void> {
    if (busy) return

    setBusyDecision(decision)
    setMessage(null)

    try {
      await operation()

      /*
       * No aplicamos aquí la respuesta parcial:
       * la ficha vuelve a leer snapshot + phase/pending.
       */
      onResolved()
    } catch (error: unknown) {
      setMessage(
        messageForInitialVampireTransitionError(
          error,
        ),
      )
    } finally {
      setBusyDecision(null)
    }
  }

  return (
    <section
      className={
        'sheet-section ' +
        'initial-vampire-transition'
      }
      aria-labelledby={
        'initial-vampire-transition-title'
      }
      aria-busy={busy}
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Sesión 0
          </p>

          <h2
            id={
              'initial-vampire-transition-title'
            }
          >
            Perfil vampírico en transición
          </h2>
        </div>

        <span className="section-number">
          09
        </span>
      </div>

      <div
        className={
          'initial-vampire-transition__content'
        }
      >
        <p>
          Resuelve sólo las decisiones que el
          backend mantiene pendientes. Las demás
          partes de la ficha permanecen intactas.
        </p>

        <div
          className={
            'initial-vampire-transition__pending'
          }
        >
          <strong>
            Decisiones pendientes
          </strong>

          <ul>
            {pending.map((decision) => (
              <li key={decision}>
                {
                  initialVampirePendingDecisionLabels[
                    decision
                  ]
                }
              </li>
            ))}
          </ul>
        </div>

        {message !== null ? (
          <p
            className={
              'initial-vampire-transition__message'
            }
            role="alert"
            aria-live="assertive"
          >
            {message}
          </p>
        ) : null}

        <div
          className={
            'initial-vampire-transition__actions'
          }
        >
          {pending.includes('clan') ? (
            <form
              className={
                'initial-vampire-transition__card'
              }
              onSubmit={(event) => {
                event.preventDefault()

                if (clanKey === '') return

                void resolve(
                  'clan',
                  () =>
                    resolvedGateway.resolveClan(
                      transition.characterId,
                      transition.revision,
                      clanKey,
                    ),
                )
              }}
            >
              <h3>Clan</h3>

              <p>
                Incorpora el Clan canónico cuando
                sea conocido.
              </p>

              <label>
                <span>Clan</span>

                <select
                  value={clanKey}
                  disabled={busy}
                  onChange={(event) => {
                    setClanKey(
                      event.target.value,
                    )
                  }}
                >
                  <option value="">
                    Seleccionar…
                  </option>

                  {clanKeys.map((key) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {getClanName(key)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className={
                  'initial-vampire-transition__submit'
                }
                disabled={
                  busy ||
                  clanKey === ''
                }
              >
                {busyDecision === 'clan'
                  ? 'Guardando Clan…'
                  : 'Resolver Clan'}
              </button>
            </form>
          ) : null}

          {pending.includes(
            'generation',
          ) ? (
            <form
              className={
                'initial-vampire-transition__card'
              }
              onSubmit={(event) => {
                event.preventDefault()

                if (generation === '') {
                  return
                }

                void resolve(
                  'generation',
                  () =>
                    resolvedGateway
                      .resolveGeneration(
                        transition.characterId,
                        transition.revision,
                        Number(generation),
                      ),
                )
              }}
            >
              <h3>Generación</h3>

              <p>
                Establece la Generación mediante
                las opciones canónicas existentes.
              </p>

              <label>
                <span>Generación</span>

                <select
                  value={generation}
                  disabled={busy}
                  onChange={(event) => {
                    setGeneration(
                      event.target.value,
                    )
                  }}
                >
                  <option value="">
                    Seleccionar…
                  </option>

                  {generationOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}.ª
                      </option>
                    ),
                  )}
                </select>
              </label>

              <button
                type="submit"
                className={
                  'initial-vampire-transition__submit'
                }
                disabled={
                  busy ||
                  generation === ''
                }
              >
                {
                  busyDecision ===
                    'generation'
                    ? 'Guardando Generación…'
                    : 'Resolver Generación'
                }
              </button>
            </form>
          ) : null}

          {pending.includes('sire') ? (
            <form
              className={
                'initial-vampire-transition__card'
              }
              onSubmit={(event) => {
                event.preventDefault()

                const normalized =
                  sire.trim()

                if (
                  normalized.length === 0
                ) {
                  return
                }

                void resolve(
                  'sire',
                  () =>
                    resolvedGateway.resolveSire(
                      transition.characterId,
                      transition.revision,
                      normalized,
                    ),
                )
              }}
            >
              <h3>Sire</h3>

              <p>
                Registra la decisión narrativa sin
                inferirla ni generarla
                automáticamente.
              </p>

              <label>
                <span>Nombre del Sire</span>

                <input
                  type="text"
                  value={sire}
                  disabled={busy}
                  autoComplete="off"
                  onChange={(event) => {
                    setSire(
                      event.target.value,
                    )
                  }}
                />
              </label>

              <button
                type="submit"
                className={
                  'initial-vampire-transition__submit'
                }
                disabled={
                  busy ||
                  sire.trim().length === 0
                }
              >
                {busyDecision === 'sire'
                  ? 'Guardando Sire…'
                  : 'Resolver Sire'}
              </button>
            </form>
          ) : null}
        </div>

        {pending.some(
          (decision) =>
            ![
              'clan',
              'generation',
              'sire',
            ].includes(decision),
        ) ? (
          <p
            className={
              'initial-vampire-transition__next'
            }
          >
            Las decisiones mecánicas restantes se
            resolverán con sus controles
            especializados, sin reiniciar el
            creador.
          </p>
        ) : null}
      </div>
    </section>
  )
}

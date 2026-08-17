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

import {
  initialVampireBloodPotencyOptions,
  initialVampireHungerOptions,
} from '../domain/initial-vampire-transition-blood-ui-state'

import {
  initialVampireDisciplineChoices,
  initialVampirePowerDisciplineChoices,
} from '../domain/initial-vampire-transition-discipline-ui-state'

import {
  PersistedInitialVampirePredatorType,
} from './PersistedInitialVampirePredatorType'

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

  const [
    bloodPotency,
    setBloodPotency,
  ] = useState('')

  const [
    initialHunger,
    setInitialHunger,
  ] = useState('')

  const [
    initialDisciplineKey,
    setInitialDisciplineKey,
  ] = useState('')

  const [
    initialDisciplineRating,
    setInitialDisciplineRating,
  ] = useState('')

  const [
    initialPowerDisciplineKey,
    setInitialPowerDisciplineKey,
  ] = useState('')

  const [
    initialPowerKey,
    setInitialPowerKey,
  ] = useState('')

  const pending =
    transition.pendingDecisions

  const bloodPotencyOptions =
    useMemo(
      () =>
        initialVampireBloodPotencyOptions(
          transition.identity.generation,
        ),
      [transition.identity.generation],
    )

  const bloodReady =
    bloodPotencyOptions.length > 0 &&
    bloodPotency !== '' &&
    initialHunger !== ''

  const disciplineChoices =
    useMemo(
      () =>
        initialVampireDisciplineChoices(
          transition,
        ),
      [transition],
    )

  const selectedDisciplineChoice =
    disciplineChoices.find(
      ({ key }) =>
        key === initialDisciplineKey,
    )

  const disciplineReady =
    selectedDisciplineChoice !==
      undefined &&
    selectedDisciplineChoice
      .ratingOptions.includes(
        Number(
          initialDisciplineRating,
        ),
      )

  const powerDisciplineChoices =
    useMemo(
      () =>
        initialVampirePowerDisciplineChoices(
          transition,
        ),
      [transition],
    )

  const selectedPowerDiscipline =
    powerDisciplineChoices.find(
      ({ key }) =>
        key ===
        initialPowerDisciplineKey,
    )

  const selectedPower =
    selectedPowerDiscipline
      ?.powers.find(
        ({ key }) =>
          key === initialPowerKey,
      )

  const powerReady =
    selectedPowerDiscipline !==
      undefined &&
    selectedPower !== undefined

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

          {pending.includes(
            'bloodState',
          ) ? (
            <form
              className={
                'initial-vampire-transition__card'
              }
              onSubmit={(event) => {
                event.preventDefault()

                if (!bloodReady) {
                  return
                }

                void resolve(
                  'bloodState',
                  () =>
                    resolvedGateway
                      .establishBlood(
                        transition.characterId,
                        transition.revision,
                        Number(
                          bloodPotency,
                        ),
                        Number(
                          initialHunger,
                        ),
                      ),
                )
              }}
            >
              <h3>Estado de Sangre</h3>

              <p>
                Selecciona explícitamente
                Potencia de Sangre y Hambre. Los
                rangos proceden de las reglas
                canónicas ya usadas por el
                creador.
              </p>

              <div
                className={
                  'blood-generation-summary'
                }
              >
                <strong>
                  {
                    transition.identity
                      .generation === null
                      ? 'Generación pendiente'
                      : `${transition.identity.generation}.ª`
                  }
                </strong>

                <span>
                  Referencia para el rango de
                  Potencia de Sangre
                </span>
              </div>

              {bloodPotencyOptions.length >
              0 ? (
                <>
                  <label>
                    <span>
                      Potencia de Sangre
                    </span>

                    <select
                      value={bloodPotency}
                      disabled={busy}
                      onChange={(event) => {
                        setBloodPotency(
                          event.target.value,
                        )
                      }}
                    >
                      <option value="">
                        Seleccionar…
                      </option>

                      {bloodPotencyOptions.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>
                      Hambre inicial
                    </span>

                    <select
                      value={initialHunger}
                      disabled={busy}
                      onChange={(event) => {
                        setInitialHunger(
                          event.target.value,
                        )
                      }}
                    >
                      <option value="">
                        Seleccionar…
                      </option>

                      {initialVampireHungerOptions.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </>
              ) : (
                <p>
                  Las opciones se habilitarán
                  cuando exista una Generación
                  canónica con rango de Sangre
                  definido.
                </p>
              )}

              <button
                type="submit"
                className={
                  'initial-vampire-transition__submit'
                }
                disabled={
                  busy ||
                  !bloodReady
                }
              >
                {
                  busyDecision ===
                    'bloodState'
                    ? 'Guardando Sangre…'
                    : 'Establecer Sangre'
                }
              </button>
            </form>
          ) : null}

          {pending.includes(
            'initialDisciplines',
          ) ? (
            <form
              className={
                'initial-vampire-transition__card'
              }
              onSubmit={(event) => {
                event.preventDefault()

                if (!disciplineReady) {
                  return
                }

                void resolve(
                  'initialDisciplines',
                  () =>
                    resolvedGateway
                      .manifestDiscipline(
                        transition.characterId,
                        transition.revision,
                        selectedDisciplineChoice.key,
                        Number(
                          initialDisciplineRating,
                        ),
                      ),
                )
              }}
            >
              <h3>
                Disciplinas iniciales
              </h3>

              <p>
                Manifiesta una contribución
                inicial cada vez. El catálogo y
                las puntuaciones disponibles se
                derivan del creador existente; el
                backend conserva la decisión
                final.
              </p>

              {disciplineChoices.length >
              0 ? (
                <>
                  <label>
                    <span>Disciplina</span>

                    <select
                      value={
                        initialDisciplineKey
                      }
                      disabled={busy}
                      onChange={(event) => {
                        setInitialDisciplineKey(
                          event.target.value,
                        )
                        setInitialDisciplineRating(
                          '',
                        )
                      }}
                    >
                      <option value="">
                        Seleccionar…
                      </option>

                      {disciplineChoices.map(
                        (choice) => (
                          <option
                            key={choice.key}
                            value={choice.key}
                          >
                            {choice.name}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Puntuación</span>

                    <select
                      value={
                        initialDisciplineRating
                      }
                      disabled={
                        busy ||
                        selectedDisciplineChoice ===
                          undefined
                      }
                      onChange={(event) => {
                        setInitialDisciplineRating(
                          event.target.value,
                        )
                      }}
                    >
                      <option value="">
                        Seleccionar…
                      </option>

                      {selectedDisciplineChoice
                        ?.ratingOptions.map(
                          (rating) => (
                            <option
                              key={rating}
                              value={rating}
                            >
                              {rating}
                            </option>
                          ),
                        )}
                    </select>
                  </label>
                </>
              ) : (
                <p>
                  No hay una Disciplina inicial
                  disponible para manifestar con
                  el estado canónico actual.
                </p>
              )}

              <button
                type="submit"
                className={
                  'initial-vampire-transition__submit'
                }
                disabled={
                  busy ||
                  !disciplineReady
                }
              >
                {
                  busyDecision ===
                    'initialDisciplines'
                    ? 'Manifestando Disciplina…'
                    : 'Manifestar Disciplina'
                }
              </button>
            </form>
          ) : null}

          {pending.includes(
            'initialPowers',
          ) ? (
            <form
              className={
                'initial-vampire-transition__card'
              }
              onSubmit={(event) => {
                event.preventDefault()

                if (!powerReady) {
                  return
                }

                void resolve(
                  'initialPowers',
                  () =>
                    resolvedGateway
                      .manifestPower(
                        transition.characterId,
                        transition.revision,
                        selectedPowerDiscipline.key,
                        selectedPower.key,
                      ),
                )
              }}
            >
              <h3>Poderes iniciales</h3>

              <p>
                Selecciona un Poder aprendible
                para una Disciplina ya
                manifestada. Nivel,
                prerrequisitos y capacidad se
                resuelven con las reglas de
                creación existentes.
              </p>

              {powerDisciplineChoices.length >
              0 ? (
                <>
                  <label>
                    <span>Disciplina</span>

                    <select
                      value={
                        initialPowerDisciplineKey
                      }
                      disabled={busy}
                      onChange={(event) => {
                        setInitialPowerDisciplineKey(
                          event.target.value,
                        )
                        setInitialPowerKey('')
                      }}
                    >
                      <option value="">
                        Seleccionar…
                      </option>

                      {powerDisciplineChoices.map(
                        (choice) => (
                          <option
                            key={choice.key}
                            value={choice.key}
                          >
                            {choice.name}
                            {' · '}
                            {
                              choice
                                .selectedPowerCount
                            }
                            {' / '}
                            {choice.rating}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Poder</span>

                    <select
                      value={initialPowerKey}
                      disabled={
                        busy ||
                        selectedPowerDiscipline ===
                          undefined
                      }
                      onChange={(event) => {
                        setInitialPowerKey(
                          event.target.value,
                        )
                      }}
                    >
                      <option value="">
                        Seleccionar…
                      </option>

                      {selectedPowerDiscipline
                        ?.powers.map(
                          (power) => (
                            <option
                              key={power.key}
                              value={power.key}
                            >
                              {power.name}
                              {' · nivel '}
                              {power.level}
                            </option>
                          ),
                        )}
                    </select>
                  </label>
                </>
              ) : (
                <p>
                  Manifiesta primero una
                  Disciplina con capacidad para
                  nuevos Poderes.
                </p>
              )}

              <button
                type="submit"
                className={
                  'initial-vampire-transition__submit'
                }
                disabled={
                  busy ||
                  !powerReady
                }
              >
                {
                  busyDecision ===
                    'initialPowers'
                    ? 'Manifestando Poder…'
                    : 'Manifestar Poder'
                }
              </button>
            </form>
          ) : null}
          {pending.includes(
            'predatorType',
          ) ? (
            <PersistedInitialVampirePredatorType
              transition={transition}
              busy={busy}
              resolving={
                busyDecision ===
                  'predatorType'
              }
              onAdopt={(input) => {
                void resolve(
                  'predatorType',
                  () =>
                    resolvedGateway
                      .adoptPredatorType(
                        transition.characterId,
                        transition.revision,
                        input,
                      ),
                )
              }}
            />
          ) : null}
        </div>

        {pending.some(
          (decision) =>
            ![
              'clan',
              'generation',
              'sire',
              'bloodState',
              'initialDisciplines',
              'initialPowers',
              'predatorType',
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

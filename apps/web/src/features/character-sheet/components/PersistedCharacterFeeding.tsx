import { displayValue } from './displayValue'
import {
  useMemo,
  useState,
} from 'react'

import {
  characterBloodDyscrasiaCatalog,
  characterBloodResonanceCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesBloodDyscrasiaAcquisitionMode,
  CharacterRulesBloodDyscrasiaKey,
  CharacterRulesBloodResonanceKey,
  CharacterRulesBloodSourceKind,
  CharacterRulesBloodTemperament,
} from '@v5r/character-rules'

import {
  CharacterBloodResonanceApiError,
  createCharacterBloodResonanceGateway,
  createCharacterBloodResonanceOperationId,
} from '../infrastructure/character-blood-resonance.api.ts'

import type {
  CharacterBloodResonanceGateway,
} from '../types/character-blood-resonance-persistence.types.ts'

interface PersistedCharacterFeedingProps {
  characterId: string
  revision: number
  hunger: number
  gateway?: CharacterBloodResonanceGateway
  onApplied: () => void
}

type BloodProfileMode =
  | 'humoral'
  | 'animalBlood'
  | 'resonanceFree'
  | 'none'

type SubmissionState =
  | 'ready'
  | 'submitting'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'rejected'
  | 'error'

const acquisitionModeLabels:
  Readonly<Record<
    CharacterRulesBloodDyscrasiaAcquisitionMode,
    string
  >> = {
    drainAndKill:
      'Drenar y matar a la presa',
    feedThreeNights:
      'Alimentarse de la presa durante tres noches',
  }

function messageForState(
  state: SubmissionState,
): string | null {
  switch (state) {
    case 'submitting':
      return 'Registrando alimentación…'
    case 'unauthorized':
      return 'La sesión ya no permite registrar la alimentación.'
    case 'forbidden':
      return 'No tienes permiso para registrar la alimentación de este personaje.'
    case 'not-found':
      return 'El personaje ya no está disponible.'
    case 'conflict':
      return 'La ficha cambió en otra operación. Recárgala antes de registrar la alimentación.'
    case 'rejected':
      return 'La alimentación no cumple las reglas de Sangre y Resonancia.'
    case 'error':
      return 'No se pudo registrar la alimentación.'
    case 'ready':
      return null
  }
}

function stateForError(
  error: unknown,
): SubmissionState {
  if (
    error instanceof
      CharacterBloodResonanceApiError
  ) {
    if (error.status === 401) {
      return 'unauthorized'
    }

    if (error.status === 403) {
      return 'forbidden'
    }

    if (error.status === 404) {
      return 'not-found'
    }

    if (error.status === 409) {
      return 'conflict'
    }

    if (
      error.status === 400 ||
      error.status === 422
    ) {
      return 'rejected'
    }
  }

  return 'error'
}

export function PersistedCharacterFeeding({
  characterId,
  revision,
  hunger,
  gateway,
  onApplied,
}: PersistedCharacterFeedingProps) {
  const resolvedGateway =
    useMemo(
      () =>
        gateway ??
        createCharacterBloodResonanceGateway(),
      [gateway],
    )

  const firstResonance =
    characterBloodResonanceCatalog
      .resonances[0]?.key ??
    'choleric'

  const firstTemperament =
    characterBloodResonanceCatalog
      .temperaments[0]?.key ??
    'fleeting'

  const [open, setOpen] =
    useState(false)

  const [submission, setSubmission] =
    useState<SubmissionState>('ready')

  const [sourceKind, setSourceKind] =
    useState<CharacterRulesBloodSourceKind>(
      'human',
    )

  const [profileMode, setProfileMode] =
    useState<BloodProfileMode>('humoral')

  const [resonanceKey, setResonanceKey] =
    useState<CharacterRulesBloodResonanceKey>(
      firstResonance,
    )

  const [temperament, setTemperament] =
    useState<CharacterRulesBloodTemperament>(
      firstTemperament,
    )

  const [hungerSlaked, setHungerSlaked] =
    useState(1)

  const [dyscrasiaKey, setDyscrasiaKey] =
    useState<
      CharacterRulesBloodDyscrasiaKey | ''
    >('')

  const [
    dyscrasiaAcquisitionMode,
    setDyscrasiaAcquisitionMode,
  ] = useState<
    CharacterRulesBloodDyscrasiaAcquisitionMode |
      ''
  >('')

  const availableDyscrasias =
    useMemo(
      () =>
        characterBloodDyscrasiaCatalog
          .definitions
          .filter(
            (definition) =>
              definition.resonanceKey ===
                resonanceKey &&
              definition.active,
          ),
      [resonanceKey],
    )

  const selectedDyscrasia =
    availableDyscrasias.find(
      ({ key }) => key === dyscrasiaKey,
    ) ?? null

  const dyscrasiaAvailable =
    profileMode === 'humoral' &&
    temperament === 'acute'

  const canSubmit =
    hunger >= 1 &&
    hungerSlaked >= 1 &&
    hungerSlaked <= hunger &&
    submission !== 'submitting'

  const message =
    messageForState(submission)

  function resetDyscrasia(): void {
    setDyscrasiaKey('')
    setDyscrasiaAcquisitionMode('')
  }

  function changeSource(
    next: CharacterRulesBloodSourceKind,
  ): void {
    setSourceKind(next)
    resetDyscrasia()

    if (
      next === 'human' &&
      profileMode === 'animalBlood'
    ) {
      setProfileMode('humoral')
    }

    if (
      next === 'animal' &&
      profileMode === 'resonanceFree'
    ) {
      setProfileMode('humoral')
    }
  }

  function changeProfile(
    next: BloodProfileMode,
  ): void {
    setProfileMode(next)
    resetDyscrasia()
  }

  function changeResonance(
    next:
      CharacterRulesBloodResonanceKey,
  ): void {
    setResonanceKey(next)
    resetDyscrasia()
  }

  function changeTemperament(
    next:
      CharacterRulesBloodTemperament,
  ): void {
    setTemperament(next)

    if (next !== 'acute') {
      resetDyscrasia()
    }
  }

  function changeDyscrasia(
    next:
      CharacterRulesBloodDyscrasiaKey | '',
  ): void {
    setDyscrasiaKey(next)

    if (next === '') {
      setDyscrasiaAcquisitionMode('')
      return
    }

    const definition =
      availableDyscrasias.find(
        ({ key }) => key === next,
      )

    setDyscrasiaAcquisitionMode(
      definition?.acquisitionModes[0] ??
        '',
    )
  }

  async function submit(): Promise<void> {
    if (!canSubmit) return

    setSubmission('submitting')

    const humoral =
      profileMode === 'humoral'

    const useDyscrasia =
      humoral &&
      temperament === 'acute' &&
      dyscrasiaKey !== '' &&
      dyscrasiaAcquisitionMode !== ''

    try {
      await resolvedGateway.apply(
        characterId,
        {
          expectedRevision: revision,
          operationId:
            createCharacterBloodResonanceOperationId(),
          sourceKind,
          resonanceKey:
            humoral
              ? resonanceKey
              : null,
          specialAffinityKey:
            profileMode === 'animalBlood'
              ? 'animalBlood'
              : profileMode ===
                    'resonanceFree'
                ? 'resonanceFree'
                : null,
          temperament:
            humoral ||
            profileMode === 'animalBlood'
              ? temperament
              : null,
          dyscrasiaKey:
            useDyscrasia
              ? dyscrasiaKey
              : null,
          dyscrasiaAcquisitionMode:
            useDyscrasia
              ? dyscrasiaAcquisitionMode
              : null,
          hungerSlaked,
        },
      )

      setSubmission('ready')
      setOpen(false)
      onApplied()
    } catch (error: unknown) {
      setSubmission(
        stateForError(error),
      )
    }
  }

  return (
    <div
      className="blood-feeding"
      data-blood-feeding="persisted"
    >
      <div className="blood-feeding__toolbar">
        <div>
          <strong>Alimentación</strong>
          <span>
            Registra la sangre consumida y la
            Resonancia realmente adquirida.
          </span>
        </div>

        <button
          type="button"
          className="blood-feeding__toggle"
          aria-expanded={open}
          disabled={hunger < 1}
          onClick={() => {
            setOpen((current) => !current)
            setSubmission('ready')
          }}
        >
          {open
            ? 'Cancelar'
            : 'Registrar alimentación'}
        </button>
      </div>

      {hunger < 1 ? (
        <p className="blood-feeding__notice">
          Hambre 0: el sistema sólo registra
          alimentaciones que sacian al menos
          1 punto de Hambre.
        </p>
      ) : null}

      {open ? (
        <div className="blood-feeding__form">
          <div className="blood-feeding__grid">
            <label>
              <span>Fuente</span>
              <select
                value={sourceKind}
                onChange={(event) =>
                  changeSource(
                    event.target.value as
                      CharacterRulesBloodSourceKind,
                  )
                }
              >
                <option value="human">
                  Humana
                </option>
                <option value="animal">
                  Animal
                </option>
              </select>
            </label>

            <label>
              <span>Perfil de sangre</span>
              <select
                value={profileMode}
                onChange={(event) =>
                  changeProfile(
                    event.target.value as
                      BloodProfileMode,
                  )
                }
              >
                <option value="humoral">
                  Resonancia humoral
                </option>

                {sourceKind === 'animal' ? (
                  <option value="animalBlood">
                    Afinidad propia de sangre
                    animal
                  </option>
                ) : null}

                {sourceKind === 'human' ? (
                  <option value="resonanceFree">
                    Sangre libre de Resonancia
                  </option>
                ) : null}

                <option value="none">
                  Sin Resonancia significativa
                </option>
              </select>
            </label>

            {profileMode === 'humoral' ? (
              <label>
                <span>Resonancia</span>
                <select
                  value={resonanceKey}
                  onChange={(event) =>
                    changeResonance(
                      event.target.value as
                        CharacterRulesBloodResonanceKey,
                    )
                  }
                >
                  {characterBloodResonanceCatalog
                    .resonances
                    .filter(
                      ({ active }) => active,
                    )
                    .map(
                      (resonance) => (
                        <option
                          key={resonance.key}
                          value={resonance.key}
                        >
                          {displayValue(resonance.name, 'Resonancia')}
                        </option>
                      ),
                    )}
                </select>
              </label>
            ) : null}

            {profileMode === 'humoral' ||
            profileMode === 'animalBlood' ? (
              <label>
                <span>Temperamento</span>
                <select
                  value={temperament}
                  onChange={(event) =>
                    changeTemperament(
                      event.target.value as
                        CharacterRulesBloodTemperament,
                    )
                  }
                >
                  {characterBloodResonanceCatalog
                    .temperaments
                    .filter(
                      ({ active }) => active,
                    )
                    .map(
                      (item) => (
                        <option
                          key={item.key}
                          value={item.key}
                        >
                          {displayValue(item.name, 'Alimento')}
                        </option>
                      ),
                    )}
                </select>
              </label>
            ) : null}

            <label>
              <span>Hambre saciada</span>
              <select
                value={hungerSlaked}
                onChange={(event) =>
                  setHungerSlaked(
                    Number(
                      event.target.value,
                    ),
                  )
                }
              >
                {Array.from(
                  { length: hunger },
                  (_, index) =>
                    index + 1,
                ).map((value) => (
                  <option
                    key={displayValue(value)}
                    value={value}
                  >
                    {displayValue(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {dyscrasiaAvailable ? (
            <div className="blood-feeding__dyscrasia">
              <label>
                <span>Discrasia adquirida</span>
                <select
                  value={dyscrasiaKey}
                  onChange={(event) =>
                    changeDyscrasia(
                      event.target.value as
                        CharacterRulesBloodDyscrasiaKey |
                        '',
                    )
                  }
                >
                  <option value="">
                    Ninguna
                  </option>

                  {availableDyscrasias.map(
                    (definition) => (
                      <option
                        key={definition.key}
                        value={definition.key}
                      >
                        {displayValue(definition.name, 'Dyscrasia')}
                      </option>
                    ),
                  )}
                </select>
              </label>

              {selectedDyscrasia !== null ? (
                <>
                  <p>
                    {displayValue(selectedDyscrasia.summary, '')}
                  </p>

                  <label>
                    <span>
                      Cómo se adquirió
                    </span>
                    <select
                      value={
                        dyscrasiaAcquisitionMode
                      }
                      onChange={(event) =>
                        setDyscrasiaAcquisitionMode(
                          event.target.value as
                            CharacterRulesBloodDyscrasiaAcquisitionMode,
                        )
                      }
                    >
                      {selectedDyscrasia
                        .acquisitionModes
                        .map((mode) => (
                          <option
                            key={mode}
                            value={mode}
                          >
                            {
                              acquisitionModeLabels[
                                mode
                              ]
                            }
                          </option>
                        ))}
                    </select>
                  </label>
                </>
              ) : null}
            </div>
          ) : null}

          <p className="blood-feeding__explanation">
            Una nueva alimentación reemplaza o
            limpia la Resonancia y Discrasia
            activas según el perfil registrado.
            El backend valida la operación y
            reduce el Hambre.
          </p>

          <div className="blood-feeding__actions">
            <button
              type="button"
              className="blood-feeding__confirm"
              disabled={!canSubmit}
              onClick={() => void submit()}
            >
              {submission === 'submitting'
                ? 'Registrando…'
                : 'Confirmar alimentación'}
            </button>
          </div>
        </div>
      ) : null}

      {message !== null ? (
        <p
          className="blood-feeding__message"
          role={
            submission === 'submitting'
              ? 'status'
              : 'alert'
          }
          aria-live="polite"
        >
          {displayValue(message, '')}
        </p>
      ) : null}
    </div>
  )
}

import { demoState } from '../data/demo-state'

import type {
  CharacterHumanityState,
} from '../domain/humanity-state-rules'

import type {
  CharacterProfilePhase,
} from '../types/character-sheet-model.types'

import { HumanityTrack } from './HumanityTrack'
import { HungerTrack } from './HungerTrack'

interface CharacterStateProps {
  humanity: CharacterHumanityState
  hunger: number | null
  bloodPotency?: number | null
  profilePhase?: CharacterProfilePhase
  stateEditing: boolean
  hungerEditing?: boolean
  onHumanityChange: (
    state: CharacterHumanityState,
  ) => void
  onHungerChange: (
    hunger: number,
  ) => void
}

function phaseKicker(
  profilePhase:
    | CharacterProfilePhase
    | undefined,
): string {
  switch (profilePhase) {
    case 'HUMAN':
      return 'Condición humana'

    case 'TRANSITIONAL_VAMPIRE':
      return 'Transición vampírica'

    case 'ESTABLISHED_VAMPIRE':
    case undefined:
      return 'Condición vampírica'
  }
}

export function CharacterState({
  humanity,
  hunger,
  bloodPotency,
  profilePhase,
  stateEditing,
  hungerEditing = stateEditing,
  onHumanityChange,
  onHungerChange,
}: CharacterStateProps) {
  const demo =
    profilePhase === undefined

  const resolvedBloodPotency =
    demo
      ? (
          bloodPotency ??
          demoState.bloodPotency
        )
      : bloodPotency ?? null

  const human =
    profilePhase === 'HUMAN'

  const pendingBloodState =
    profilePhase ===
      'TRANSITIONAL_VAMPIRE' &&
    (
      hunger === null ||
      resolvedBloodPotency === null
    )

  return (
    <section
      className="sheet-section state-section"
      aria-labelledby="state-title"
      data-profile-phase={
        profilePhase ?? 'DEMO'
      }
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            {phaseKicker(profilePhase)}
          </p>

          <h2 id="state-title">
            Estado
          </h2>
        </div>

        <span className="section-number">
          03
        </span>
      </div>

      <div
        className={
          human
            ? 'state-grid state-grid--human'
            : 'state-grid'
        }
      >
        <div className="state-card state-card--humanity">
          <div className="state-card__heading">
            <div>
              <span>Humanidad</span>
              <strong>
                {humanity.value}
              </strong>
            </div>

            <small>
              Manchas {humanity.stains}
            </small>
          </div>

          {stateEditing ? (
            <HumanityTrack
              state={humanity}
              mode="editable"
              onChange={onHumanityChange}
            />
          ) : (
            <HumanityTrack
              state={humanity}
            />
          )}
        </div>

        {!human && hunger !== null ? (
          <div className="state-card state-card--hunger">
            <div className="state-card__heading">
              <div>
                <span>Hambre</span>
                <strong>
                  {hunger}
                </strong>
              </div>

              <small>Máximo 5</small>
            </div>

            {hungerEditing ? (
              <HungerTrack
                value={hunger}
                mode="editable"
                onChange={onHungerChange}
              />
            ) : (
              <HungerTrack
                value={hunger}
              />
            )}
          </div>
        ) : null}

        {!human &&
        resolvedBloodPotency !== null ? (
          <div className="state-card state-card--blood">
            <div className="state-card__heading">
              <div>
                <span>Potencia de Sangre</span>
                <strong>
                  {resolvedBloodPotency}
                </strong>
              </div>

              <small>Estado actual</small>
            </div>

            <div className="blood-potency-display">
              <span>PS</span>

              <strong>
                {resolvedBloodPotency}
              </strong>
            </div>
          </div>
        ) : null}

        {pendingBloodState ? (
          <div
            className="state-card state-card--pending"
            role="status"
          >
            <div className="state-card__heading">
              <div>
                <span>
                  Recursos vampíricos
                </span>
                <strong>Pendientes</strong>
              </div>
            </div>

            <p>
              La ficha todavía no dispone de
              todos los estados de Sangre.
            </p>

            <ul>
              {hunger === null ? (
                <li>Hambre pendiente</li>
              ) : null}

              {resolvedBloodPotency ===
              null ? (
                <li>
                  Potencia de Sangre
                  pendiente
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

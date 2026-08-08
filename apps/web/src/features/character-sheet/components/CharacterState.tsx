import { demoState } from '../data/demo-state'

import type {
  CharacterHumanityState,
} from '../domain/humanity-state-rules'

import { HumanityTrack } from './HumanityTrack'
import { HungerTrack } from './HungerTrack'

interface CharacterStateProps {
  humanity: CharacterHumanityState
  hunger: number
  bloodPotency?: number
  stateEditing: boolean
  hungerEditing?: boolean
  onHumanityChange: (
    state: CharacterHumanityState,
  ) => void
  onHungerChange: (
    hunger: number,
  ) => void
}

export function CharacterState({
  humanity,
  hunger,
  bloodPotency =
    demoState.bloodPotency,
  stateEditing,
  hungerEditing = stateEditing,
  onHumanityChange,
  onHungerChange,
}: CharacterStateProps) {
  return (
    <section
      className="sheet-section state-section"
      aria-labelledby="state-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Condición vampírica
          </p>

          <h2 id="state-title">
            Estado
          </h2>
        </div>

        <span className="section-number">
          03
        </span>
      </div>

      <div className="state-grid">
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

        <div className="state-card state-card--blood">
          <div className="state-card__heading">
            <div>
              <span>Potencia de Sangre</span>
              <strong>
                {bloodPotency}
              </strong>
            </div>

            <small>Estado actual</small>
          </div>

          <div className="blood-potency-display">
            <span>PS</span>

            <strong>
              {bloodPotency}
            </strong>
          </div>
        </div>
      </div>
    </section>
  )
}

import { demoAttributes } from '../data/demo-attributes'

import type {
  CharacterDamageTrack,
} from '../domain/damage-track-rules'

import type {
  CharacterAttributeCategory,
} from '../types/character-attributes.types'

import { AttributeRow } from './AttributeRow'
import { CharacterTrackers } from './CharacterTrackers'

interface CharacterAttributesProps {
  attributes?: CharacterAttributeCategory[]
  health: CharacterDamageTrack
  healthCapacity?: number
  willpower: CharacterDamageTrack
  willpowerCapacity?: number
  stateEditing: boolean
  onHealthChange: (
    track: CharacterDamageTrack,
  ) => void
  onWillpowerChange: (
    track: CharacterDamageTrack,
  ) => void
}

export function CharacterAttributes({
  attributes = demoAttributes,
  health,
  healthCapacity,
  willpower,
  willpowerCapacity,
  stateEditing,
  onHealthChange,
  onWillpowerChange,
}: CharacterAttributesProps) {
  return (
    <section
      className="sheet-section attributes-section"
      aria-labelledby="attributes-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Capacidades innatas
          </p>

          <h2 id="attributes-title">
            Atributos
          </h2>
        </div>

        <span className="section-number">
          01
        </span>
      </div>

      <div className="attributes-grid">
        {attributes.map((category) => (
          <div
            className="attribute-category"
            key={category.key}
          >
            <h3>
              {category.label}
            </h3>

            <div className="attribute-category__rows">
              {category.attributes.map(
                (attribute) => (
                  <AttributeRow
                    key={attribute.key}
                    label={attribute.label}
                    value={attribute.value}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <CharacterTrackers
        health={health}
        healthCapacity={healthCapacity}
        willpower={willpower}
        willpowerCapacity={
          willpowerCapacity
        }
        stateEditing={stateEditing}
        onHealthChange={onHealthChange}
        onWillpowerChange={
          onWillpowerChange
        }
      />
    </section>
  )
}

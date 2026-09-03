import { displayValue } from './displayValue'
import type {
  RatedTrait,
} from '../types/character-advantages.types'

import { RatedTraitRow } from './RatedTraitRow'

interface TraitGroupProps {
  title: string
  subtitle: string
  traits: RatedTrait[]
  negative?: boolean
}

export function TraitGroup({
  title,
  subtitle,
  traits,
  negative = false,
}: TraitGroupProps) {
  return (
    <div className="trait-group">
      <header className="trait-group__header">
        <span>{displayValue(subtitle, '')}</span>
        <h3>{displayValue(title, '')}</h3>
      </header>

      <div className="trait-group__content">
        {traits.length > 0 ? (
          traits.map((trait) => (
            <RatedTraitRow
              key={trait.key}
              trait={trait}
              negative={negative}
            />
          ))
        ) : (
          <p className="trait-group__empty">
            Ninguno
          </p>
        )}
      </div>
    </div>
  )
}

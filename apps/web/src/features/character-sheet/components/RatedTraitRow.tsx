import { displayValue } from './displayValue'
import { DotRating } from '../../../components/ui/DotRating'

import type {
  RatedTrait,
} from '../types/character-advantages.types'

function traitDisplayName(value: unknown): string {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    for (const key of ['label', 'name', 'key']) {
      const candidate = record[key]
      if (typeof candidate === 'string' && candidate.trim() !== '') return candidate
    }
  }
  return 'Rasgo sin nombre'
}

interface RatedTraitRowProps {
  trait: RatedTrait
  negative?: boolean
}

export function RatedTraitRow({
  trait,
  negative = false,
}: RatedTraitRowProps) {
  return (
    <div
      className={
        negative
          ? 'rated-trait rated-trait--negative'
          : 'rated-trait'
      }
    >
      <details className="rated-trait__details">
        <summary>
          <div className="rated-trait__identity">
            <span>{traitDisplayName(trait.name)}</span>

            {trait.detail && (
              <small>{displayValue(trait.detail, '')}</small>
            )}
          </div>

          <DotRating
            label={traitDisplayName(trait.name)}
            value={trait.value}
          />
        </summary>

        <div className="rated-trait__metadata">
          <span>{displayValue(trait.categoryLabel, '')}</span>
          <span>{displayValue(trait.functionalTypeLabel, '')}</span>
          <span>{displayValue(trait.originLabel, '')}</span>

          {trait.sourceLabel ? (
            <span>
              {displayValue(trait.sourceLabel, '')}
              {trait.sourcePage
                ? ` · p. ${trait.sourcePage}`
                : ''}
            </span>
          ) : null}

          {trait.catalogStatus === 'missing' ? (
            <span>Referencia no disponible</span>
          ) : null}

          {trait.narrativeStatus === 'pending' ? (
            <span className="rated-trait__narrative-pending">
              {displayValue(trait.narrativeStatusLabel, '')}
            </span>
          ) : null}
        </div>
      </details>
    </div>
  )
}

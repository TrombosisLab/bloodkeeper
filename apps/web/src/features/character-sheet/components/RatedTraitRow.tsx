import { DotRating } from '../../../components/ui/DotRating'

import type {
  RatedTrait,
} from '../types/character-advantages.types'

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
            <span>{trait.name}</span>

            {trait.detail && (
              <small>{trait.detail}</small>
            )}
          </div>

          <DotRating
            label={trait.name}
            value={trait.value}
          />
        </summary>

        <div className="rated-trait__metadata">
          <span>{trait.categoryLabel}</span>
          <span>{trait.functionalTypeLabel}</span>
          <span>{trait.originLabel}</span>

          {trait.sourceLabel ? (
            <span>
              {trait.sourceLabel}
              {trait.sourcePage
                ? ` · p. ${trait.sourcePage}`
                : ''}
            </span>
          ) : null}

          {trait.catalogStatus === 'missing' ? (
            <span>Referencia no disponible</span>
          ) : null}
        </div>
      </details>
    </div>
  )
}

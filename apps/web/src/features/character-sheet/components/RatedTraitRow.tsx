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
    </div>
  )
}

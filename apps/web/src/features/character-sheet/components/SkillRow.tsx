import { displayValue } from './displayValue'
import { DotRating } from '../../../components/ui/DotRating'

interface SkillRowProps {
  label: string
  value: number
  specialties?: string[]
}

export function SkillRow({
  label,
  value,
  specialties = [],
}: SkillRowProps) {
  return (
    <div className="skill-row">
      <div className="skill-row__identity">
        <span className="skill-row__label">
          {displayValue(label, 'Habilidad')}
        </span>

        {specialties.length > 0 && (
          <span className="skill-row__specialties">
            {displayValue(specialties.join(' · '), '')}
          </span>
        )}
      </div>

      <DotRating
        label={displayValue(label, 'Habilidad')}
        value={value}
      />
    </div>
  )
}

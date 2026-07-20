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
          {label}
        </span>

        {specialties.length > 0 && (
          <span className="skill-row__specialties">
            {specialties.join(' · ')}
          </span>
        )}
      </div>

      <DotRating
        label={label}
        value={value}
      />
    </div>
  )
}

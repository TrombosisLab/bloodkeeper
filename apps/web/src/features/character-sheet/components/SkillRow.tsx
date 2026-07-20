import { DotRating } from '../../../components/ui/DotRating'

interface SkillRowProps {
  label: string
  value: number
}

export function SkillRow({
  label,
  value,
}: SkillRowProps) {
  return (
    <div className="skill-row">
      <span className="skill-row__label">
        {label}
      </span>

      <DotRating
        label={label}
        value={value}
      />
    </div>
  )
}

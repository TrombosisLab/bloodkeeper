import { DotRating } from '../../../components/ui/DotRating'

interface AttributeRowProps {
  label: string
  value: number
}

export function AttributeRow({
  label,
  value,
}: AttributeRowProps) {
  return (
    <div className="attribute-row">
      <span className="attribute-row__label">
        {label}
      </span>

      <DotRating
        label={label}
        value={value}
      />
    </div>
  )
}

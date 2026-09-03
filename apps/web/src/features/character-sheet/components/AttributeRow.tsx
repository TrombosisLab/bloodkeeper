import { displayValue } from './displayValue'
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
        {displayValue(label, 'Atributo')}
      </span>

      <DotRating
        label={displayValue(label, 'Atributo')}
        value={value}
      />
    </div>
  )
}

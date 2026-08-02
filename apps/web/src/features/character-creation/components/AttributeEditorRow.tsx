import type {
  AttributeKey,
} from '../types/character-attributes-draft.types'

import { DotRating } from '../../../components/ui/DotRating'

interface AttributeEditorRowProps {
  attributeKey: AttributeKey
  label: string
  value: number
  onChange: (
    key: AttributeKey,
    value: number,
  ) => void
}

export function AttributeEditorRow({
  attributeKey,
  label,
  value,
  onChange,
}: AttributeEditorRowProps) {
  return (
    <div className="attribute-editor-row">
      <span className="attribute-editor-row__label">
        {label}
      </span>

      <div className="attribute-editor-row__control">
        <button
          type="button"
          aria-label={`Reducir ${label}`}
          onClick={() =>
            onChange(
              attributeKey,
              value - 1,
            )
          }
          disabled={value <= 1}
        >
          −
        </button>

        <DotRating
          label={label}
          value={value}
          max={4}
          state="editable"
        />

        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          onClick={() =>
            onChange(
              attributeKey,
              value + 1,
            )
          }
          disabled={value >= 4}
        >
          +
        </button>
      </div>
    </div>
  )
}

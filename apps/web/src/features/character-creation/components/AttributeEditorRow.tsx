import type {
  AttributeKey,
} from '../types/character-attributes-draft.types'

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

        <div
          className="attribute-editor-row__dots"
          aria-label={`${label}: ${value}`}
        >
          {Array.from(
            { length: 4 },
            (_, index) => (
              <span
                key={index}
                className={
                  index < value
                    ? 'attribute-editor-dot attribute-editor-dot--filled'
                    : 'attribute-editor-dot'
                }
                aria-hidden="true"
              />
            ),
          )}
        </div>

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

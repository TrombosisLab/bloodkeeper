import type {
  SkillKey,
} from '../types/character-skills-draft.types'

interface SkillEditorRowProps {
  skillKey: SkillKey
  label: string
  value: number
  onChange: (
    key: SkillKey,
    value: number,
  ) => void
}

export function SkillEditorRow({
  skillKey,
  label,
  value,
  onChange,
}: SkillEditorRowProps) {
  return (
    <div className="skill-editor-row">
      <span className="skill-editor-row__label">
        {label}
      </span>

      <div className="skill-editor-row__control">
        <button
          type="button"
          aria-label={`Reducir ${label}`}
          disabled={value <= 0}
          onClick={() =>
            onChange(
              skillKey,
              value - 1,
            )
          }
        >
          −
        </button>

        <div
          className="skill-editor-row__dots"
          aria-label={`${label}: ${value}`}
        >
          {Array.from(
            { length: 4 },
            (_, index) => (
              <span
                key={index}
                className={
                  index < value
                    ? 'skill-editor-dot skill-editor-dot--filled'
                    : 'skill-editor-dot'
                }
                aria-hidden="true"
              />
            ),
          )}
        </div>

        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          disabled={value >= 4}
          onClick={() =>
            onChange(
              skillKey,
              value + 1,
            )
          }
        >
          +
        </button>
      </div>
    </div>
  )
}

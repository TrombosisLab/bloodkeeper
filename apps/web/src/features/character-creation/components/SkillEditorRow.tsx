import type {
  SkillKey,
} from '../types/character-skills-draft.types'

import { DotRating } from '../../../components/ui/DotRating'

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

        <DotRating
          label={label}
          value={value}
          max={4}
          state="editable"
        />

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

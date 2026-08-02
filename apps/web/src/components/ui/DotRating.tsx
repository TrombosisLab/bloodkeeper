interface DotRatingProps {
  value: number
  max?: number
  label: string
  state?:
    | 'readOnly'
    | 'editable'
    | 'locked'
    | 'error'
}

export function DotRating({
  value,
  max = 5,
  label,
  state = 'readOnly',
}: DotRatingProps) {
  const safeValue = Math.max(
    0,
    Math.min(value, max),
  )

  return (
    <div
      className={`dot-rating dot-rating--${state}`}
      role="img"
      aria-label={`${label}: ${safeValue} de ${max}`}
      aria-invalid={
        state === 'error'
          ? true
          : undefined
      }
      aria-disabled={
        state === 'locked'
          ? true
          : undefined
      }
    >
      {Array.from(
        { length: max },
        (_, index) => (
          <span
            key={index}
            className={
              index < safeValue
                ? 'dot-rating__dot dot-rating__dot--filled'
                : 'dot-rating__dot'
            }
            aria-hidden="true"
          />
        ),
      )}
    </div>
  )
}

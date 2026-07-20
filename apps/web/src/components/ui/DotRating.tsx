interface DotRatingProps {
  value: number
  max?: number
  label: string
}

export function DotRating({
  value,
  max = 5,
  label,
}: DotRatingProps) {
  const safeValue = Math.max(
    0,
    Math.min(value, max),
  )

  return (
    <div
      className="dot-rating"
      role="img"
      aria-label={`${label}: ${safeValue} de ${max}`}
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

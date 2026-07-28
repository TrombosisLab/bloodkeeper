interface AdvantageRatingControlProps {
  value: number

  min: number

  max: number

  fixedRating?: boolean

  onChange: (
    value: number,
  ) => void

  onRemove?: () => void
}


export function AdvantageRatingControl({
  value,
  min,
  max,
  fixedRating,
  onChange,
  onRemove,
}: AdvantageRatingControlProps) {
  return (
    <div className="advantage-rating-control">

      <button
        type="button"
        aria-label="Reducir nivel"
        disabled={
          value <= min && !onRemove
        }
        onClick={() => {
          if (
            value <= min &&
            onRemove
          ) {
            onRemove()
            return
          }

          onChange(
            Math.max(
              min,
              value - 1,
            ),
          )
        }}
      >
        −
      </button>

      <div
        className="advantage-rating-control__dots"
        aria-label={`Nivel ${value}`}
      >
        {Array.from(
          { length: max },
          (_, index) => (
            <span
              key={index}
              className={
                index < value
                  ? 'advantage-rating-control__dot advantage-rating-control__dot--active'
                  : 'advantage-rating-control__dot'
              }
              aria-hidden="true"
            />
          ),
        )}
      </div>

      <button
        type="button"
        aria-label="Aumentar nivel"
        disabled={
          !fixedRating &&
          value >= max
        }
        onClick={() =>
          onChange(
            Math.min(
              max,
              value + 1,
            ),
          )
        }
      >
        +
      </button>

    </div>
  )
}

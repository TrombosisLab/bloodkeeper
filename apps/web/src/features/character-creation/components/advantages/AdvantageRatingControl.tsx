interface AdvantageRatingControlProps {
  value: number

  min: number

  max: number

  onChange: (
    value: number,
  ) => void

  onRemove?: () => void
}


export function AdvantageRatingControl({
  value,
  min,
  max,
  onChange,
  onRemove,
}: AdvantageRatingControlProps) {
  return (
    <div className="advantage-rating-control">
      <button
        type="button"
        disabled={
          value <= min
        }
        onClick={() =>
          onChange(
            Math.max(
              min,
              value - 1,
            ),
          )
        }
      >
        −
      </button>


      <div className="advantage-rating-control__dots">
        {Array.from(
          {
            length: max,
          },
          (_, index) => {
            const rating =
              index + 1

            return (
              <span
                key={rating}
                className={
                  rating <= value
                    ? 'advantage-rating-control__dot advantage-rating-control__dot--active'
                    : 'advantage-rating-control__dot'
                }
              />
            )
          },
        )}
      </div>


      <button
        type="button"
        disabled={
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

      {onRemove && (
        <button
          type="button"
          onClick={
            onRemove
          }
          aria-label="Eliminar selección"
        >
          ×
        </button>
      )}

          </div>
  )
}

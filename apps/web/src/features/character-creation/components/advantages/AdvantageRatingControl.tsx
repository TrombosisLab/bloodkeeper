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
        aria-label="Reducir nivel"
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


      <div
        className="advantage-rating-control__dots"
        aria-label={`Nivel ${value}`}
      >
        {Array.from(
          {
            length: max,
          },
          (_, index) => (
            <span
              key={index}
              className={
                index < value
                  ? 'advantage-rating-control__dot advantage-rating-control__dot--active'
                  : 'advantage-rating-control__dot'
              }
            />
          ),
        )}
      </div>


      <button
        type="button"
        aria-label="Aumentar nivel"
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
          aria-label="Eliminar selección"
          className="advantage-rating-control__remove"
          onClick={
            onRemove
          }
        >
          ×
        </button>
      )}

    </div>
  )
}

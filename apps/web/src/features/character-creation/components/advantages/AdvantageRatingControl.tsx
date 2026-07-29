interface AdvantageRatingControlProps {
  value: number

  min: number

  max: number

  fixedRating?: boolean

  /*
   * Valores legales de puntuación.
   *
   * Cuando existe, el control no interpreta la puntuación
   * como un rango continuo, sino como una lista de valores
   * permitidos.
   *
   * Ejemplo:
   * [2, 4] permite pasar de 2 a 4 sin pasar por 3.
   */
  allowedRatings?: readonly number[]

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
  allowedRatings,
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
            allowedRatings
              ? allowedRatings[
                  Math.max(
                    0,
                    allowedRatings.indexOf(value) - 1,
                  )
                ]
              : Math.max(
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
          allowedRatings
            ? value >= allowedRatings[allowedRatings.length - 1]
            : !fixedRating &&
              value >= max
        }
        onClick={() =>
          onChange(
            allowedRatings
              ? allowedRatings[
                  Math.min(
                    allowedRatings.length - 1,
                    allowedRatings.indexOf(value) + 1,
                  )
                ]
              : Math.min(
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

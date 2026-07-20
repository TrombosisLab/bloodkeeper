interface HumanityTrackProps {
  value: number
}

export function HumanityTrack({
  value,
}: HumanityTrackProps) {
  const safeValue = Math.max(
    0,
    Math.min(value, 10),
  )

  return (
    <div className="humanity-track">
      {Array.from(
        { length: 10 },
        (_, index) => (
          <span
            key={index}
            className={
              index < safeValue
                ? 'humanity-box humanity-box--filled'
                : 'humanity-box'
            }
            aria-hidden="true"
          />
        ),
      )}

      <span className="sr-only">
        Humanidad {safeValue} de 10
      </span>
    </div>
  )
}

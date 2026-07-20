interface HungerTrackProps {
  value: number
}

export function HungerTrack({
  value,
}: HungerTrackProps) {
  const safeValue = Math.max(
    0,
    Math.min(value, 5),
  )

  return (
    <div className="hunger-track">
      {Array.from(
        { length: 5 },
        (_, index) => (
          <span
            key={index}
            className={
              index < safeValue
                ? 'hunger-drop hunger-drop--filled'
                : 'hunger-drop'
            }
            aria-hidden="true"
          />
        ),
      )}

      <span className="sr-only">
        Hambre {safeValue} de 5
      </span>
    </div>
  )
}

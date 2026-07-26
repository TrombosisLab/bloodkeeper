interface ThinBloodValidationPanelProps {
  valid: boolean
  errors: readonly string[]
}

export function ThinBloodValidationPanel({
  valid,
  errors,
}: ThinBloodValidationPanelProps) {
  return (
    <div
      className={
        valid
          ? 'thin-blood-validation thin-blood-validation--valid'
          : 'thin-blood-validation thin-blood-validation--invalid'
      }
      role="status"
      aria-live="polite"
    >
      {valid ? (
        <p>
          La selección de Sangre Débil es válida.
        </p>
      ) : (
        <>
          <p>
            La selección todavía no está completa:
          </p>

          <ul>
            {errors.map((error) => (
              <li key={error}>
                {error}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

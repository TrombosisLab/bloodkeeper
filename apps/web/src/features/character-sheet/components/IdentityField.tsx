import { displayValue } from './displayValue'
interface IdentityFieldProps {
  label: string
  value: string
  featured?: boolean
}

export function IdentityField({
  label,
  value,
  featured = false,
}: IdentityFieldProps) {
  return (
    <div
      className={
        featured
          ? 'identity-field identity-field--featured'
          : 'identity-field'
      }
    >
      <span className="identity-field__label">
        {label}
      </span>

      <strong className="identity-field__value">
        {displayValue(value)}
      </strong>
    </div>
  )
}

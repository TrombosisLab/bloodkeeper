import { isValidElement, type ReactNode } from 'react'
import { displayValue } from './displayValue'

export function renderSafeNode(value: unknown): ReactNode {
  if (value === null || value === undefined || typeof value === 'boolean') return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') return value
  if (isValidElement(value)) return value
  if (Array.isArray(value)) return value.map((item, index) => <span key={index}>{renderSafeNode(item)}</span>)
  return displayValue(value, '')
}

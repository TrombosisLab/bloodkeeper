export function displayValue(value: unknown, fallback = 'Sin registrar'): string {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['label', 'name', 'title', 'key']) {
      const candidate = record[key]
      if (typeof candidate === 'string' && candidate.trim() !== '') return candidate
    }
  }
  return fallback
}

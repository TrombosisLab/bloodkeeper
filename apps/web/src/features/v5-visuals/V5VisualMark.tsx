import type { CSSProperties } from 'react'
import { resolveClanVisual, resolveDisciplineVisual } from './v5-visual-catalog'

type Props = {
  readonly kind: 'clan-symbol' | 'clan-logo' | 'discipline'
  readonly value: string | null | undefined
  readonly className?: string
  readonly decorative?: boolean
}

type MaskStyle = CSSProperties & { readonly '--v5-visual-url': string }

export function V5VisualMark({ kind, value, className = '', decorative = false }: Props) {
  const asset = kind === 'discipline' ? resolveDisciplineVisual(value) : resolveClanVisual(value)
  const label = asset?.label ?? value?.trim() ?? 'Sin identificar'
  if (!asset) return <span className={`v5-visual-mark v5-visual-mark--fallback ${className}`.trim()} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>{label.slice(0, 2).toUpperCase()}</span>
  if (kind === 'discipline') {
    return <img className={`v5-visual-mark v5-visual-mark--discipline ${className}`.trim()} src={asset.icon} alt={decorative ? '' : `Disciplina ${label}`} aria-hidden={decorative || undefined} />
  }
  const url = kind === 'clan-logo' ? asset.logo : asset.symbol
  return <span className={`v5-visual-mark v5-visual-mark--${kind} ${className}`.trim()} style={{ '--v5-visual-url': `url("${url}")` } as MaskStyle} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `Clan ${label}`} aria-hidden={decorative || undefined} />
}

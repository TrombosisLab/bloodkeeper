import { bubbleLines, bubbleTextLayout } from '../domain/backdrop-bubbles'

export function BackdropBubbleLabel({ title, summary, metadata = '', width, height, scale }: {
  title: string; summary: string; metadata?: string; width: number; height: number; scale: number
}) {
  const pixels = width * scale, pixelHeight = height * scale
  if (pixels < 140 || pixelHeight < 95) {
    const lines = bubbleLines(title, Math.max(48, pixels - 16), Math.max(1, Math.min(3, Math.floor(pixelHeight / 14))), 11)
    return <g pointerEvents="none" data-bubble-label="" data-compact-label="">
      <text textAnchor="middle" style={{ fontSize: 11 / scale, fontWeight: 600 }} x={width / 2} y={height / 2 - (lines.length - 1) * 7 / scale + 4 / scale}>
        {lines.map((line, i) => <tspan key={i} x={width / 2} dy={i ? 14 / scale : 0}>{line}</tspan>)}
      </text>
    </g>
  }
  const layout = bubbleTextLayout(title, summary, pixels, pixelHeight, metadata)
  return <g pointerEvents="none" data-bubble-label="">
    <text textAnchor="middle" style={{ fontSize: 14 / scale, fontWeight: 600 }} x={width / 2} y={layout.titleY / scale}>
      {layout.titleLines.map((line, i) => <tspan key={i} x={width / 2} dy={i ? 20 / scale : 0}>{line}</tspan>)}
    </text>
    {layout.metadata && <text className="chronicle-backdrop__meta" textAnchor="middle" style={{ fontSize: 11 / scale }} x={width / 2} y={layout.metaY / scale}>{layout.metadata}</text>}
    {layout.summaryLines.length > 0 && <text style={{ fontSize: 12 / scale }} x={layout.inset / scale} y={layout.summaryY / scale}>
      {layout.summaryLines.map((line, i) => <tspan key={i} x={layout.inset / scale} dy={i ? 18 / scale : 0}>{line}</tspan>)}
    </text>}
  </g>
}

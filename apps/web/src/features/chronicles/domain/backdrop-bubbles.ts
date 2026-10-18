import type { BackdropState } from './chronicle-backdrop'
import { projectLayers } from './backdrop-layers.ts'
import type { LayerBox, LayerConnection, LayerProjection } from './backdrop-layers'

// A semantic map has stable, compact slots. A collapsed layer NEVER inherits
// its stored editor envelope or its descendants' positions.
export function projectBubbles(state: BackdropState, scale: number, storyId = '', scopeId = ''): LayerProjection {
  const source = projectLayers(state, 1, false, storyId)
  const groups = new Map(source.layers.map(g => [g.id, g]))
  const allowedNotes = new Map(source.notes.map(n => [n.id, n]))
  const result: LayerProjection = { layers: [], notes: [], links: [], boxes: [] }
  const representative = new Map<string, string>()
  type Item = { id: string; kind: 'layer' | 'note' }
  const children = (parent: string | null): Item[] => [
    ...source.layers.filter(g => (g.group.parentId ?? null) === parent).map(g => ({ id: g.id, kind: 'layer' as const })),
    ...source.notes.filter(n => n.groupId === parent).map(n => ({ id: n.id, kind: 'note' as const })),
  ]
  function closed(id: string, target: string) {
    representative.set(id, target)
    for (const item of children(id)) {
      if (item.kind === 'layer') closed(item.id, target)
      else representative.set(item.id, target)
    }
  }
  function place(item: Item, box: LayerBox, depth: number) {
    representative.set(item.id, item.id)
    if (item.kind === 'note') {
      result.notes.push({ ...allowedNotes.get(item.id)!, x: box.x, y: box.y, displayWidth: box.width, displayHeight: box.height })
      result.boxes.push(box)
      return
    }
    const original = groups.get(item.id)!
    const contents = children(item.id)
    const columns = Math.max(1, Math.ceil(Math.sqrt(contents.length)))
    const rows = Math.max(1, Math.ceil(contents.length / columns))
    const padding = box.width * .045, header = box.height * .23, gap = box.width * .03
    const width = (box.width - padding * 2 - gap * (columns - 1)) / columns
    const height = (box.height - header - padding - gap * (rows - 1)) / rows
    // Do not reveal a crowd of anonymous children: unfold only when their
    // labels have enough screen space. This never changes stored membership.
    const readableChildren = !contents.length || width * scale >= 140 && height * scale >= 95
    const expanded = box.width * scale >= 680 && box.height * scale >= 390 && readableChildren
    result.layers.push({ ...original, ...box, depth, expanded })
    if (!expanded) {
      closed(item.id, item.id)
      result.boxes.push(box)
      return
    }
    result.boxes.push({ id: item.id, x: box.x, y: box.y, width: box.width, height: header })
    if (!contents.length) return
    contents.forEach((child, i) => place(child, { id: child.id, x: box.x + padding + (i % columns) * (width + gap),
      y: box.y + header + Math.floor(i / columns) * (height + gap), width, height }, depth + 1))
  }
  const scoped = scopeId && groups.has(scopeId)
  const roots = scoped ? [{ id: scopeId, kind: 'layer' as const }] : children(null)
  const columns = Math.ceil(Math.sqrt(roots.length))
  roots.forEach((item, i) => place(item, { id: item.id, x: (i % columns) * 760, y: Math.floor(i / columns) * 540, width: 640, height: 420 }, 0))
  const links = new Map<string, LayerConnection>()
  for (const link of state.links) {
    const from = representative.get(link.from), to = representative.get(link.to)
    if (!from || !to || from === to) continue
    const key = JSON.stringify([from, to]), existing = links.get(key)
    if (existing) {
      existing.originals.push(link); existing.label = existing.originals.length + ' relaciones'
      existing.tentative = existing.tentative && link.tentative
    } else links.set(key, { ...link, id: 'bubble:' + key, from, to, originals: [link] })
  }
  result.links = [...links.values()]
  // Headers without incident relations are still obstacles, not endpoints.
  for (const box of result.boxes) if (result.layers.some(g => g.id === box.id && g.expanded) && !result.links.some(l => l.from === box.id || l.to === box.id)) box.id = 'header:' + box.id
  return result
}

// Preserve the original technical range; readability must not lock navigation.
export const MIN_BUBBLE_SCALE = .03
export function bubbleOverviewView(boxes: LayerBox[], viewport: { width: number; height: number }) {
  if (!boxes.length) return { x: 24, y: 24, scale: .8 }
  const left = Math.min(...boxes.map(b => b.x)), top = Math.min(...boxes.map(b => b.y))
  const width = Math.max(...boxes.map(b => b.x + b.width)) - left
  const height = Math.max(...boxes.map(b => b.y + b.height)) - top
  const scale = Math.max(MIN_BUBBLE_SCALE, Math.min(.8, (viewport.width - 48) / width, (viewport.height - 48) / height))
  return { scale, x: (viewport.width - width * scale) / 2 - left * scale,
    y: (viewport.height - height * scale) / 2 - top * scale }
}

export function bubbleLines(text: string, pixelWidth: number, maxLines: number, fontSize = 14): string[] {
  const limit = Math.max(8, Math.floor(pixelWidth / (fontSize * .57)))
  const words = text.trim().split(/\s+/), lines: string[] = []
  let line = ''
  for (let word of words) {
    while (word.length > limit) {
      if (line) { lines.push(line); line = '' }
      lines.push(word.slice(0, limit)); word = word.slice(limit)
    }
    if (line && line.length + word.length + 1 > limit) { lines.push(line); line = '' }
    line += (line ? ' ' : '') + word
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) return [...lines.slice(0, maxLines - 1), lines[maxLines - 1].slice(0, Math.max(1, limit - 1)) + '…']
  return lines
}

// Pixel-space typography stays readable at every zoom. This is presentation
// only: neither text nor graph geometry is rewritten to fit a bubble.
export function bubbleTextLayout(title: string, summary: string, width: number, height: number, metadata = '') {
  const inset = Math.min(56, Math.max(24, width * .11))
  const verticalInset = Math.min(44, Math.max(18, height * .12))
  const available = Math.max(20, height - verticalInset * 2)
  const titleLines = bubbleLines(title, width - inset * 2, Math.max(1, Math.min(4, Math.floor((available - 20) / 20))))
  const titleHeight = titleLines.length * 20
  const meta = metadata && available - titleHeight >= 28 ? metadata : ''
  const metaHeight = meta ? 25 : 0
  const capacity = Math.max(0, Math.min(14, Math.floor((available - titleHeight - metaHeight - 16) / 18)))
  const summaryLines = summary.trim() && capacity ? bubbleLines(summary, width - inset * 2, capacity, 12) : []
  const blockHeight = titleHeight + metaHeight + (summaryLines.length ? 16 + summaryLines.length * 18 : 0)
  const top = Math.max(verticalInset, (height - blockHeight) / 2)
  return { inset, titleLines, summaryLines, metadata: meta, titleY: top + 14,
    metaY: top + titleHeight + 15, summaryY: top + titleHeight + metaHeight + 28 }
}

import type { ChronicleStoryApiSnapshot, ChronicleStoryGuideCard } from '../types/chronicle-story-api.types'

export interface GraphNode {
  id: string; storyId: string; title: string; card?: ChronicleStoryGuideCard; entry: boolean
  x: number; y: number; width: number; height: number
}
export interface GraphEdge { id: string; from: string; to: string; label: string; cross: boolean }
export interface StoryBubble { id: string; title: string; type: string; x: number; y: number; width: number; height: number; count: number }
export interface StoryGraph { nodes: GraphNode[]; edges: GraphEdge[]; bubbles: StoryBubble[]; warnings: string[]; width: number; height: number }
export const graphCardId = (storyId: string, cardId: string) => JSON.stringify([storyId, cardId])
export const graphEntryId = (storyId: string) => JSON.stringify([storyId, null])

// Derived presentation only. Persisted positions, appearances and references never change.
export function buildStoryGraph(stories: readonly ChronicleStoryApiSnapshot[], rootStoryId?: string): StoryGraph {
  const nodes: GraphNode[] = [], edges: GraphEdge[] = [], warnings: string[] = []
  const byId = new Map<string, GraphNode>()
  const known = new Set(stories.map(s => s.id))
  if (known.size !== stories.length) throw new Error('La respuesta contiene historias duplicadas.')
  for (const story of stories) {
    const add = (n: GraphNode) => {
      if (byId.has(n.id)) throw new Error('El guion contiene tarjetas duplicadas.')
      nodes.push(n); byId.set(n.id, n)
    }
    add({ id: graphEntryId(story.id), storyId: story.id, title: 'Inicio del guion', entry: true, x: 0, y: 0, width: 240, height: 100 })
    for (const card of story.narratorGuide?.cards ?? []) {
      add({ id: graphCardId(story.id, card.id), storyId: story.id, title: card.title || 'Sin título', card, entry: false, x: 0, y: 0, width: 240, height: 100 })
    }
  }
  for (const story of stories) {
    for (const e of story.narratorGuide?.connections ?? []) {
      const from = graphCardId(story.id, e.from), to = graphCardId(story.id, e.to)
      if (byId.has(from) && byId.has(to)) edges.push({ id: JSON.stringify([story.id, 'edge', e.id]), from, to, label: e.label, cross: false })
      else warnings.push(story.title + ': una conexión apunta a una tarjeta no disponible.')
    }
    for (const card of story.narratorGuide?.cards ?? []) for (const link of card.storyLinks ?? []) {
      const from = graphCardId(story.id, card.id)
      const to = link.cardId ? graphCardId(link.storyId, link.cardId) : graphEntryId(link.storyId)
      if (known.has(link.storyId) && byId.has(to)) edges.push({ id: JSON.stringify([story.id, card.id, 'link', link.id]), from, to, label: link.label, cross: true })
      else warnings.push(story.title + ' / ' + card.title + ': destino de historia no disponible; no se reconstruye.')
    }
  }
  if (new Set(edges.map(e => e.id)).size !== edges.length) throw new Error('El guion contiene conexiones duplicadas.')
  const local = new Map<string, { nodes: GraphNode[]; width: number; height: number }>()
  for (const story of stories) {
    const ns = nodes.filter(n => n.storyId === story.id && !n.entry)
    const es = edges.filter(e => !e.cross && byId.get(e.from)?.storyId === story.id)
    // Condense cycles for dependency order, then unfold their presentation into
    // several columns. No edge is removed, added or reversed.
    let seq = 0
    const index = new Map<string, number>(), low = new Map<string, number>(), stack: string[] = [], onStack = new Set<string>(), components: string[][] = []
    const outs = new Map(ns.map(n => [n.id, es.filter(e => e.from === n.id).map(e => e.to)]))
    function visit(id: string) {
      index.set(id, seq); low.set(id, seq++); stack.push(id); onStack.add(id)
      for (const target of outs.get(id) ?? []) {
        if (!index.has(target)) { visit(target); low.set(id, Math.min(low.get(id)!, low.get(target)!)) }
        else if (onStack.has(target)) low.set(id, Math.min(low.get(id)!, index.get(target)!))
      }
      if (low.get(id) === index.get(id)) {
        const component: string[] = []
        let item: string
        do { item = stack.pop()!; onStack.delete(item); component.push(item) } while (item !== id)
        components.push(component)
      }
    }
    ns.forEach(n => { if (!index.has(n.id)) visit(n.id) })
    const comp = new Map<string, number>()
    components.forEach((ids, i) => ids.forEach(id => comp.set(id, i)))
    const adjacency = components.map(() => new Set<number>()), indegree = components.map(() => 0), ranks = components.map(() => 0)
    for (const e of es) { const a = comp.get(e.from)!, b = comp.get(e.to)!; if (a !== b && !adjacency[a].has(b)) { adjacency[a].add(b); indegree[b]++ } }
    const queue = indegree.flatMap((d, i) => d === 0 ? [i] : [])
    for (let at = 0; at < queue.length; at++) for (const target of adjacency[queue[at]]) {
      const span = Math.max(1, Math.ceil(Math.sqrt(components[queue[at]].length)))
      ranks[target] = Math.max(ranks[target], ranks[queue[at]] + span)
      if (--indegree[target] === 0) queue.push(target)
    }
    const columns = new Map<number, GraphNode[]>()
    components.forEach((ids, componentIndex) => {
      const items = ns.filter(n => ids.includes(n.id))
      const span = Math.max(1, Math.ceil(Math.sqrt(items.length)))
      const rows = Math.ceil(items.length / span)
      items.forEach((n, i) => {
        const rank = ranks[componentIndex] + Math.floor(i / rows)
        columns.set(rank, [...(columns.get(rank) ?? []), n])
      })
    })
    const height = Math.max(200, ...Array.from(columns.values(), items => items.length * 150 + 70))
    columns.forEach((items, rank) => items.forEach((n, i) => { n.x = 320 + rank * 320; n.y = (height - items.length * 150) / 2 + i * 150 + 25 }))
    const entry = byId.get(graphEntryId(story.id))!
    entry.x = 35; entry.y = height / 2 - 50
    local.set(story.id, { nodes: [entry, ...ns], width: ns.length ? 595 + Math.max(...columns.keys()) * 320 : 310, height })
  }
  const root = stories.find(s => s.id === rootStoryId) ?? stories.find(s => s.type === 'main_arc') ?? stories[0]
  const order: string[] = root ? [root.id] : []
  const placed = new Set<string>(order)
  for (let i = 0; i < order.length; i++) {
    const neighbors = edges.filter(e => e.cross).flatMap(e => {
      const a = byId.get(e.from)!.storyId, b = byId.get(e.to)!.storyId
      return a === order[i] ? [b] : b === order[i] ? [a] : []
    })
    for (const id of neighbors) if (!placed.has(id)) { placed.add(id); order.push(id) }
  }
  stories.forEach(s => { if (!placed.has(s.id)) { placed.add(s.id); order.push(s.id) } })
  const bubbles: StoryBubble[] = []
  for (const id of order) {
    const story = stories.find(s => s.id === id)!, item = local.get(id)!
    const parentEdge = edges.find(e => e.cross && (byId.get(e.from)!.storyId === id && bubbles.some(b => b.id === byId.get(e.to)!.storyId) || byId.get(e.to)!.storyId === id && bubbles.some(b => b.id === byId.get(e.from)!.storyId)))
    let x = 60, y = 60
    if (bubbles.length) {
      const otherId = parentEdge ? (byId.get(parentEdge.from)!.storyId === id ? byId.get(parentEdge.to)!.storyId : byId.get(parentEdge.from)!.storyId) : bubbles[0].id
      const parent = bubbles.find(b => b.id === otherId)!
      const source = parentEdge ? byId.get(byId.get(parentEdge.from)!.storyId === id ? parentEdge.to : parentEdge.from)! : null
      const cx = source ? source.x : parent.x + parent.width / 2
      const gap = 100
      const candidates = bubbles.flatMap(b => [
        { x: cx - item.width / 2, y: b.y - item.height - gap },
        { x: cx - item.width / 2, y: b.y + b.height + gap },
        { x: b.x, y: b.y - item.height - gap },
        { x: b.x, y: b.y + b.height + gap },
        { x: b.x - item.width - gap, y: b.y },
        { x: b.x + b.width + gap, y: b.y },
        { x: b.x - item.width - gap, y: b.y + b.height - item.height },
        { x: b.x + b.width + gap, y: b.y + b.height - item.height },
      ])
      const overlap = (p: { x: number; y: number }) => bubbles.some(b => p.x < b.x + b.width + gap && p.x + item.width + gap > b.x && p.y < b.y + b.height + gap && p.y + item.height + gap > b.y)
      const score = (p: { x: number; y: number }) => {
        const left = Math.min(p.x, ...bubbles.map(b => b.x))
        const top = Math.min(p.y, ...bubbles.map(b => b.y))
        const width = Math.max(p.x + item.width, ...bubbles.map(b => b.x + b.width)) - left
        const height = Math.max(p.y + item.height, ...bubbles.map(b => b.y + b.height)) - top
        // Favor a usable landscape envelope, not a vertical stack or huge empty
        // square. For linked stories also keep their real endpoints nearby.
        const envelope = Math.max(width / 1.6, height)
        const distance = Math.hypot(p.x + item.width / 2 - cx, p.y + item.height / 2 - (source?.y ?? parent.y + parent.height / 2))
        return envelope + width * height / 100000 + (parentEdge ? distance * .3 : 0)
      }
      const found = candidates.filter(p => !overlap(p)).sort((a, b) => score(a) - score(b) || a.y - b.y || a.x - b.x)[0]
      if (found) { x = found.x; y = found.y } else { x = cx - item.width / 2; y = Math.max(...bubbles.map(b => b.y + b.height)) + 170 }
    }
    item.nodes.forEach(n => { n.x += x; n.y += y })
    bubbles.push({ id, title: story.title, type: story.type, x, y, width: item.width, height: item.height, count: item.nodes.length - 1 })
  }
  const dx = 70 - Math.min(0, ...bubbles.map(b => b.x)), dy = 70 - Math.min(0, ...bubbles.map(b => b.y))
  nodes.forEach(n => { n.x += dx; n.y += dy })
  bubbles.forEach(b => { b.x += dx; b.y += dy })
  return { nodes, edges, bubbles, warnings, width: Math.max(500, ...bubbles.map(b => b.x + b.width + 70)), height: Math.max(350, ...bubbles.map(b => b.y + b.height + 70)) }
}

export function storyGraphUrl(origin: string, chronicleId: string, storyId: string): string {
  const target = new URL('/?story-graph=1#/story-graph', origin)
  target.searchParams.set('chronicleId', chronicleId)
  target.searchParams.set('storyId', storyId)
  return target.toString()
}

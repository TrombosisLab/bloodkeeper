// Presentation only: never changes persisted cards or connections.
export interface RouteBox { id: string; x: number; y: number; width: number; height: number }
interface Point { x: number; y: number }
interface Edge { id: string; from: string; to: string; label?: string }
export interface GuideRoute { path: string; labelX: number; labelY: number; labelLines: string[]; labelLeader?: string; points: Point[] }
const margin = 16
function hits(a: Point, b: Point, box: RouteBox): boolean {
  return a.x === b.x
    ? a.x > box.x - margin && a.x < box.x + box.width + margin && Math.max(a.y, b.y) > box.y - margin && Math.min(a.y, b.y) < box.y + box.height + margin
    : a.y > box.y - margin && a.y < box.y + box.height + margin && Math.max(a.x, b.x) > box.x - margin && Math.min(a.x, b.x) < box.x + box.width + margin
}
function ports(box: RouteBox, slot: number, count: number) {
  const fraction = (slot + 1) / (count + 1)
  return [
    { p: { x: box.x + box.width, y: box.y + box.height * fraction }, dx: 1, dy: 0 },
    { p: { x: box.x, y: box.y + box.height * fraction }, dx: -1, dy: 0 },
    { p: { x: box.x + box.width * fraction, y: box.y }, dx: 0, dy: -1 },
    { p: { x: box.x + box.width * fraction, y: box.y + box.height }, dx: 0, dy: 1 },
  ]
}
function simplify(points: Point[]): Point[] {
  const result: Point[] = []
  for (const p of points) {
    const last = result.at(-1)
    if (last && last.x === p.x && last.y === p.y) continue
    const before = result.at(-2)
    if (before && last && ((before.x === last.x && last.x === p.x && (last.y - before.y) * (p.y - last.y) >= 0) || (before.y === last.y && last.y === p.y && (last.x - before.x) * (p.x - last.x) >= 0))) result.pop()
    result.push(p)
  }
  return result
}
function roundedPath(points: Point[]): string {
  let path = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1]!, p = points[i]!, after = points[i + 1]!
    const incoming = Math.hypot(p.x - before.x, p.y - before.y)
    const outgoing = Math.hypot(after.x - p.x, after.y - p.y)
    const radius = Math.min(8, incoming / 2, outgoing / 2)
    if (!incoming || !outgoing) continue
    const a = { x: p.x - (p.x - before.x) / incoming * radius, y: p.y - (p.y - before.y) / incoming * radius }
    const b = { x: p.x + (after.x - p.x) / outgoing * radius, y: p.y + (after.y - p.y) / outgoing * radius }
    path += ` L ${a.x} ${a.y} Q ${p.x} ${p.y} ${b.x} ${b.y}`
  }
  const last = points.at(-1)!
  return `${path} L ${last.x} ${last.y}`
}
export function routeGuideConnections(boxes: readonly RouteBox[], edges: readonly Edge[]): Map<string, GuideRoute> {
  const result = new Map<string, GuideRoute>()
  const ordered = [...edges].sort((a, b) => a.id.localeCompare(b.id))
  const used: { a: Point; b: Point }[] = []
  const lanesX = [...new Set(boxes.flatMap(b => [Math.max(8, b.x - 24), b.x + b.width + 24]))]
  const lanesY = [...new Set(boxes.flatMap(b => [Math.max(8, b.y - 24), b.y + b.height + 24]))]
  for (const edge of ordered) {
    const from = boxes.find(b => b.id === edge.from), to = boxes.find(b => b.id === edge.to)
    if (!from || !to) continue
    const outgoing = ordered.filter(e => e.from === edge.from)
    const incoming = ordered.filter(e => e.to === edge.to)
    let best: Point[] = [], bestScore = Infinity
    for (const start of ports(from, outgoing.indexOf(edge), outgoing.length)) for (const end of ports(to, incoming.indexOf(edge), incoming.length)) {
      const a = { x: start.p.x + start.dx * 24, y: start.p.y + start.dy * 24 }
      const b = { x: end.p.x + end.dx * 24, y: end.p.y + end.dy * 24 }
      if (a.x < 8 || a.y < 8 || b.x < 8 || b.y < 8) continue
      // Bound candidate count even for the maximum 120-card / 240-edge guide.
      const nearby = (lanes: number[], midpoint: number) => [...new Set([
        ...[...lanes].sort((x, y) => Math.abs(x - midpoint) - Math.abs(y - midpoint) || x - y).slice(0, 10),
        Math.min(...lanes), Math.max(...lanes),
      ])]
      const candidates = [
        [a, { x: b.x, y: a.y }, b], [a, { x: a.x, y: b.y }, b],
        ...nearby(lanesX, (a.x + b.x) / 2).map(x => [a, { x, y: a.y }, { x, y: b.y }, b]),
        ...nearby(lanesY, (a.y + b.y) / 2).map(y => [a, { x: a.x, y }, { x: b.x, y }, b]),
      ]
      for (const middle of candidates) {
        const points = simplify([start.p, ...middle, end.p])
        let score = points.length * 20
        for (let i = 1; i < points.length; i++) {
          const p = points[i - 1]!, q = points[i]!
          score += Math.abs(p.x - q.x) + Math.abs(p.y - q.y)
          for (const box of boxes) {
            if ((i === 1 && box.id === from.id) || (i === points.length - 1 && box.id === to.id)) continue
            if (hits(p, q, box)) score += 100000
          }
          // Prefer separate lanes, without making crossings more costly than huge detours.
          for (const segment of used.slice(-80)) {
            if (p.x === q.x && segment.a.x === segment.b.x && p.x === segment.a.x && Math.max(Math.min(p.y, q.y), Math.min(segment.a.y, segment.b.y)) < Math.min(Math.max(p.y, q.y), Math.max(segment.a.y, segment.b.y))) score += 80
            if (p.y === q.y && segment.a.y === segment.b.y && p.y === segment.a.y && Math.max(Math.min(p.x, q.x), Math.min(segment.a.x, segment.b.x)) < Math.min(Math.max(p.x, q.x), Math.max(segment.a.x, segment.b.x))) score += 80
          }
        }
        if (score < bestScore) { best = points; bestScore = score }
      }
    }
    // Overlapping / boundary cards still retain a visible connection.
    if (!best.length) best = [{ x: from.x + from.width, y: from.y + from.height / 2 }, { x: to.x, y: from.y + from.height / 2 }, { x: to.x, y: to.y + to.height / 2 }]
    let longest = -1, labelX = 0, labelY = 0
    for (let i = 1; i < best.length; i++) {
      const a = best[i - 1]!, b = best[i]!
      used.push({ a, b })
      const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2 - 9
      const blocked = boxes.some(box => x > box.x - 60 && x < box.x + box.width + 60 && y > box.y - 12 && y < box.y + box.height + 12)
      if (!blocked && length > longest) { longest = length; labelX = x; labelY = y }
    }
    if (longest < 0) { labelX = (best[0]!.x + best.at(-1)!.x) / 2; labelY = Math.max(10, Math.min(...best.map(p => p.y)) - 10) }
    result.set(edge.id, { path: roundedPath(best), labelX, labelY, labelLines: [], points: best })
  }
  placeGuideLabels(boxes, ordered, result)
  return result
}

// Independent layout: selection never changes the routes or saved data.
function placeGuideLabels(boxes: readonly RouteBox[], edges: readonly Edge[], routes: Map<string, GuideRoute>) {
  const occupied: { x: number; y: number; width: number; height: number }[] = []
  const maxX = Math.max(1200, ...boxes.map(b => b.x + 280))
  const maxY = Math.max(700, ...boxes.map(b => b.y + 260))
  for (const edge of edges) {
    const route = routes.get(edge.id)
    if (!route) continue
    const lines: string[] = []
    for (const word of (edge.label || 'se relaciona con').split(/\s+/)) {
      const last = lines.at(-1)
      if (last && last.length + word.length < 33) lines[lines.length - 1] = `${last} ${word}`
      else lines.push(word)
    }
    const width = Math.max(...lines.map(line => line.length)) * 8 + 16
    const height = lines.length * 14 + 8
    let bestScore = Infinity, bestX = route.labelX, bestY = route.labelY
    let anchor: Point = route.points[0]!
    const consider = (x: number, y: number, point: Point, score: number) => {
      const rect = { x: x - width / 2, y: y - 11, width, height }
      if (rect.x < 4 || rect.y < 4 || rect.x + width > maxX - 4 || rect.y + height > maxY - 4) return
      const overlaps = (other: { x: number; y: number; width: number; height: number }) => rect.x < other.x + other.width + 7 && rect.x + width + 7 > other.x && rect.y < other.y + other.height + 7 && rect.y + height + 7 > other.y
      // Never trade an obscured label for a shorter displacement.
      if (boxes.some(overlaps) || occupied.some(overlaps)) return
      if (score < bestScore) { bestScore = score; bestX = x; bestY = y; anchor = point }
    }
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1]!, b = route.points[i]!
      const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
      if (length < 30) continue
      for (const fraction of [0.5, 0.3, 0.7]) for (const offset of [-12, 18, -30, 36, -48, 54]) {
        const x = a.x + (b.x - a.x) * fraction + (a.x === b.x ? offset + Math.sign(offset) * width / 2 : 0)
        const y = a.y + (b.y - a.y) * fraction + (a.y === b.y ? offset : 0)
        consider(x, y, { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction }, Math.abs(offset) + Math.abs(fraction - 0.5) * 30 + 100 / length)
      }
    }
    if (!Number.isFinite(bestScore)) {
      // A bounded search of nearby free space, including narrow horizontal gutters.
      for (let y = 18; y < maxY - height; y += 14) for (let x = width / 2 + 8; x < maxX - width / 2; x += 24) {
        let point = route.points[0]!, distance = Infinity
        for (let i = 1; i < route.points.length; i++) {
          const a = route.points[i - 1]!, b = route.points[i]!
          const p = { x: Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), x)), y: Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), y)) }
          const d = Math.hypot(x - p.x, y - p.y)
          if (d < distance) { point = p; distance = d }
        }
        consider(x, y, point, distance)
      }
    }
    if (!Number.isFinite(bestScore)) {
      // Extremely dense boards get a reserved label gutter below the cards.
      bestX = Math.min(maxX / 2, Math.max(width / 2 + 8, route.labelX))
      bestY = Math.max(maxY, ...occupied.map(r => r.y + r.height)) + 24
    }
    route.labelX = bestX; route.labelY = bestY; route.labelLines = lines
    if (Math.hypot(bestX - anchor.x, bestY - anchor.y) > 26) route.labelLeader = `M ${anchor.x} ${anchor.y} L ${bestX} ${bestY - 5}`
    occupied.push({ x: bestX - width / 2, y: bestY - 11, width, height })
  }
}

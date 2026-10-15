import type { BackdropGroup, BackdropLink, BackdropNote, BackdropState } from './chronicle-backdrop'

export interface LayerBox { id: string; x: number; y: number; width: number; height: number }
export interface LayerView extends LayerBox {
  group: BackdropGroup; depth: number; expanded: boolean; noteCount: number; layerCount: number
}
export interface LayerConnection { id: string; from: string; to: string; label: string; tentative: boolean; originals: BackdropLink[] }
export interface LayerProjection { layers: LayerView[]; notes: (BackdropNote & { displayWidth?: number; displayHeight?: number })[]; links: LayerConnection[]; boxes: LayerBox[] }
export function upgradeBackdrop(state: BackdropState): BackdropState {
  if (state.version !== 1 && state.version !== 2) throw new Error('Versión de pizarra no compatible. No se modificó nada.')
  const upgraded: BackdropState = { ...state, version: 2,
    groups: state.groups.map(g => ({ ...g, parentId: g.parentId ?? null, summary: g.summary ?? '', references: g.references ?? [] })) }
  assertLayerTree(upgraded)
  return upgraded
}
export function assertLayerTree(state: BackdropState): void {
  const groups = new Map(state.groups.map(g => [g.id, g]))
  if (groups.size !== state.groups.length || new Set(state.notes.map(n => n.id)).size !== state.notes.length || state.notes.some(n => groups.has(n.id))) throw new Error('Identificadores duplicados.')
  for (const g of state.groups) {
    const seen = new Set([g.id])
    let parent = g.parentId ?? null
    while (parent) {
      if (!groups.has(parent)) throw new Error('Capa superior no disponible.')
      if (seen.has(parent)) throw new Error('No se permite anidar una capa dentro de sí misma.')
      seen.add(parent); parent = groups.get(parent)!.parentId ?? null
    }
  }
  if (state.notes.some(n => n.groupId && !groups.has(n.groupId))) throw new Error('Una nota apunta a una capa no disponible.')
}
export function descendants(state: BackdropState, id: string): Set<string> {
  const result = new Set([id])
  for (let i = 0; i < state.groups.length; i++) for (const g of state.groups) if (g.parentId && result.has(g.parentId)) result.add(g.id)
  return result
}
export function reparentLayer(state: BackdropState, id: string, parentId: string | null): BackdropState {
  if (parentId && descendants(state, id).has(parentId)) throw new Error('Una capa no puede contener a su capa superior.')
  if (!state.groups.some(g => g.id === id) || parentId && !state.groups.some(g => g.id === parentId)) throw new Error('Capa no disponible.')
  const next = { ...state, version: 2 as const, groups: state.groups.map(g => g.id === id ? { ...g, parentId } : g) }
  assertLayerTree(next)
  return next
}
// Bounds are presentation only. Existing saved positions are never rewritten
// merely by loading, nesting, filtering or changing zoom.
export function layerBounds(state: BackdropState): Map<string, LayerBox> {
  assertLayerTree(state)
  const result = new Map<string, LayerBox>()
  function bounds(g: BackdropGroup): LayerBox {
    const cached = result.get(g.id); if (cached) return cached
    const contents = [
      ...state.notes.filter(n => n.groupId === g.id).map(n => ({ ...n, width: 260, height: 140 })),
      ...state.groups.filter(child => child.parentId === g.id).map(bounds),
    ]
    const x = Math.min(g.x, ...contents.map(n => n.x - 32))
    const y = Math.min(g.y, ...contents.map(n => n.y - 100))
    const right = Math.max(g.x + g.width, ...contents.map(n => n.x + n.width + 32))
    const bottom = Math.max(g.y + g.height, ...contents.map(n => n.y + n.height + 32))
    const box = { id: g.id, x, y, width: right - x, height: bottom - y }
    result.set(g.id, box); return box
  }
  state.groups.forEach(bounds)
  return result
}
export function wrapLayer(state: BackdropState, targetId: string, parentId: string, title = 'Nuevo contexto superior'): BackdropState {
  const target = state.groups.find(g => g.id === targetId)
  if (!target || state.groups.some(g => g.id === parentId) || state.notes.some(n => n.id === parentId)) throw new Error('Capa no válida.')
  const box = layerBounds(state).get(targetId)!
  const parent: BackdropGroup = { id: parentId, title, parentId: target.parentId ?? null, summary: '', references: [],
    x: Math.max(-20000, box.x - 36), y: Math.max(-20000, box.y - 76), width: Math.min(8000, box.width + 72), height: Math.min(8000, box.height + 108) }
  return { ...state, version: 2, groups: [...state.groups.map(g => g.id === targetId ? { ...g, parentId } : g), parent] }
}
export function ancestry(state: BackdropState, id: string | null): BackdropGroup[] {
  const path: BackdropGroup[] = [], seen = new Set<string>()
  while (id && !seen.has(id)) {
    seen.add(id)
    const g = state.groups.find(g => g.id === id); if (!g) break
    path.unshift(g); id = g.parentId ?? null
  }
  return path
}
export function projectLayers(state: BackdropState, scale: number, automatic = true, storyId = ''): LayerProjection {
  const bounds = layerBounds(state)
  const hasStory = (refs: BackdropGroup['references']) => refs?.some(r => (r.kind === 'story' || r.kind === 'card') && r.id === storyId)
  const allowedNotes = state.notes.filter(n => !storyId || hasStory(n.references) || ancestry(state, n.groupId).some(g => hasStory(g.references)))
  const allowed = new Set(allowedNotes.map(n => n.id))
  const visibleGroups = new Set<string>()
  if (!storyId) state.groups.forEach(g => visibleGroups.add(g.id))
  else {
    for (const n of allowedNotes) ancestry(state, n.groupId).forEach(g => visibleGroups.add(g.id))
    for (const g of state.groups) if (hasStory(g.references)) {
      descendants(state, g.id).forEach(id => visibleGroups.add(id))
      ancestry(state, g.id).forEach(parent => visibleGroups.add(parent.id))
    }
  }
  const layers: LayerView[] = [], notes: BackdropNote[] = []
  const representative = new Map<string, string>()
  function representClosed(id: string, representativeId: string) {
    const subtree = descendants(state, id)
    for (const groupId of subtree) representative.set(groupId, representativeId)
    state.notes.forEach(n => { if (n.groupId && subtree.has(n.groupId)) representative.set(n.id, representativeId) })
  }
  function visit(g: BackdropGroup, depth: number) {
    if (!visibleGroups.has(g.id)) return
    const box = bounds.get(g.id)!
    const expanded = !automatic || box.width * scale >= 360 && box.height * scale >= 210
    const subtree = descendants(state, g.id)
    layers.push({ ...box, group: g, depth, expanded, noteCount: allowedNotes.filter(n => n.groupId && subtree.has(n.groupId)).length, layerCount: subtree.size - 1 })
    representative.set(g.id, g.id)
    if (!expanded) { representClosed(g.id, g.id); return }
    for (const n of state.notes) if (n.groupId === g.id && allowed.has(n.id)) { notes.push(n); representative.set(n.id, n.id) }
    state.groups.filter(child => child.parentId === g.id).forEach(child => visit(child, depth + 1))
  }
  state.groups.filter(g => !g.parentId).forEach(g => visit(g, 0))
  allowedNotes.filter(n => !n.groupId).forEach(n => { notes.push(n); representative.set(n.id, n.id) })
  const grouped = new Map<string, LayerConnection>()
  for (const link of state.links) {
    // A story filter must not accidentally expose an unrelated hidden endpoint.
    const eligible = (id: string) => allowed.has(id) || visibleGroups.has(id)
    if (!eligible(link.from) || !eligible(link.to)) continue
    const from = representative.get(link.from), to = representative.get(link.to)
    if (!from || !to || from === to) continue
    const key = JSON.stringify([from, to])
    const existing = grouped.get(key)
    if (existing) { existing.originals.push(link); existing.label = existing.originals.length + ' relaciones'; existing.tentative = existing.tentative && link.tentative }
    else grouped.set(key, { ...link, id: 'view:' + key, from, to, originals: [link] })
  }
  // Expanded containers are not routing obstacles: their child nodes live inside.
  const boxes = [...layers.filter(g => !g.expanded).map(({ id, x, y, width, height }) => ({ id, x, y, width, height })),
    ...notes.map(n => ({ id: n.id, x: n.x, y: n.y, width: 260, height: 140 }))]
  // Expanded headers are obstacles too, so arrows do not cut across their title.
  // Explicit links to a layer terminate on that header instead of an invented note.
  for (const layer of layers.filter(g => g.expanded)) {
    const endpoint = [...grouped.values()].some(l => l.from === layer.id || l.to === layer.id)
    boxes.push({ id: endpoint ? layer.id : 'header:' + layer.id, x: layer.x, y: layer.y, width: layer.width, height: scale >= .7 ? 88 : Math.min(100, Math.max(48, 30 / Math.max(.03, scale))) })
  }
  return { layers, notes, links: [...grouped.values()], boxes }
}

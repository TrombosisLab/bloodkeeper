export interface BackdropReference { kind: 'story' | 'card' | 'library' | 'resource'; id: string; cardId?: string }
export interface BackdropNote {
  id: string; title: string; text: string; status: 'confirmed' | 'developing' | 'idea'
  time: 'past' | 'present' | 'future' | 'unspecified'; knownBy: string
  x: number; y: number; groupId: string | null; references: BackdropReference[]
}
export interface BackdropGroup { id: string; title: string; x: number; y: number; width: number; height: number; parentId?: string | null; summary?: string; references?: BackdropReference[] }
export interface BackdropLink { id: string; from: string; to: string; label: string; tentative: boolean }
export interface BackdropState { version: 1 | 2; notes: BackdropNote[]; groups: BackdropGroup[]; links: BackdropLink[] }
export interface BackdropSnapshot { revision: number; state: BackdropState }
export interface ReferenceOption extends BackdropReference { label: string; cardCount?: number; milestones?: { label: string; note: string | null; completed: boolean }[] }
export const emptyBackdrop = (): BackdropState => ({ version: 1, notes: [], groups: [], links: [] })
export function backdropId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')
}
export const referenceKey = (r: BackdropReference) => JSON.stringify([r.kind, r.id, r.cardId ?? null])
// JSONB and response validation may reorder object keys. Array order and every
// value still matter: only the irrelevant order of object properties is ignored.
export function backdropFingerprint(state: BackdropState): string {
  function ordered(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(ordered)
    if (value !== null && typeof value === 'object') {
      const record = value as Record<string, unknown>
      return Object.fromEntries(Object.keys(record).sort().map(key => [key, ordered(record[key])]))
    }
    return value
  }
  return JSON.stringify(ordered(state))
}
export const statusLabels = { confirmed: 'Confirmado', developing: 'En desarrollo', idea: 'Posibilidad / pendiente' }
export const timeLabels = { past: 'Pasado', present: 'En marcha', future: 'Posible futuro', unspecified: 'Sin fecha definida' }
export function removeBackdropNote(state: BackdropState, id: string): BackdropState {
  return { ...state, notes: state.notes.filter(n => n.id !== id), links: state.links.filter(l => l.from !== id && l.to !== id) }
}
export function removeBackdropGroup(state: BackdropState, id: string): BackdropState {
  const parentId = state.groups.find(g => g.id === id)?.parentId ?? null
  return { ...state, groups: state.groups.filter(g => g.id !== id).map(g => g.parentId === id ? { ...g, parentId } : g),
    notes: state.notes.map(n => n.groupId === id ? { ...n, groupId: parentId } : n), links: state.links.filter(l => l.from !== id && l.to !== id) }
}
export function moveBackdropGroup(state: BackdropState, id: string, dx: number, dy: number): BackdropState {
  const moved = new Set([id])
  for (let i = 0; i < state.groups.length; i++) for (const g of state.groups) if (g.parentId && moved.has(g.parentId)) moved.add(g.id)
  return { ...state, groups: state.groups.map(g => moved.has(g.id) ? { ...g, x: g.x + dx, y: g.y + dy } : g),
    notes: state.notes.map(n => n.groupId && moved.has(n.groupId) ? { ...n, x: n.x + dx, y: n.y + dy } : n) }
}

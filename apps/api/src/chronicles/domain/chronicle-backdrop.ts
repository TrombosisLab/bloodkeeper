export interface BackdropReference { kind: 'story' | 'card' | 'library' | 'resource'; id: string; cardId?: string }
export interface BackdropNote {
  id: string; title: string; text: string; status: 'confirmed' | 'developing' | 'idea'
  time: 'past' | 'present' | 'future' | 'unspecified'; knownBy: string
  x: number; y: number; groupId: string | null; references: BackdropReference[]
}
export interface BackdropGroup { id: string; title: string; x: number; y: number; width: number; height: number; parentId?: string | null; summary?: string; references?: BackdropReference[] }
export interface BackdropLink { id: string; from: string; to: string; label: string; tentative: boolean }
export interface BackdropState { version: 1 | 2; notes: BackdropNote[]; groups: BackdropGroup[]; links: BackdropLink[] }
export const emptyBackdrop = (): BackdropState => ({ version: 1, notes: [], groups: [], links: [] })
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Objeto no válido.')
  return v as Record<string, unknown>
}
const str = (v: unknown, max: number) => { if (typeof v !== 'string' || v.length > max) throw new Error('Texto no válido.'); return v }
const id = (v: unknown) => { const s = str(v, 36); if (!uuid.test(s)) throw new Error('Identificador no válido.'); return s }
const num = (v: unknown, min = -20000, max = 20000) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error('Posición no válida.'); return v }
const bool = (v: unknown) => { if (typeof v !== 'boolean') throw new Error('Valor no válido.'); return v }
const arr = (v: unknown, max: number): unknown[] => { if (!Array.isArray(v) || v.length > max) throw new Error('Demasiados elementos.'); return v }
const choice = <T extends string>(v: unknown, allowed: readonly T[]): T => { if (!allowed.includes(v as T)) throw new Error('Opción no válida.'); return v as T }
export function parseBackdrop(v: unknown): BackdropState {
  if (new TextEncoder().encode(JSON.stringify(v)).length > 80000) throw new Error('La pizarra supera 80 kB de texto. Reduce las notas extensas y vincula sus recursos.')
  const input = obj(v)
  if (input.version !== 1 && input.version !== 2) throw new Error('Versión no válida.')
  const references = (value: unknown): BackdropReference[] => {
    const refs = arr(value, 20).map(v => {
      const ref = obj(v)
      const kind = choice(ref.kind, ['story', 'card', 'library', 'resource'] as const)
      return { kind, id: id(ref.id), ...(kind === 'card' ? { cardId: str(ref.cardId, 120) } : {}) }
    })
    if (new Set(refs.map(r => JSON.stringify(r))).size !== refs.length) throw new Error('Referencias duplicadas.')
    return refs
  }
  const groups = arr(input.groups, 60).map(v => {
    const g = obj(v)
    if (input.version === 1 && (g.parentId != null || g.summary != null || g.references != null)) throw new Error('Las capas requieren la versión nueva de la aplicación.')
    return { id: id(g.id), title: str(g.title, 120), x: num(g.x), y: num(g.y), width: num(g.width, 320, 8000), height: num(g.height, 220, 8000),
      ...(input.version === 2 ? { parentId: g.parentId == null ? null : id(g.parentId), summary: str(g.summary ?? '', 4000), references: references(g.references ?? []) } : {}) }
  })
  const groupIds = new Set(groups.map(g => g.id))
  if (groupIds.size !== groups.length) throw new Error('Grupos duplicados.')
  const parents = new Map(groups.map(g => [g.id, g.parentId ?? null]))
  for (const g of groups) {
    const seen = new Set([g.id])
    let parent = g.parentId ?? null
    while (parent !== null) {
      if (!groupIds.has(parent)) throw new Error('Capa superior no disponible.')
      if (seen.has(parent)) throw new Error('Una capa no puede contenerse a sí misma, ni directa ni indirectamente.')
      seen.add(parent); parent = parents.get(parent) ?? null
    }
  }
  const notes = arr(input.notes, 200).map(v => {
    const n = obj(v)
    const groupId = n.groupId === null ? null : id(n.groupId)
    if (groupId && !groupIds.has(groupId)) throw new Error('Grupo no disponible.')
    const refs = references(n.references)
    return { id: id(n.id), title: str(n.title, 120), text: str(n.text, 8000), status: choice(n.status, ['confirmed', 'developing', 'idea'] as const),
      time: choice(n.time, ['past', 'present', 'future', 'unspecified'] as const), knownBy: str(n.knownBy, 1000),
      x: num(n.x), y: num(n.y), groupId, references: refs }
  })
  const noteIds = new Set(notes.map(n => n.id))
  if (noteIds.size !== notes.length) throw new Error('Notas duplicadas.')
  if (notes.some(n => groupIds.has(n.id))) throw new Error('Una nota y una capa no pueden tener el mismo identificador.')
  const endpoints = input.version === 2 ? new Set([...noteIds, ...groupIds]) : noteIds
  const links = arr(input.links, 400).map(v => {
    const l = obj(v), from = id(l.from), to = id(l.to)
    if (!endpoints.has(from) || !endpoints.has(to) || from === to) throw new Error('Conexión no válida.')
    return { id: id(l.id), from, to, label: str(l.label, 160), tentative: bool(l.tentative) }
  })
  if (new Set(links.map(l => l.id)).size !== links.length) throw new Error('Conexiones duplicadas.')
  return { version: input.version, notes, groups, links }
}

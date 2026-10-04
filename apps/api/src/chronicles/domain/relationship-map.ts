import { parseUpdateChronicleStoryRequest } from '../presentation/chronicle-story.dto'
import type { ChronicleStoryGuide, ChronicleStoryGuideCard, ChronicleStoryGuideConnection } from './chronicle-story.types'

export const RELATION_TYPES = ['family','sire','mentor','friendship','alliance','love','rivalry','enemy','authority','debt','blood','manipulation','suspicion','custom'] as const
export type RelationCard = ChronicleStoryGuideCard & { reference?: { type: 'CHARACTER' | 'NPC'; id: string }; sourceId?: string; personStatus?: 'active' | 'deceased' | 'missing' }
export type RelationEdge = ChronicleStoryGuideConnection & { relationType: typeof RELATION_TYPES[number]; direction: 'forward' | 'both' | 'none'; customColor?: string }
export type RelationMap = Omit<ChronicleStoryGuide, 'cards' | 'connections'> & { cards: RelationCard[]; connections: RelationEdge[] }
export const FIRST_RELATION_PAGE = '00000000-0000-4000-8000-000000000001'
export const emptyRelationMap = (): RelationMap => ({ pages: [{ id: FIRST_RELATION_PAGE, title: 'Inicio' }], cards: [], connections: [] })
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
function object(v: unknown): Record<string, any> { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Objeto inválido'); return v as Record<string, any> }
function keys(v: Record<string, any>, allowed: string[]) { if (Object.keys(v).some(k => !allowed.includes(k))) throw new Error('Campo no admitido') }
export function parseRelationMap(value: unknown, shared: boolean): RelationMap {
  const raw = object(value)
  keys(raw, ['pages','cards','connections'])
  if (!Array.isArray(raw.pages) || raw.pages.length === 0) throw new Error('El mapa necesita al menos una página')
  if (!Array.isArray(raw.cards) || !Array.isArray(raw.connections) || raw.cards.length > 120 || raw.connections.length > 240) throw new Error('Máximo 120 tarjetas y 240 relaciones')
  const cardExtras = raw.cards.map((v: unknown) => {
    const c = object(v)
    keys(c, ['id','pageId','appearances','kind','state','title','summary','narratorNote','x','y','reference','sourceId','personStatus'])
    if (c.personStatus !== undefined && !['active','deceased','missing'].includes(c.personStatus)) throw new Error('Estado de persona inválido')
    if (c.kind !== 'npc' || c.state !== 'hidden' || (shared && c.narratorNote !== '')) throw new Error('Tarjeta inválida')
    let reference: RelationCard['reference']
    if (c.reference !== undefined) {
      const ref = object(c.reference); keys(ref, ['type','id'])
      if (!['CHARACTER','NPC'].includes(ref.type) || !uuid(ref.id)) throw new Error('Referencia inválida')
      reference = { type: ref.type, id: ref.id }
    }
    if (c.sourceId !== undefined && (!shared || !uuid(c.sourceId))) throw new Error('Origen inválido')
    return { ...(reference ? { reference } : {}), ...(c.sourceId ? { sourceId: c.sourceId } : {}), ...(c.personStatus ? { personStatus: c.personStatus } : {}) }
  })
  const sources = cardExtras.flatMap(e => e.sourceId ? [e.sourceId] : [])
  if (new Set(sources).size !== sources.length) throw new Error('Tarjeta publicada duplicada')
  const edgeExtras = raw.connections.map((v: unknown) => {
    const e = object(v); keys(e, ['id','from','to','label','color','relationType','direction','customColor'])
    if (!RELATION_TYPES.includes(e.relationType) || !['forward','both','none'].includes(e.direction)) throw new Error('Relación inválida')
    if (e.relationType === 'custom' && (typeof e.label !== 'string' || !e.label.trim())) throw new Error('Escribe el tipo personalizado')
    if (e.customColor !== undefined && (e.relationType !== 'custom' || typeof e.customColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(e.customColor))) throw new Error('Color inválido')
    return { relationType: e.relationType, direction: e.direction, ...(e.customColor ? { customColor: e.customColor.toLowerCase() } : {}) }
  })
  // Reuse the established graph validator: bounds, unique IDs, pages and acyclic continuations.
  const guide = parseUpdateChronicleStoryRequest(FIRST_RELATION_PAGE, FIRST_RELATION_PAGE, { expectedRevision: 1, narratorGuide: {
    pages: raw.pages,
    cards: raw.cards.map(({ reference, sourceId, personStatus, ...card }: any) => card),
    connections: raw.connections.map(({ relationType, direction, customColor, ...edge }: any) => edge),
  } }).narratorGuide!
  return { ...guide, cards: guide.cards.map((c, i) => ({ ...c, ...cardExtras[i] })), connections: guide.connections.map((e, i) => ({ ...e, ...edgeExtras[i] })) }
}
export function publishRelationCard(privateMap: RelationMap, sharedMap: RelationMap, cardId: string, publicId: string): RelationMap {
  const source = privateMap.cards.find(c => c.id === cardId)
  if (!source) throw new Error('La tarjeta privada no existe')
  if (sharedMap.cards.some(c => c.sourceId === cardId)) return sharedMap
  if (sharedMap.cards.length >= 120) throw new Error('El mapa compartido admite 120 tarjetas')
  const index = sharedMap.cards.length
  const card: RelationCard = { id: publicId, sourceId: source.id, pageId: sharedMap.pages![0]!.id, kind: 'npc', state: 'hidden', title: source.title,
    summary: '', narratorNote: '', x: 32 + index % 3 * 318, y: Math.min(5000, 32 + Math.floor(index / 3) * 240), ...(source.reference ? { reference: { ...source.reference } } : {}) }
  return { ...sharedMap, cards: [...sharedMap.cards, card] }
}
export function removeRelationCard(map: RelationMap, id: string): RelationMap {
  return { ...map, cards: map.cards.filter(c => c.id !== id), connections: map.connections.filter(e => e.from !== id && e.to !== id) }
}

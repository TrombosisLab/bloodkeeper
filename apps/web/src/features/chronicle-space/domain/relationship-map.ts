import type { ChronicleStoryGuide, ChronicleStoryGuideCard, ChronicleStoryGuideConnection } from '../../chronicles/types/chronicle-story-api.types'
export const relationTypes = [
  { id: 'family', label: 'Familia / parentesco', color: '#b99b68' },
  { id: 'sire', label: 'Sire / chiquillo', color: '#d3b173' },
  { id: 'mentor', label: 'Mentor / protegido', color: '#e4b351' },
  { id: 'friendship', label: 'Amistad / confianza', color: '#92bf9d' },
  { id: 'alliance', label: 'Alianza / cooperación', color: '#65bcb4' },
  { id: 'love', label: 'Amor / atracción', color: '#e88dac' },
  { id: 'rivalry', label: 'Rivalidad', color: '#e8a05e' },
  { id: 'enemy', label: 'Enemistad / amenaza', color: '#e56767' },
  { id: 'authority', label: 'Autoridad / subordinación', color: '#91b0ce' },
  { id: 'debt', label: 'Deuda / favor', color: '#bb93db' },
  { id: 'blood', label: 'Vínculo de sangre', color: '#ce4f75' },
  { id: 'manipulation', label: 'Manipulación / dependencia', color: '#af84ad' },
  { id: 'suspicion', label: 'Sospecha / desconfianza', color: '#9babb8' },
  { id: 'custom', label: 'Personalizada', color: '#c7bab1' },
] as const
export type RelationType = typeof relationTypes[number]['id']
export type RelationReference = { type: 'CHARACTER' | 'NPC'; id: string }
export type RelationCard = ChronicleStoryGuideCard & { reference?: RelationReference; sourceId?: string; personStatus?: 'active' | 'deceased' | 'missing' }
export type RelationEdge = ChronicleStoryGuideConnection & { relationType: RelationType; direction: 'forward' | 'both' | 'none'; customColor?: string }
export type RelationMap = Omit<ChronicleStoryGuide, 'cards' | 'connections'> & { cards: readonly RelationCard[]; connections: readonly RelationEdge[] }
export type RelationSnapshot = { ownerId: string; revision: number; privateMap: RelationMap; sharedMap: RelationMap }
export const relationColor = (edge: RelationEdge) => edge.relationType === 'custom' ? edge.customColor || '#c7bab1' : relationTypes.find(t => t.id === edge.relationType)!.color
export const relationLabel = (edge: RelationEdge) => edge.label || relationTypes.find(t => t.id === edge.relationType)!.label
export function relationId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6]! & 15) | 64; bytes[8] = (bytes[8]! & 63) | 128
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}
export const removeRelationCard = (map: RelationMap, id: string): RelationMap => ({ ...map, cards: map.cards.filter(c => c.id !== id), connections: map.connections.filter(e => e.from !== id && e.to !== id) })

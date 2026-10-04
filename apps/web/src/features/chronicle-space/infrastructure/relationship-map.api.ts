import type { RelationMap, RelationSnapshot } from '../domain/relationship-map'
async function request<T>(chronicleId: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/chronicles/${encodeURIComponent(chronicleId)}/relationships/${path}`, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json' } })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'No se pudo cargar o guardar el mapa.')
  return body as T
}
export const relationshipMapApi = {
  me: (id: string) => request<RelationSnapshot>(id, 'me'),
  list: (id: string) => request<readonly { ownerId: string; name: string }[]>(id, 'shared'),
  shared: (id: string, owner: string) => request<{ ownerId: string; revision: number; map: RelationMap }>(id, `shared/${encodeURIComponent(owner)}`),
  save: (id: string, scope: 'private' | 'shared', revision: number, map: RelationMap) => request<RelationSnapshot>(id, `me/${scope}`, { method: 'PATCH', body: JSON.stringify({ revision, map }) }),
  publication: (id: string, revision: number, cardId: string, visible: boolean) => request<RelationSnapshot>(id, 'me/publication', { method: 'POST', body: JSON.stringify({ revision, cardId, visible }) }),
}

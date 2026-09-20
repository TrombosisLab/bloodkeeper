export type ChronicleMapResource = { readonly id: string; readonly kind: string; readonly name: string; readonly summary: string | null; readonly imageUrl: string | null }
export type ChronicleMapMarkerSize = 'small' | 'medium' | 'large'
export type ChronicleMapMarker = { readonly id: string; readonly mapId: string; readonly resourceId: string | null; readonly locationId: string | null; readonly kind: string; readonly label: string | null; readonly x: number; readonly y: number; readonly size: ChronicleMapMarkerSize; readonly visibility: string; readonly resource: ChronicleMapResource | null; readonly location: { readonly id: string; readonly name: string; readonly category: string | null } | null }
export type ChronicleMapAreaLabelSize = 'small' | 'medium' | 'large'
export type ChronicleMapAreaLabelVertical = 'top' | 'center' | 'bottom'
export type ChronicleMapAreaLabelHorizontal = 'left' | 'center' | 'right'
export type ChronicleMapArea = { readonly id: string; readonly name: string; readonly geometry: unknown; readonly color: string | null; readonly fillColor: string | null; readonly labelColor: string | null; readonly labelSize: ChronicleMapAreaLabelSize; readonly labelVertical: ChronicleMapAreaLabelVertical; readonly labelHorizontal: ChronicleMapAreaLabelHorizontal; readonly visibility: string }
export type ChronicleMapSnapshot = { readonly id: string; readonly chronicleId: string; readonly parentMapId: string | null; readonly linkedLocationId: string | null; readonly linkedResourceId: string | null; readonly name: string; readonly description: string | null; readonly status: 'active' | 'archived'; readonly sortOrder: number; readonly imageUrl: string; readonly hasImage: boolean; readonly markers: readonly ChronicleMapMarker[]; readonly areas: readonly ChronicleMapArea[] }
export type ChronicleMapRequest = { readonly id: string; readonly mapId: string; readonly title: string; readonly description: string | null; readonly kind: string; readonly x: number; readonly y: number; readonly status: 'pending' | 'approved' | 'rejected'; readonly reviewNote: string | null; readonly requester?: { readonly displayName: string; readonly username: string }; readonly resource?: ChronicleMapResource | null; readonly createdAt: string }
export type ChronicleMapWorkspace = { readonly chronicleId: string; readonly canManage: boolean; readonly maps: readonly ChronicleMapSnapshot[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api' + path, { credentials: 'include', ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'No se pudo completar la operación del mapa.')
  return body as T
}

export const chronicleMapApi = {
  list: (chronicleId: string) => request<ChronicleMapWorkspace>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps'),
  create: (chronicleId: string, input: { readonly name: string; readonly description?: string | null; readonly parentMapId?: string | null }) => request<ChronicleMapSnapshot>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps', { method: 'POST', body: JSON.stringify(input) }),
  update: (chronicleId: string, mapId: string, input: Record<string, unknown>) => request<ChronicleMapSnapshot>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId), { method: 'PATCH', body: JSON.stringify(input) }),
  delete: (chronicleId: string, mapId: string) => request<{ readonly deleted: boolean }>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId), { method: 'DELETE' }),
  archive: (chronicleId: string, mapId: string) => request<{ readonly archived: boolean }>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/archive', { method: 'POST' }),
  uploadImage: (chronicleId: string, mapId: string, file: File) => fetch('/api/chronicles/' + encodeURIComponent(chronicleId) + '/assets/MAP/' + encodeURIComponent(mapId) + '/image', { method: 'PUT', credentials: 'include', headers: { 'content-type': file.type }, body: file }).then(async response => { if (!response.ok) throw new Error('No se pudo subir el mapa.'); return response.json() }),
  createMarker: (chronicleId: string, mapId: string, input: Record<string, unknown>) => request<ChronicleMapMarker>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/markers', { method: 'POST', body: JSON.stringify(input) }),
  updateMarker: (chronicleId: string, mapId: string, markerId: string, input: Record<string, unknown>) => request<ChronicleMapMarker>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/markers/' + encodeURIComponent(markerId), { method: 'PATCH', body: JSON.stringify(input) }),
  deleteMarker: (chronicleId: string, mapId: string, markerId: string) => request<{ readonly deleted: boolean }>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/markers/' + encodeURIComponent(markerId), { method: 'DELETE' }),
  createArea: (chronicleId: string, mapId: string, input: Record<string, unknown>) => request<ChronicleMapArea>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/areas', { method: 'POST', body: JSON.stringify(input) }),
  updateArea: (chronicleId: string, mapId: string, areaId: string, input: Record<string, unknown>) => request<ChronicleMapArea>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/areas/' + encodeURIComponent(areaId), { method: 'PATCH', body: JSON.stringify(input) }),
  deleteArea: (chronicleId: string, mapId: string, areaId: string) => request<{ readonly deleted: boolean }>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/areas/' + encodeURIComponent(areaId), { method: 'DELETE' }),
  requestMarker: (chronicleId: string, mapId: string, input: Record<string, unknown>) => request<ChronicleMapRequest>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/requests', { method: 'POST', body: JSON.stringify(input) }),
  listRequests: (chronicleId: string, mapId: string) => request<{ readonly items: readonly ChronicleMapRequest[] }>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/requests'),
  reviewRequest: (chronicleId: string, mapId: string, requestId: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) => request<{ readonly id: string; readonly status: string; readonly reviewNote: string | null }>('/chronicles/' + encodeURIComponent(chronicleId) + '/maps/' + encodeURIComponent(mapId) + '/requests/' + encodeURIComponent(requestId), { method: 'PATCH', body: JSON.stringify({ status, reviewNote: reviewNote || null }) }),
}

import type { RelationMap } from '../../chronicle-space/domain/relationship-map.ts'
import type { SharedRelationshipExport } from '../domain/chronicle-relationship-export.ts'

export interface RelationshipExportResult { readonly owners: readonly { ownerId: string; name: string }[]; readonly maps: readonly SharedRelationshipExport[] }
export async function loadRelationshipExport(chronicleId: string, selected: string, signal: AbortSignal): Promise<RelationshipExportResult> {
  const base = '/api/chronicles/' + encodeURIComponent(chronicleId) + '/relationships/shared'
  let received = 0
  async function get(path: string): Promise<unknown> {
    signal.throwIfAborted()
    const response = await fetch(path, { credentials: 'include', signal, cache: 'no-store', redirect: 'error', headers: { Accept: 'application/json' } })
    if (!response.ok || !response.body) throw new Error('No se pudo consultar un mapa compartido. No se genera una exportación parcial.')
    const reader = response.body.getReader(), chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) break
        received += part.value.byteLength; size += part.value.byteLength
        if (received > 8 * 1024 * 1024) throw new Error('Los mapas superan 8 MiB. No se trunca la exportación.')
        chunks.push(part.value)
      }
    } catch (error) { await reader.cancel().catch(() => undefined); throw error }
    finally { reader.releaseLock() }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    return JSON.parse(new TextDecoder().decode(bytes))
  }
  const raw = await get(base)
  if (!Array.isArray(raw) || raw.length > 40 || raw.some(o => !o || typeof o.ownerId !== 'string' || !/^[0-9a-f-]{36}$/i.test(o.ownerId) || typeof o.name !== 'string') || new Set(raw.map(o => o.ownerId)).size !== raw.length) throw new Error('La lista de mapas compartidos no es válida.')
  const owners = raw as { ownerId: string; name: string }[]
  const targets = selected === 'all' ? owners : owners.filter(o => o.ownerId === selected)
  if (selected !== 'all' && !targets.length) throw new Error('El mapa seleccionado ya no está compartido. Vuelve a elegir.')
  const maps: SharedRelationshipExport[] = []
  for (const owner of targets) {
    const response = await get(base + '/' + encodeURIComponent(owner.ownerId)) as { ownerId?: string; map?: RelationMap }
    const map = response?.map
    if (response?.ownerId !== owner.ownerId || !map || !Array.isArray(map.cards) || !Array.isArray(map.connections) || map.cards.length > 400 || map.connections.length > 1000 || map.cards.some(c => !c || typeof c.id !== 'string' || typeof c.title !== 'string' || typeof c.summary !== 'string') || map.connections.some(c => !c || typeof c.from !== 'string' || typeof c.to !== 'string' || typeof c.label !== 'string' || !['forward', 'both', 'none'].includes(c.direction))) throw new Error('Un mapa compartido no es válido. No se genera un archivo parcial.')
    maps.push({ ownerId: owner.ownerId, owner: owner.name, map })
  }
  return { owners, maps }
}

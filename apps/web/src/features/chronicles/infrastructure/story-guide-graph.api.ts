import type { ChronicleApiSnapshot } from '../types/chronicle-api.types'
import type { ChronicleStoryApiSnapshot } from '../types/chronicle-story-api.types'

export async function loadStoryGraph(chronicleId: string, viewerId: string, signal: AbortSignal, fetcher: typeof fetch = fetch) {
  const base = '/api/chronicles/' + encodeURIComponent(chronicleId)
  let received = 0
  async function get<T>(path: string): Promise<T> {
    const response = await fetcher(base + path, { method: 'GET', credentials: 'include', cache: 'no-store', signal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Solo el narrador autorizado de esta crónica puede consultar este mapa.' : 'No se pudo consultar el guion. No se muestra un mapa parcial.')
    if (!response.body) throw new Error('Respuesta vacía.')
    const reader = response.body.getReader(), chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) break
        received += part.value.byteLength; size += part.value.byteLength
        if (received > 8 * 1024 * 1024) throw new Error('Los guiones superan 8 MiB; no se muestra un mapa incompleto.')
        chunks.push(part.value)
      }
    } catch (error) { await reader.cancel().catch(() => undefined); throw error }
    finally { reader.releaseLock() }
    const bytes = new Uint8Array(size); let at = 0
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length }
    signal.throwIfAborted()
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  }
  const chronicle = await get<ChronicleApiSnapshot>('')
  if (chronicle.id !== chronicleId || chronicle.narratorId !== viewerId) throw new Error('Solo el narrador de esta crónica puede consultar su guion privado.')
  const notebook = await get<{ canManage: boolean; viewerUserId: string }>('/notebook')
  if (!notebook.canManage || notebook.viewerUserId !== viewerId) throw new Error('No tienes permiso activo de narrador en esta crónica.')
  const stories: ChronicleStoryApiSnapshot[] = []
  const seen = new Set<string>()
  let offset: number | null = 0
  while (offset !== null) {
    // Existing endpoint independently checks contextual narrator authorization.
    const page: { items: ChronicleStoryApiSnapshot[]; nextOffset: number | null } = await get('/stories?limit=50&offset=' + offset)
    if (!Array.isArray(page.items) || !(page.nextOffset === null || Number.isInteger(page.nextOffset) && page.nextOffset > offset)) throw new Error('Paginación inválida; mapa cancelado.')
    for (const story of page.items) {
      if (story.chronicleId !== chronicleId || seen.has(story.id)) throw new Error('Respuesta de guion inválida; mapa cancelado.')
      if (story.narratorGuide && (!Array.isArray(story.narratorGuide.cards) || !Array.isArray(story.narratorGuide.connections))) throw new Error('Guion inválido.')
      seen.add(story.id); stories.push(story)
    }
    if (stories.length > 200 || stories.length === 200 && page.nextOffset !== null) throw new Error('Más de 200 historias; no se trunca el mapa.')
    offset = page.nextOffset
  }
  signal.throwIfAborted()
  return { chronicle, stories }
}

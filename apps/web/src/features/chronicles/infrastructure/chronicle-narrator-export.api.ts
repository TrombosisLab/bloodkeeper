import type { ChronicleApiSnapshot } from '../types/chronicle-api.types.ts'
import type { ChronicleStoryApiSnapshot } from '../types/chronicle-story-api.types.ts'
import type { NotebookPage } from '../../notebook/types/notebook.types.ts'
import type { NarratorExportSources } from '../domain/chronicle-narrator-export.ts'
import { loadChronicleExport } from './chronicle-context-export.api.ts'
import { readGuideResource } from './story-guide-resources.api.ts'
import type { GuideResource } from './story-guide-resources.api.ts'

export async function loadNarratorExport(chronicle: ChronicleApiSnapshot, signal: AbortSignal): Promise<NarratorExportSources> {
  const base = '/api/chronicles/' + encodeURIComponent(chronicle.id)
  let received = 0
  async function get<T>(path: string): Promise<T> {
    signal.throwIfAborted()
    const response = await fetch(base + path, { credentials: 'include', signal, cache: 'no-store', headers: { Accept: 'application/json' } })
    if (!response.ok || !response.body) throw new Error('No se pudo autorizar o consultar el contexto privado; no se genera un documento parcial.')
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) break
        received += part.value.byteLength
        size += part.value.byteLength
        if (received > 8 * 1024 * 1024) throw new Error('El contexto privado supera el límite de lectura de 8 MiB.')
        chunks.push(part.value)
      }
    } catch (error) { await reader.cancel().catch(() => undefined); throw error }
    finally { reader.releaseLock() }
    const bytes = new Uint8Array(size)
    let at = 0
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length }
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  }
  const notebook = await get<NotebookPage>('/notebook')
  if (!notebook.canManage || notebook.viewerUserId !== chronicle.narratorId) throw new Error('Solo el narrador de esta crónica puede exportar secretos.')
  const stories: ChronicleStoryApiSnapshot[] = []
  let offset: number | null = 0
  while (offset !== null) {
    // This existing server endpoint enforces narrator authorization, independently of UI.
    const page: { items: ChronicleStoryApiSnapshot[]; nextOffset: number | null } = await get(`/stories?limit=50&offset=${offset}`)
    if (!Array.isArray(page.items) || !(page.nextOffset === null || Number.isInteger(page.nextOffset) && page.nextOffset > offset)) throw new Error('Paginación privada inválida.')
    if (page.items.some(story => story.chronicleId !== chronicle.id)) throw new Error('Respuesta de otra crónica; exportación cancelada.')
    stories.push(...page.items)
    if (stories.length > 200 || stories.length === 200 && page.nextOffset !== null) throw new Error('El límite es 200 historias; no se trunca el documento.')
    offset = page.nextOffset
  }
  const shared = await loadChronicleExport(chronicle, signal)
  const resourceIds = [...new Set(stories.flatMap(story => story.narratorGuide?.cards.flatMap(card => card.resourceIds ?? []) ?? []))]
  if (resourceIds.length > 200) throw new Error('La exportación supera 200 recursos relacionados; no se genera un documento parcial.')
  const resources: GuideResource[] = []
  let resourceBytes = 0
  for (const id of resourceIds) {
    const resource = await readGuideResource<GuideResource>(chronicle.id, '/' + encodeURIComponent(id), signal)
    if (resource) {
      resourceBytes += new TextEncoder().encode(JSON.stringify(resource)).length
      if (resourceBytes > 8 * 1024 * 1024) throw new Error('Las fichas relacionadas superan 8 MiB.')
      if (resource.id !== id) throw new Error('Referencia de recurso inválida.')
      resources.push(resource)
    }
  }
  signal.throwIfAborted()
  return { shared, stories, resources, notes: notebook.items.filter(note => note.author.id === notebook.viewerUserId && note.visibility === 'PRIVATE'), narratorId: chronicle.narratorId, viewerUserId: notebook.viewerUserId }
}

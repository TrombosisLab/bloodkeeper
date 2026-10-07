import type { ChronicleApiSnapshot, ChronicleSessionApiSnapshot } from '../types/chronicle-api.types.ts'
import type { ChronicleSharedStoryApiSnapshot } from '../types/chronicle-story-api.types.ts'
import type { NotebookContext, NotebookNote, NotebookPage } from '../../notebook/types/notebook.types.ts'
import type { ChronicleSessionParticipantNotesSnapshot } from './chronicle-session-participant-notes.api.ts'
import type { ChronicleSpaceBoardSnapshot } from '../../chronicle-space/infrastructure/chronicle-space-board.api.ts'
import type { RelationMap } from '../../chronicle-space/domain/relationship-map.ts'
import type { ChronicleExportSources } from '../domain/chronicle-context-export.ts'

const MAX_INPUT_BYTES = 8 * 1024 * 1024
export async function loadChronicleExport(chronicle: Pick<ChronicleApiSnapshot, 'id' | 'name' | 'description'>, signal: AbortSignal): Promise<ChronicleExportSources> {
  let received = 0
  const base = '/api/chronicles/' + encodeURIComponent(chronicle.id)
  async function get<T>(path: string): Promise<T> {
    signal.throwIfAborted()
    const response = await fetch(base + path, { credentials: 'include', signal, cache: 'no-store', headers: { Accept: 'application/json' } })
    if (!response.ok || !response.body) throw new Error('No se pudo consultar una fuente. No se generará un documento incompleto; revisa permisos y vuelve a intentarlo.')
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) break
        size += part.value.byteLength
        received += part.value.byteLength
        if (received > MAX_INPUT_BYTES) throw new Error('El contexto supera el límite de lectura de 8 MiB. No se exportan datos parciales.')
        chunks.push(part.value)
      }
    } catch (error) { await reader.cancel().catch(() => undefined); throw error }
    finally { reader.releaseLock() }
    const bytes = new Uint8Array(size)
    let at = 0
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length }
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  }
  async function pages<T>(path: string): Promise<T[]> {
    const items: T[] = []
    let offset: number | null = 0
    while (offset !== null) {
      const page: { items: T[]; nextOffset: number | null } = await get(`${path}?limit=50&offset=${offset}`)
      if (!Array.isArray(page.items) || !(page.nextOffset === null || (Number.isInteger(page.nextOffset) && page.nextOffset > offset))) throw new Error('Paginación inválida; se cancela la exportación.')
      items.push(...page.items)
      if (items.length > 200 || (items.length === 200 && page.nextOffset !== null)) throw new Error('Esta prueba admite hasta 200 sesiones y 200 historias; no se trunca el contexto.')
      offset = page.nextOffset
    }
    return items
  }
  // Reads are sequential, abortable and bounded: never parallel fan-out or
  // private-map/dossier queries. Session sharedNotes is the authoritative source.
  const sessions = await pages<ChronicleSessionApiSnapshot>('/sessions')
  const stories = await pages<ChronicleSharedStoryApiSnapshot>('/stories/shared')
  const notebook = await get<NotebookPage>('/notebook')
  const sessionNotes: NotebookNote[] = []
  const coveredSessions = new Set<string>()
  for (const session of sessions.filter(session => session.status === 'completed' || session.status === 'archived')) {
    const published = await get<ChronicleSessionParticipantNotesSnapshot>('/sessions/' + encodeURIComponent(session.id) + '/participant-notes')
    if (!Array.isArray(published.sharedNotes)) throw new Error('Respuesta de notas de sesión inválida; no se exportarán datos parciales.')
    coveredSessions.add(session.id)
    for (const shared of published.sharedNotes) {
      const mirror = notebook.items.find(note => note.sessionId === session.id && note.author.id === shared.authorUserId && note.tags.includes('SESSION_PARTICIPANT_SHARED'))
      sessionNotes.push({ id: mirror?.id ?? `participant-session:${session.id}:${shared.authorUserId}`, sessionId: session.id,
        title: 'Notas publicadas de sesión', content: shared.content, visibility: 'CHRONICLE', updatedAt: shared.updatedAt,
        author: { id: shared.authorUserId, displayName: shared.authorName, username: '' },
        tags: [], references: [], audienceUserIds: [], session: null, canEdit: false, pinned: false,
        contextLocationId: null, contextImageTargetType: null, contextImageTargetId: null })
    }
  }
  const notes = [...notebook.items.filter(note => !(note.sessionId && coveredSessions.has(note.sessionId) && note.tags.includes('SESSION_PARTICIPANT_SHARED'))), ...sessionNotes]
  const context = await get<NotebookContext>('/notebook/context')
  const board = await get<ChronicleSpaceBoardSnapshot>('/space-board')
  const owners = await get<readonly { ownerId: string; name: string }[]>('/relationships/shared')
  if (owners.length > 40) throw new Error('Esta prueba admite hasta 40 mapas compartidos por crónica.')
  const maps: { owner: string; map: RelationMap }[] = []
  for (const owner of owners) {
    const shared = await get<{ map: RelationMap }>('/relationships/shared/' + encodeURIComponent(owner.ownerId))
    maps.push({ owner: owner.name, map: shared.map })
  }
  return { chronicle, sessions, stories, notes, context, board, maps }
}

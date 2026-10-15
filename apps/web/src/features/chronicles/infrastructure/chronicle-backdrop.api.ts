import type { BackdropSnapshot, BackdropState, ReferenceOption } from '../domain/chronicle-backdrop'
export class BackdropApiError extends Error { constructor(readonly status: number, message: string) { super(message) } }
export async function backdropRequest<T>(chronicleId: string, path: string, signal: AbortSignal, save?: { state: BackdropState; expectedRevision: number }): Promise<T> {
  const response = await fetch('/api/chronicles/' + encodeURIComponent(chronicleId) + '/backdrop' + path, {
    method: save ? 'PUT' : 'GET', credentials: 'include', cache: 'no-store', signal,
    ...(save ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...save, protocolVersion: 2 }) } : {}),
  })
  if (!response.ok) throw new BackdropApiError(response.status, response.status === 409
    ? 'Otra pestaña ha guardado cambios. Tu borrador sigue aquí: descárgalo antes de recargar.'
    : response.status === 401 || response.status === 403 ? 'Solo el narrador activo de esta crónica puede acceder a la pizarra.'
    : 'No se pudo completar la operación. Si has vinculado un elemento eliminado, retira esa referencia y vuelve a guardar.')
  if (!response.body) throw new Error('Respuesta vacía.')
  const reader = response.body.getReader(), chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      length += part.value.length
      if (length > 4 * 1024 * 1024) throw new Error('Respuesta demasiado grande.')
      chunks.push(part.value)
    }
  } catch (e) { await reader.cancel().catch(() => undefined); throw e }
  finally { reader.releaseLock() }
  signal.throwIfAborted()
  const data = new Uint8Array(length); let offset = 0
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length }
  return JSON.parse(new TextDecoder().decode(data)) as T
}
export const loadBackdrop = (id: string, signal: AbortSignal) => backdropRequest<BackdropSnapshot>(id, '', signal)
export const saveBackdrop = (id: string, state: BackdropState, expectedRevision: number, signal: AbortSignal) => backdropRequest<BackdropSnapshot>(id, '', signal, { state, expectedRevision })
export const loadBackdropReferences = (id: string, signal: AbortSignal) => backdropRequest<{ items: ReferenceOption[] }>(id, '/references', signal)

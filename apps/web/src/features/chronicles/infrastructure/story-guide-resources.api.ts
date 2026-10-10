export interface GuideResource {
  readonly id: string
  readonly name: string
  readonly kind: string
  readonly summary: string | null
  readonly narratorNotes: string | null
  readonly status: string
  readonly inChronicle: boolean
}
export async function readGuideResource<T>(chronicleId: string, path: string, signal: AbortSignal): Promise<T | null> {
  const response = await fetch('/api/chronicles/' + encodeURIComponent(chronicleId) + '/guide-resources' + path, { credentials: 'include', signal, cache: 'no-store' })
  if (response.status === 404 && path.startsWith('/')) return null
  if (!response.ok || !response.body) throw new Error('No se pudieron consultar los recursos autorizados.')
  const reader = response.body.getReader(), chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 2 * 1024 * 1024) throw new Error('La respuesta de recursos supera 2 MiB.'); chunks.push(part.value) }
  } catch (error) { await reader.cancel().catch(() => undefined); throw error } finally { reader.releaseLock() }
  const data = new Uint8Array(size); let at = 0
  for (const chunk of chunks) { data.set(chunk, at); at += chunk.length }
  return JSON.parse(new TextDecoder().decode(data)) as T
}

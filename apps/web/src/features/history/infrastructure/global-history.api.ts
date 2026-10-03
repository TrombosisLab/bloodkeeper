import type {
  GlobalHistoryEntry,
  GlobalHistoryEntryInput,
  GlobalHistoryList,
  ChronicleArchive,
  GlobalHistoryChronicle,
  HistoryReference,
} from '../types/global-history.types'

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `/api${path}`,
    {
      credentials: 'include',
      ...options,
      headers: {
        'content-type':
          'application/json',
        ...(options?.headers ?? {}),
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      await response.text(),
    )
  }

  return response.json() as Promise<T>
}

export const globalHistoryGateway = {
  chronicles(): Promise<{ items: GlobalHistoryChronicle[] }> {
    return request('/history/chronicles')
  },
  chronicleArchive(chronicleId: string): Promise<ChronicleArchive> {
    return request(`/history/chronicles/${encodeURIComponent(chronicleId)}`)
  },
  catalog(): Promise<{ items: HistoryReference[] }> { return request('/history/reference-catalog') },
  reference(id: string, key: string): Promise<{label: string; category: string; description: string}> {
    return request(`/history/${encodeURIComponent(id)}/reference?key=${encodeURIComponent(key)}`)
  },
  imageUrl(id: string, version: string | null): string { return `/api/history/${encodeURIComponent(id)}/image?v=${encodeURIComponent(version ?? '')}` },
  async uploadImage(id: string, file: File): Promise<void> {
    const response = await fetch(`/api/history/${encodeURIComponent(id)}/image`, { method: 'PUT', credentials: 'include', headers: { 'content-type': file.type }, body: file })
    if (!response.ok) throw new Error('No se pudo subir la imagen.')
  },
  removeImage(id: string): Promise<unknown> { return request(`/history/${encodeURIComponent(id)}/image`, { method: 'DELETE' }) },
  list(): Promise<GlobalHistoryList> {
    return request('/history')
  },

  create(
    input: GlobalHistoryEntryInput,
  ): Promise<GlobalHistoryEntry> {
    return request('/history', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  update(
    entryId: string,
    input: GlobalHistoryEntryInput,
  ): Promise<GlobalHistoryEntry> {
    return request(
      `/history/${encodeURIComponent(entryId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    )
  },

  archive(entryId: string): Promise<void> {
    return request(
      `/history/${encodeURIComponent(entryId)}/archive`,
      { method: 'POST' },
    ).then(() => undefined)
  },
}

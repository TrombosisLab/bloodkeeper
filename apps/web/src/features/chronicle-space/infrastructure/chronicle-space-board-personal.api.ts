export type ChronicleSpaceBoardPersonalSnapshot = { readonly chronicleId: string; readonly userId: string; readonly state: Readonly<Record<string, unknown>>; readonly revision: number; readonly updatedAt: string | null }

async function request<T>(chronicleId: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/chronicles/' + encodeURIComponent(chronicleId) + '/space-board/personal', { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'No se pudo guardar la vista personal.')
  return body as T
}

export const chronicleSpaceBoardPersonalApi = {
  get: (chronicleId: string) => request<ChronicleSpaceBoardPersonalSnapshot>(chronicleId),
  replace: (chronicleId: string, state: Readonly<Record<string, unknown>>) => request<ChronicleSpaceBoardPersonalSnapshot>(chronicleId, { method: 'PATCH', body: JSON.stringify({ state }) }),
}

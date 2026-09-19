export type ChronicleSpaceBoardPosition = { readonly x: number; readonly y: number }
// CHRONICLE_SPACE_BOARD_CONNECTION_TYPES_V1
export type ChronicleSpaceBoardConnection = { readonly id: string; readonly fromId: string; readonly toId: string; readonly label: string; readonly type: 'VISUAL' | 'KNOWN' | 'SUSPICION' }
export type ChronicleSpaceBoardSnapshot = { readonly chronicleId: string; readonly positions: Readonly<Record<string, ChronicleSpaceBoardPosition>>; readonly connections: readonly ChronicleSpaceBoardConnection[]; readonly revision: number; readonly updatedAt: string | null }

export class ChronicleSpaceBoardConflictError extends Error {
  readonly current: ChronicleSpaceBoardSnapshot | null
  constructor(current: ChronicleSpaceBoardSnapshot | null) {
    super('La pizarra cambió en otro usuario. Recarga para continuar.')
    this.name = 'ChronicleSpaceBoardConflictError'
    this.current = current
  }
}

async function request<T>(chronicleId: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/chronicles/' + encodeURIComponent(chronicleId) + '/space-board', { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  const body = await response.json().catch(() => null)
  if (response.status === 409) throw new ChronicleSpaceBoardConflictError((body?.current ?? null) as ChronicleSpaceBoardSnapshot | null)
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'No se pudo guardar la pizarra.')
  return body as T
}

export const chronicleSpaceBoardApi = {
  get: (chronicleId: string) => request<ChronicleSpaceBoardSnapshot>(chronicleId),
  replace: (chronicleId: string, input: { readonly revision: number; readonly positions: Readonly<Record<string, ChronicleSpaceBoardPosition>>; readonly connections: readonly ChronicleSpaceBoardConnection[] }) => request<ChronicleSpaceBoardSnapshot>(chronicleId, { method: 'PATCH', body: JSON.stringify(input) }),
  subscribe: (chronicleId: string, onSnapshot: (snapshot: ChronicleSpaceBoardSnapshot) => void) => {
    const stream = new EventSource('/api/chronicles/' + encodeURIComponent(chronicleId) + '/space-board/events', { withCredentials: true })
    stream.onmessage = (event) => { try { onSnapshot(JSON.parse(event.data) as ChronicleSpaceBoardSnapshot) } catch { /* se ignora un evento inválido */ } }
    return () => stream.close()
  },
}

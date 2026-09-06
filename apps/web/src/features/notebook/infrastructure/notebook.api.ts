import type { NotebookContext, NotebookNote, NotebookPage, NotebookVisibility, NotebookResourcePreview } from '../types/notebook.types'
export type NotebookWrite = {
  readonly title: string; readonly content: string; readonly visibility: NotebookVisibility
  readonly sessionId?: string | null; readonly tags?: readonly string[]; readonly audienceUserIds?: readonly string[]
  readonly references?: readonly { readonly targetType: string; readonly targetId: string; readonly label?: string }[]
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'No se pudo completar la operación. Comprueba tus permisos y vuelve a intentarlo.')
  return body as T
}
const base = (id: string) => '/api/chronicles/' + encodeURIComponent(id) + '/notebook'
export const notebookApi = {
  pin: (id: string, noteId: string, pinned: boolean) => request<NotebookNote>(base(id) + '/' + encodeURIComponent(noteId) + '/pin', { method: 'POST', body: JSON.stringify({ pinned }) }),
  context: (id: string) => request<NotebookContext>(base(id) + '/context'),
  list: (id: string, sessionId?: string) => request<NotebookPage>(base(id) + (sessionId ? '?sessionId=' + encodeURIComponent(sessionId) : '')),
  create: (id: string, body: NotebookWrite) => request<NotebookNote>(base(id), { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, noteId: string, body: Partial<NotebookWrite> & { readonly pinned?: boolean }) => request<NotebookNote>(base(id) + '/' + encodeURIComponent(noteId), { method: 'PATCH', body: JSON.stringify(body) }),
  archive: (id: string, noteId: string) => request<{ archived: boolean }>(base(id) + '/' + encodeURIComponent(noteId), { method: 'DELETE' }),
  resourcePreview: (id: string, type: string, targetId: string) => request<NotebookResourcePreview>(base(id) + '/resource/' + encodeURIComponent(type) + '/' + encodeURIComponent(targetId)),
}

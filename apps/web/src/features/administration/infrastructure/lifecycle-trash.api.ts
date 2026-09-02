import type {
  LifecycleTrashDependencies,
  LifecycleTrashKind,
  LifecycleTrashPage,
} from '../types/lifecycle-trash.types'

export class LifecycleTrashApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly blockers: readonly string[] = [],
  ) {
    super(code)
    this.name = 'LifecycleTrashApiError'
  }
}

async function responseError(response: Response): Promise<LifecycleTrashApiError> {
  try {
    const body = await response.json() as { code?: string; blockers?: string[] }
    return new LifecycleTrashApiError(
      response.status,
      body.code ?? 'LIFECYCLE_TRASH_REQUEST_FAILED',
      Array.isArray(body.blockers) ? body.blockers : [],
    )
  } catch {
    return new LifecycleTrashApiError(response.status, 'LIFECYCLE_TRASH_REQUEST_FAILED')
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: init?.body === undefined
      ? init?.headers
      : { 'content-type': 'application/json', ...init.headers },
  })
  if (!response.ok) throw await responseError(response)
  if (response.status === 204) return undefined as T
  return await response.json() as T
}

export function createLifecycleTrashGateway() {
  const base = '/api/administration/lifecycle/trash'
  return {
    async list(input: { kind?: LifecycleTrashKind; query?: string; updatedFrom?: string; updatedTo?: string; limit?: number; offset?: number }): Promise<LifecycleTrashPage> {
      const query = new URLSearchParams()
      if (input.kind !== undefined) query.set('kind', input.kind)
      if (input.query !== undefined && input.query.trim() !== '') query.set('query', input.query.trim())
      if (input.updatedFrom !== undefined && input.updatedFrom !== '') query.set('updatedFrom', input.updatedFrom)
      if (input.updatedTo !== undefined && input.updatedTo !== '') query.set('updatedTo', input.updatedTo)
      query.set('limit', String(input.limit ?? 50))
      query.set('offset', String(input.offset ?? 0))
      return request<LifecycleTrashPage>(base + '?' + query.toString())
    },
    async dependencies(kind: LifecycleTrashKind, id: string): Promise<LifecycleTrashDependencies> {
      return request<LifecycleTrashDependencies>(base + '/' + kind + '/' + id + '/dependencies')
    },
    async restore(kind: LifecycleTrashKind, id: string): Promise<void> {
      await request(base + '/' + kind + '/' + id + '/restore', { method: 'PATCH' })
    },
    async purge(kind: LifecycleTrashKind, id: string, confirmation: string): Promise<void> {
      await request(base + '/' + kind + '/' + id, {
        method: 'DELETE',
        body: JSON.stringify({ confirmation }),
      })
    },
  }
}

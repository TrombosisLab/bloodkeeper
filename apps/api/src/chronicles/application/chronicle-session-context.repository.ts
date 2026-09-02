import type {
  ChronicleSessionContext,
  ReplaceChronicleSessionContextData,
} from '../domain/chronicle-session-context.types'

export const CHRONICLE_SESSION_CONTEXT_REPOSITORY =
  Symbol(
    'CHRONICLE_SESSION_CONTEXT_REPOSITORY',
  )

export type ChronicleSessionContextResourceKind =
  | 'event'
  | 'npc'
  | 'location'
  | 'resource'

export class ChronicleSessionContextReferenceError
  extends Error {
  readonly resourceKind:
    ChronicleSessionContextResourceKind
  readonly resourceId: string

  constructor(
    resourceKind:
      ChronicleSessionContextResourceKind,
    resourceId: string,
  ) {
    super(
      `Invalid ${resourceKind} reference: ${resourceId}`,
    )
    this.name =
      'ChronicleSessionContextReferenceError'
    this.resourceKind = resourceKind
    this.resourceId = resourceId
  }
}

export class ChronicleSessionContextNotEditableError
  extends Error {
  constructor(sessionId: string) {
    super(
      `Chronicle session context is not editable: ${sessionId}`,
    )
    this.name =
      'ChronicleSessionContextNotEditableError'
  }
}

export interface ChronicleSessionContextRepository {
  findBySessionId(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSessionContext | null>

  replace(
    data: ReplaceChronicleSessionContextData,
  ): Promise<ChronicleSessionContext | null>
}

export interface ChronicleSessionContextEvent {
  readonly id: string
  readonly title: string
  readonly status:
    | 'active'
    | 'archived'
  readonly narrativeTimeLabel: string | null
  readonly realDate: Date | null
  readonly timelineOrder: number
}

export interface ChronicleSessionContextNpc {
  readonly id: string
  readonly name: string
  readonly status:
    | 'active'
    | 'archived'
  readonly category: string | null
  readonly narrativeRole: string | null
}

export interface ChronicleSessionContextLocation {
  readonly id: string
  readonly name: string
  readonly status:
    | 'active'
    | 'archived'
  readonly category: string | null
  readonly parentLocationId: string | null
}

export interface ChronicleSessionContext {
  readonly sessionId: string
  readonly events:
    readonly ChronicleSessionContextEvent[]
  readonly npcs:
    readonly ChronicleSessionContextNpc[]
  readonly locations:
    readonly ChronicleSessionContextLocation[]
}

export interface ReplaceChronicleSessionContextData {
  readonly chronicleId: string
  readonly sessionId: string
  readonly eventIds: readonly string[]
  readonly npcIds: readonly string[]
  readonly locationIds: readonly string[]
}

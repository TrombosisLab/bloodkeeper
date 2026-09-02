export type ChronicleSessionStatus =
  | 'preparation'
  | 'completed'
  | 'archived'

export interface ChronicleSession {
  readonly id: string
  readonly chronicleId: string
  readonly sessionNumber: number | null
  readonly title: string | null
  readonly realDate: Date | null
  readonly status: ChronicleSessionStatus
  readonly summary: string | null
  readonly narratorNotes: string | null
  readonly objective: string | null
  readonly plannedSummary: string | null
  readonly revision: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateChronicleSessionData {
  readonly chronicleId: string
  readonly sessionNumber: number | null
  readonly title: string | null
  readonly realDate: Date | null
  readonly summary: string | null
  readonly narratorNotes: string | null
  readonly objective?: string | null
  readonly plannedSummary?: string | null
}

export interface UpdateChronicleSessionData {
  readonly chronicleId: string
  readonly sessionId: string
  readonly sessionNumber?: number | null
  readonly title?: string | null
  readonly realDate?: Date | null
  readonly summary?: string | null
  readonly narratorNotes?: string | null
  readonly objective?: string | null
  readonly plannedSummary?: string | null
}

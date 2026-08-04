export type ChronicleStatus =
  | 'preparation'
  | 'active'
  | 'archived'

export interface Chronicle {
  readonly id: string
  readonly narratorId: string
  readonly name: string
  readonly description: string | null
  readonly status: ChronicleStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

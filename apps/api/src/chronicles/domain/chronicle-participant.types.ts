export type ChronicleParticipantRole =
  | 'narrator'
  | 'player'

export type ChronicleParticipantStatus =
  | 'active'
  | 'retired'

export interface ChronicleParticipant {
  readonly id: string
  readonly chronicleId: string
  readonly userId: string
  readonly username: string
  readonly displayName: string
  readonly role: ChronicleParticipantRole
  readonly status: ChronicleParticipantStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface AddChronicleParticipantData {
  readonly chronicleId: string
  readonly userId: string
  readonly role: ChronicleParticipantRole
}

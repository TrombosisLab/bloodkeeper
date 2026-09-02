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
  readonly narratorNotes: string | null
  readonly revision: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface UpdateChronicleParticipantNarratorNotesData {
  readonly chronicleId: string
  readonly participantId: string
  readonly expectedRevision: number
  readonly narratorNotes: string | null
}

export interface AddChronicleParticipantData {
  readonly chronicleId: string
  readonly userId: string
  readonly role: ChronicleParticipantRole
}

import type {
  AddChronicleParticipantData,
  ChronicleParticipant,
} from '../domain/chronicle-participant.types'

export const CHRONICLE_PARTICIPANT_REPOSITORY =
  Symbol('CHRONICLE_PARTICIPANT_REPOSITORY')

export class ChronicleParticipantDuplicateError
  extends Error {
  constructor(
    chronicleId: string,
    userId: string,
  ) {
    super(
      `Chronicle participant already exists: ${chronicleId}/${userId}`,
    )
    this.name =
      'ChronicleParticipantDuplicateError'
  }
}

export class ChronicleParticipantWriteConflictError
  extends Error {
  constructor(participantId: string) {
    super(
      `Chronicle participant changed concurrently: ${participantId}`,
    )
    this.name =
      'ChronicleParticipantWriteConflictError'
  }
}

export interface ChronicleParticipantRepository {
  findActiveMembership(
    chronicleId: string,
    userId: string,
  ): Promise<ChronicleParticipant | null>

  findById(
    chronicleId: string,
    participantId: string,
  ): Promise<ChronicleParticipant | null>

  findByUserId(
    chronicleId: string,
    userId: string,
  ): Promise<ChronicleParticipant | null>

  listByChronicleId(
    chronicleId: string,
  ): Promise<readonly ChronicleParticipant[]>

  userExists(
    userId: string,
  ): Promise<boolean>

  add(
    data: AddChronicleParticipantData,
  ): Promise<ChronicleParticipant>

  countActiveNarrators(
    chronicleId: string,
  ): Promise<number>

  retire(
    chronicleId: string,
    participantId: string,
  ): Promise<ChronicleParticipant>
}

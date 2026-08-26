import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

export class ChronicleStoryPermissionError
  extends Error {
  constructor() {
    super(
      'Active contextual Narrator membership is required',
    )
    this.name =
      'ChronicleStoryPermissionError'
  }
}

export async function assertChronicleStoryNarrator(
  participants: ChronicleParticipantRepository,
  actorUserId: string,
  chronicleId: string,
): Promise<void> {
  const membership =
    await participants.findActiveMembership(
      chronicleId,
      actorUserId,
    )

  if (
    membership === null ||
    membership.role !== 'narrator'
  ) {
    throw new ChronicleStoryPermissionError()
  }
}


export async function assertChronicleStoryParticipant(
  participants: ChronicleParticipantRepository,
  actorUserId: string,
  chronicleId: string,
): Promise<void> {
  const membership =
    await participants.findActiveMembership(
      chronicleId,
      actorUserId,
    )

  if (membership === null) {
    throw new ChronicleStoryPermissionError()
  }
}

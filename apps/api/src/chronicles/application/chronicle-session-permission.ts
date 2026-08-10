import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

export class ChronicleSessionPermissionError
  extends Error {
  constructor() {
    super(
      'Active contextual Narrator membership is required',
    )
    this.name =
      'ChronicleSessionPermissionError'
  }
}

export async function assertChronicleSessionNarrator(
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
    throw new ChronicleSessionPermissionError()
  }
}

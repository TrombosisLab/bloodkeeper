import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

export class ChronicleNpcPermissionError
  extends Error {
  constructor() {
    super(
      'Active contextual Narrator membership is required',
    )
    this.name =
      'ChronicleNpcPermissionError'
  }
}

export async function assertChronicleNpcNarrator(
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
    throw new ChronicleNpcPermissionError()
  }
}

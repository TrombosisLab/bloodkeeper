import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

export class ChronicleLocationPermissionError
  extends Error {
  constructor() {
    super(
      'Active contextual Narrator membership is required',
    )
    this.name =
      'ChronicleLocationPermissionError'
  }
}

export async function assertChronicleLocationNarrator(
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
    throw new ChronicleLocationPermissionError()
  }
}

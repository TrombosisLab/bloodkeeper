import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'

import type {
  ChronicleUserDirectory,
  ChronicleUserDirectoryEntry,
} from './chronicle-user-directory'

import {
  ChronicleParticipantPermissionError,
} from './list-chronicle-participants.use-case'

export class ListChronicleParticipantCandidatesUseCase {
  constructor(
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly users:
      ChronicleUserDirectory,
  ) {}

  async execute(
    requesterId: string,
    chronicleId: string,
  ): Promise<
    readonly ChronicleUserDirectoryEntry[]
  > {
    const membership =
      await this.participants
        .findActiveMembership(
          chronicleId,
          requesterId,
        )

    if (
      membership === null ||
      membership.role !== 'narrator'
    ) {
      throw new ChronicleParticipantPermissionError()
    }

    const [
      users,
      existingParticipants,
    ] = await Promise.all([
      this.users.list(),
      this.participants
        .listByChronicleId(
          chronicleId,
        ),
    ])

    const existingUserIds =
      new Set(
        existingParticipants.map(
          (participant) =>
            participant.userId,
        ),
      )

    return users.filter(
      (user) =>
        !existingUserIds.has(user.id),
    )
  }
}

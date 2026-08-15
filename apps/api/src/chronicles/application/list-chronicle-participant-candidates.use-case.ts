import {
  MAX_OFFSET_PAGE_LIMIT,
} from '../../common/offset-pagination'

import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

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
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleUserDirectoryEntry>
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

    const existingParticipants =
      await this.participants
        .listByChronicleId(
          chronicleId,
        )

    const existingUserIds =
      new Set(
        existingParticipants.map(
          (participant) =>
            participant.userId,
        ),
      )

    const candidates:
      ChronicleUserDirectoryEntry[] = []

    let sourceOffset:
      number | null = 0

    let candidateIndex = 0

    while (
      sourceOffset !== null &&
      candidates.length <= query.limit
    ) {
      const page:
        OffsetPage<ChronicleUserDirectoryEntry> =
        await this.users.list({
          limit:
            MAX_OFFSET_PAGE_LIMIT,
          offset:
            sourceOffset,
        })

      for (const user of page.items) {
        if (
          existingUserIds.has(
            user.id,
          )
        ) {
          continue
        }

        if (
          candidateIndex <
          query.offset
        ) {
          candidateIndex += 1
          continue
        }

        candidates.push(user)
        candidateIndex += 1

        if (
          candidates.length >
          query.limit
        ) {
          break
        }
      }

      sourceOffset =
        page.nextOffset
    }

    const hasNext =
      candidates.length >
      query.limit

    return {
      items: candidates.slice(
        0,
        query.limit,
      ),
      nextOffset:
        hasNext
          ? query.offset +
            query.limit
          : null,
    }
  }
}

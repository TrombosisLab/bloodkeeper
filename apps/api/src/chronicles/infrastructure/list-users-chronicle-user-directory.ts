import {
  Injectable,
} from '@nestjs/common'

import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import {
  ListUsersUseCase,
} from '../../users/application/list-users.use-case'

import type {
  ChronicleUserDirectory,
  ChronicleUserDirectoryEntry,
} from '../application/chronicle-user-directory'

function toDirectoryEntry(
  user: {
    readonly id: string
    readonly username: string
    readonly displayName: string
  },
): ChronicleUserDirectoryEntry {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  }
}

@Injectable()
export class ListUsersChronicleUserDirectory
  implements ChronicleUserDirectory {
  constructor(
    private readonly listUsers:
      ListUsersUseCase,
  ) {}

  list(): Promise<
    readonly ChronicleUserDirectoryEntry[]
  >

  list(
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleUserDirectoryEntry>
  >

  async list(
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly ChronicleUserDirectoryEntry[]
    | OffsetPage<ChronicleUserDirectoryEntry>
  > {
    if (query === undefined) {
      const users =
        await this.listUsers.execute()

      return users.map(
        toDirectoryEntry,
      )
    }

    const page =
      await this.listUsers.execute(
        query,
      )

    return {
      items: page.items.map(
        toDirectoryEntry,
      ),
      nextOffset:
        page.nextOffset,
    }
  }
}

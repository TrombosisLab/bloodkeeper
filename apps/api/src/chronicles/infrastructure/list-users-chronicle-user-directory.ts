import {
  Injectable,
} from '@nestjs/common'

import {
  ListUsersUseCase,
} from '../../users/application/list-users.use-case'

import type {
  ChronicleUserDirectory,
  ChronicleUserDirectoryEntry,
} from '../application/chronicle-user-directory'

@Injectable()
export class ListUsersChronicleUserDirectory
  implements ChronicleUserDirectory {
  constructor(
    private readonly listUsers:
      ListUsersUseCase,
  ) {}

  async list(): Promise<
    readonly ChronicleUserDirectoryEntry[]
  > {
    const users =
      await this.listUsers.execute()

    return users.map(
      (user) => ({
        id: user.id,
        username: user.username,
        displayName:
          user.displayName,
      }),
    )
  }
}

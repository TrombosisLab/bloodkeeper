import {
  Injectable,
} from '@nestjs/common'

import {
  CharacterStatus,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  ChronicleParticipantRelations,
} from '../application/chronicle-participant-relations'

@Injectable()
export class PrismaChronicleParticipantRelations
  implements ChronicleParticipantRelations {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async hasNonArchivedCharacters(
    chronicleId: string,
    userId: string,
  ): Promise<boolean> {
    const count =
      await this.database.character.count({
        where: {
          chronicleId,
          ownerId: userId,
          status: {
            not: CharacterStatus.ARCHIVED,
          },
        },
      })

    return count > 0
  }
}

import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  ChronicleNpc,
  CreateChronicleNpcData,
  UpdateChronicleNpcData,
} from '../domain/chronicle-npc.types'

export const CHRONICLE_NPC_REPOSITORY =
  Symbol('CHRONICLE_NPC_REPOSITORY')

export interface ChronicleNpcRepository {
  listByChronicleId(
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<OffsetPage<ChronicleNpc>>

  findById(
    chronicleId: string,
    npcId: string,
  ): Promise<ChronicleNpc | null>

  create(
    data: CreateChronicleNpcData,
  ): Promise<ChronicleNpc>

  update(
    data: UpdateChronicleNpcData,
  ): Promise<ChronicleNpc | null>

  archive(
    chronicleId: string,
    npcId: string,
  ): Promise<ChronicleNpc | null>
}

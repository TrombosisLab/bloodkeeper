import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  ChronicleLocation,
  CreateChronicleLocationData,
  UpdateChronicleLocationData,
} from '../domain/chronicle-location.types'

export const CHRONICLE_LOCATION_REPOSITORY =
  Symbol('CHRONICLE_LOCATION_REPOSITORY')

export interface ChronicleLocationRepository {
  listByChronicleId(
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<OffsetPage<ChronicleLocation>>

  findById(
    chronicleId: string,
    locationId: string,
  ): Promise<ChronicleLocation | null>

  create(
    data: CreateChronicleLocationData,
  ): Promise<ChronicleLocation>

  update(
    data: UpdateChronicleLocationData,
  ): Promise<ChronicleLocation | null>

  archive(
    chronicleId: string,
    locationId: string,
  ): Promise<ChronicleLocation | null>
}

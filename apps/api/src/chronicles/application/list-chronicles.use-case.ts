import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  ChronicleRepository,
} from './chronicle.repository'

import type {
  Chronicle,
} from '../domain/chronicle.types'

export class ListChroniclesUseCase {
  constructor(
    private readonly repository:
      ChronicleRepository,
  ) {}

  execute(
    narratorId: string,
  ): Promise<readonly Chronicle[]>

  execute(
    narratorId: string,
    query: OffsetPaginationQuery,
  ): Promise<OffsetPage<Chronicle>>

  execute(
    narratorId: string,
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly Chronicle[]
    | OffsetPage<Chronicle>
  > {
    return query === undefined
      ? this.repository.findByNarratorId(
          narratorId,
        )
      : this.repository.findByNarratorId(
          narratorId,
          query,
        )
  }
}

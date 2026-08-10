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
    userId: string,
  ): Promise<readonly Chronicle[]> {
    return this.repository.findByNarratorId(
      userId,
    )
  }
}

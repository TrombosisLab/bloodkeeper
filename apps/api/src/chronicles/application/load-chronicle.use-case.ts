import type {
  ChronicleRepository,
} from './chronicle.repository'

import type {
  Chronicle,
} from '../domain/chronicle.types'

export class LoadChronicleUseCase {
  constructor(
    private readonly repository:
      ChronicleRepository,
  ) {}

  execute(
    userId: string,
    chronicleId: string,
  ): Promise<Chronicle | null> {
    return this.repository.findById(
      userId,
      chronicleId,
    )
  }
}

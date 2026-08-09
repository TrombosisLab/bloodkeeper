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
    narratorId: string,
    chronicleId: string,
  ): Promise<Chronicle | null> {
    return this.repository.findById(
      narratorId,
      chronicleId,
    )
  }
}

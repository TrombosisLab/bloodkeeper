import type {
  ChronicleRepository,
} from './chronicle.repository'

import {
  normalizeChronicleCreation,
} from '../domain/chronicle-creation.rules'

import type {
  Chronicle,
  CreateChronicleData,
} from '../domain/chronicle.types'

export class CreateChronicleUseCase {
  constructor(
    private readonly repository:
      ChronicleRepository,
  ) {}

  execute(
    data: CreateChronicleData,
  ): Promise<Chronicle> {
    return this.repository.create(
      normalizeChronicleCreation(data),
    )
  }
}

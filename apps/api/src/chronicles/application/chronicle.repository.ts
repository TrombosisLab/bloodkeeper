import type {
  Chronicle,
  ChronicleStatus,
  CreateChronicleData,
} from '../domain/chronicle.types'

export const CHRONICLE_REPOSITORY =
  Symbol('CHRONICLE_REPOSITORY')

export interface TransitionChronicleLifecycleData {
  readonly chronicleId: string
  readonly expectedStatus: ChronicleStatus
  readonly nextStatus: ChronicleStatus
}

export class ChronicleLifecycleWriteConflictError
  extends Error {
  constructor(chronicleId: string) {
    super(
      `Chronicle lifecycle changed concurrently: ${chronicleId}`,
    )
    this.name =
      'ChronicleLifecycleWriteConflictError'
  }
}

export interface ChronicleRepository {
  create(
    data: CreateChronicleData,
  ): Promise<Chronicle>

  findByNarratorId(
    narratorId: string,
  ): Promise<readonly Chronicle[]>

  findById(
    narratorId: string,
    chronicleId: string,
  ): Promise<Chronicle | null>

  transitionLifecycle(
    narratorId: string,
    data: TransitionChronicleLifecycleData,
  ): Promise<Chronicle>
}

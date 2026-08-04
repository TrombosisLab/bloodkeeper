import type {
  Chronicle,
  CreateChronicleData,
} from '../domain/chronicle.types'

export const CHRONICLE_REPOSITORY =
  Symbol('CHRONICLE_REPOSITORY')

export interface ChronicleRepository {
  create(
    data: CreateChronicleData,
  ): Promise<Chronicle>

  findByNarratorId(
    narratorId: string,
  ): Promise<readonly Chronicle[]>
}

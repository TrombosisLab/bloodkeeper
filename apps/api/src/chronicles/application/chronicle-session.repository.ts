import type {
  ChronicleSession,
  CreateChronicleSessionData,
  UpdateChronicleSessionData,
} from '../domain/chronicle-session.types'

export const CHRONICLE_SESSION_REPOSITORY =
  Symbol('CHRONICLE_SESSION_REPOSITORY')

export interface ChronicleSessionRepository {
  listByChronicleId(
    chronicleId: string,
  ): Promise<readonly ChronicleSession[]>

  findById(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSession | null>

  create(
    data: CreateChronicleSessionData,
  ): Promise<ChronicleSession>

  update(
    data: UpdateChronicleSessionData,
  ): Promise<ChronicleSession | null>

  complete(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSession | null>

  archive(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSession | null>
}

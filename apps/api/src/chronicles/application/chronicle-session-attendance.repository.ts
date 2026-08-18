import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  ChronicleSessionAttendance,
} from '../domain/chronicle-session-attendance.types'

export const CHRONICLE_SESSION_ATTENDANCE_REPOSITORY =
  Symbol(
    'CHRONICLE_SESSION_ATTENDANCE_REPOSITORY',
  )

export interface ChronicleSessionAttendanceRepository {
  listBySessionId(
    sessionId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleSessionAttendance>
  >

  isEligibleCharacter(
    chronicleId: string,
    characterId: string,
  ): Promise<boolean>

  add(
    sessionId: string,
    characterId: string,
  ): Promise<ChronicleSessionAttendance>

  remove(
    sessionId: string,
    characterId: string,
  ): Promise<void>
}

export const CHRONICLE_PARTICIPANT_RELATIONS =
  Symbol('CHRONICLE_PARTICIPANT_RELATIONS')

export interface ChronicleParticipantRelations {
  hasNonArchivedCharacters(
    chronicleId: string,
    userId: string,
  ): Promise<boolean>
}

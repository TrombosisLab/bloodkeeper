import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'
import type {
  CharacterExperienceCharacter,
} from '../domain/character-experience.types'

export class CharacterExperiencePermissionError
  extends Error {
  constructor() {
    super(
      'Character owner or active contextual Narrator membership is required',
    )
    this.name =
      'CharacterExperiencePermissionError'
  }
}

export async function assertCharacterExperienceReader(
  participants: ChronicleParticipantRepository,
  actorUserId: string,
  character: CharacterExperienceCharacter,
): Promise<void> {
  if (character.ownerId === actorUserId) {
    return
  }

  if (character.chronicleId === null) {
    throw new CharacterExperiencePermissionError()
  }

  const membership =
    await participants.findActiveMembership(
      character.chronicleId,
      actorUserId,
    )

  if (
    membership === null ||
    membership.role !== 'narrator'
  ) {
    throw new CharacterExperiencePermissionError()
  }
}

export async function assertCharacterExperienceNarrator(
  participants: ChronicleParticipantRepository,
  actorUserId: string,
  chronicleId: string,
): Promise<void> {
  const membership =
    await participants.findActiveMembership(
      chronicleId,
      actorUserId,
    )

  if (
    membership === null ||
    membership.role !== 'narrator'
  ) {
    throw new CharacterExperiencePermissionError()
  }
}

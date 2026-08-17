import type {
  CharacterProfilePhase,
} from '../domain/character-transition.rules'

import type {
  CharacterEmbracePendingDecision,
} from '../domain/character-embrace.types'

import type {
  CharacterProfilePhaseReadSnapshot,
} from '../application/load-character-profile-phase.use-case'

export interface CharacterProfilePhaseResponseDto {
  readonly phase: CharacterProfilePhase
  readonly pendingDecisions:
    readonly CharacterEmbracePendingDecision[]
}

export function toCharacterProfilePhaseResponse(
  snapshot: CharacterProfilePhaseReadSnapshot,
): CharacterProfilePhaseResponseDto {
  return {
    phase: snapshot.phase,
    pendingDecisions: [
      ...snapshot.pendingDecisions,
    ],
  }
}

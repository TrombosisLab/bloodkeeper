import type {
  CharacterProfilePhase,
} from '../domain/character-transition.rules'

export interface CharacterProfilePhaseResponseDto {
  readonly phase: CharacterProfilePhase
}

export function toCharacterProfilePhaseResponse(
  phase: CharacterProfilePhase,
): CharacterProfilePhaseResponseDto {
  return { phase }
}

import type {
  PersistedCharacterDraft,
} from './persisted-character.types'

import {
  deriveInitialDisciplineProgress,
} from './character-initial-discipline.rules'

import {
  analyzeInitialAdvantageReview,
} from './character-initial-advantage.rules'

export const CHARACTER_EMBRACE_PENDING_DECISIONS = [
  'clan',
  'generation',
  'sire',
  'bloodState',
  'predatorType',
  'initialDisciplines',
  'initialPowers',
  'advantagesReview',
] as const

export type CharacterEmbracePendingDecision =
  typeof CHARACTER_EMBRACE_PENDING_DECISIONS[number]

export interface PersistCharacterEmbraceData {
  readonly characterId: string
  readonly expectedRevision: number
  readonly historyEntryId: string
}

export interface EmbraceCharacterResult {
  readonly character: PersistedCharacterDraft
  readonly pendingDecisions:
    readonly CharacterEmbracePendingDecision[]
}

export function deriveCharacterEmbracePendingDecisions(
  character: PersistedCharacterDraft,
): readonly CharacterEmbracePendingDecision[] {
  const pending:
    CharacterEmbracePendingDecision[] = []

  if (character.identity.clanKey === null) {
    pending.push('clan')
  }

  if (character.identity.generation === null) {
    pending.push('generation')
  }

  if (character.identity.sire === null) {
    pending.push('sire')
  }

  if (character.blood === null) {
    pending.push('bloodState')
  }

  if (
    character.identity.predatorTypeKey === null
  ) {
    pending.push('predatorType')
  }

  const initialDisciplineProgress =
    deriveInitialDisciplineProgress(
      character,
    )

  if (
    !initialDisciplineProgress
      .disciplinesComplete
  ) {
    pending.push('initialDisciplines')
  }

  if (
    !initialDisciplineProgress
      .powersComplete
  ) {
    pending.push('initialPowers')
  }

  if (
    analyzeInitialAdvantageReview(
      character,
    ).required
  ) {
    pending.push('advantagesReview')
  }

  return pending
}

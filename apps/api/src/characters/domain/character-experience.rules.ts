import type {
  CharacterExperienceComponent,
  CharacterExperienceGrantReason,
  CharacterExperienceLedger,
} from './character-experience.types'

interface CharacterExperienceGrantPolicy {
  readonly amount: number
  readonly sessionRequired: boolean
}

export const characterExperienceGrantPolicies = {
  session_played: {
    amount: 1,
    sessionRequired: true,
  },
  story_end: {
    amount: 1,
    sessionRequired: false,
  },
  fast_session: {
    amount: 2,
    sessionRequired: true,
  },
} as const satisfies Record<
  CharacterExperienceGrantReason,
  CharacterExperienceGrantPolicy
>

export class CharacterExperienceBalanceError
  extends Error {
  constructor() {
    super(
      'Experience total, spent and available must remain non-negative',
    )
    this.name =
      'CharacterExperienceBalanceError'
  }
}

export function characterExperienceGrantPolicy(
  reason: CharacterExperienceGrantReason,
): CharacterExperienceGrantPolicy {
  return characterExperienceGrantPolicies[
    reason
  ]
}

export function characterExperienceGrantKey(
  reason: CharacterExperienceGrantReason,
  sessionId: string | null,
  operationId: string,
): string {
  return sessionId === null
    ? `grant:operation:${operationId}`
    : `grant:session:${sessionId}:${reason}`
}

export function projectCharacterExperienceCorrection(
  ledger: Pick<
    CharacterExperienceLedger,
    'total' | 'spent'
  >,
  component: CharacterExperienceComponent,
  amount: number,
): {
  readonly total: number
  readonly spent: number
  readonly available: number
} {
  const total =
    ledger.total +
    (component === 'earned' ? amount : 0)
  const spent =
    ledger.spent +
    (component === 'spent' ? amount : 0)
  const available = total - spent

  if (
    !Number.isSafeInteger(amount) ||
    amount === 0 ||
    total < 0 ||
    spent < 0 ||
    available < 0
  ) {
    throw new CharacterExperienceBalanceError()
  }

  return {
    total,
    spent,
    available,
  }
}

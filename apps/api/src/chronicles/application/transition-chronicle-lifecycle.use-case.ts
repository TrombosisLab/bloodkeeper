import {
  assertChronicleLifecycleTransition,
} from '../domain/chronicle-lifecycle.rules'

import type {
  Chronicle,
  ChronicleStatus,
} from '../domain/chronicle.types'

import type {
  ChronicleRepository,
} from './chronicle.repository'

export class TransitionChronicleLifecycleUseCase {
  constructor(
    private readonly repository:
      ChronicleRepository,
  ) {}

  async execute(
    narratorId: string,
    chronicleId: string,
    nextStatus: ChronicleStatus,
  ): Promise<Chronicle | null> {
    const current =
      await this.repository.findById(
        narratorId,
        chronicleId,
      )

    if (current === null) {
      return null
    }

    assertChronicleLifecycleTransition({
      from: current.status,
      to: nextStatus,
      authorized: true,
    })

    return this.repository.transitionLifecycle(
      narratorId,
      {
        chronicleId,
        expectedStatus: current.status,
        nextStatus,
      },
    )
  }
}

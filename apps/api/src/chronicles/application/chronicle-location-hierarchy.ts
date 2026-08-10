import type {
  ChronicleLocationRepository,
} from './chronicle-location.repository'

export class ChronicleLocationParentNotFoundError
  extends Error {
  constructor(parentLocationId: string) {
    super(
      `Chronicle location parent not found: ${parentLocationId}`,
    )
    this.name =
      'ChronicleLocationParentNotFoundError'
  }
}

export class ChronicleLocationHierarchyCycleError
  extends Error {
  constructor(locationId: string) {
    super(
      `Chronicle location hierarchy cycle: ${locationId}`,
    )
    this.name =
      'ChronicleLocationHierarchyCycleError'
  }
}

export async function assertChronicleLocationParent(
  locations: ChronicleLocationRepository,
  chronicleId: string,
  locationId: string | null,
  parentLocationId: string | null,
): Promise<void> {
  if (parentLocationId === null) {
    return
  }

  if (
    locationId !== null &&
    parentLocationId === locationId
  ) {
    throw new ChronicleLocationHierarchyCycleError(
      locationId,
    )
  }

  const parent =
    await locations.findById(
      chronicleId,
      parentLocationId,
    )

  if (parent === null) {
    throw new ChronicleLocationParentNotFoundError(
      parentLocationId,
    )
  }

  if (locationId === null) {
    return
  }

  const visited = new Set<string>([
    locationId,
  ])
  let candidate = parent

  while (true) {
    if (visited.has(candidate.id)) {
      throw new ChronicleLocationHierarchyCycleError(
        locationId,
      )
    }

    visited.add(candidate.id)

    if (candidate.parentLocationId === null) {
      return
    }

    const next =
      await locations.findById(
        chronicleId,
        candidate.parentLocationId,
      )

    if (next === null) {
      throw new ChronicleLocationParentNotFoundError(
        candidate.parentLocationId,
      )
    }

    candidate = next
  }
}

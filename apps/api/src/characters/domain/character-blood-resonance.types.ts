import {
  characterBloodDyscrasiaCatalog,
  characterBloodResonanceCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesBloodDyscrasiaAcquisitionMode,
  CharacterRulesBloodDyscrasiaKey,
  CharacterRulesBloodResonanceKey,
  CharacterRulesBloodSourceKind,
  CharacterRulesBloodSpecialAffinityKey,
  CharacterRulesBloodTemperament,
} from '@v5r/character-rules'

import {
  assertValidCharacterHunger,
} from './character-hunger.rules'

export type CharacterBloodResonanceKey =
  CharacterRulesBloodResonanceKey

export type CharacterBloodSourceKind =
  CharacterRulesBloodSourceKind

export type CharacterBloodSpecialAffinityKey =
  CharacterRulesBloodSpecialAffinityKey

export type CharacterBloodTemperament =
  CharacterRulesBloodTemperament

export type CharacterBloodDyscrasiaKey =
  CharacterRulesBloodDyscrasiaKey

export type CharacterBloodDyscrasiaAcquisitionMode =
  CharacterRulesBloodDyscrasiaAcquisitionMode

export interface PersistedCharacterBloodResonance {
  readonly sourceKind: CharacterBloodSourceKind
  readonly resonanceKey:
    CharacterBloodResonanceKey | null
  readonly specialAffinityKey:
    CharacterBloodSpecialAffinityKey | null
  readonly temperament:
    CharacterBloodTemperament | null
}

export interface PersistedCharacterBloodResonanceOperation {
  readonly characterId: string
  readonly operationId: string
  readonly sourceKind: CharacterBloodSourceKind
  readonly resonanceKey:
    CharacterBloodResonanceKey | null
  readonly specialAffinityKey:
    CharacterBloodSpecialAffinityKey | null
  readonly temperament:
    CharacterBloodTemperament | null
  readonly dyscrasiaKey:
    CharacterBloodDyscrasiaKey | null
  readonly dyscrasiaAcquisitionMode:
    CharacterBloodDyscrasiaAcquisitionMode | null
  readonly hungerSlaked: number
  readonly hungerBefore: number
  readonly hungerAfter: number
  readonly createdAt: Date
}

export interface ApplyCharacterBloodResonanceData {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly sourceKind: CharacterBloodSourceKind
  readonly resonanceKey:
    CharacterBloodResonanceKey | null
  readonly specialAffinityKey:
    CharacterBloodSpecialAffinityKey | null
  readonly temperament:
    CharacterBloodTemperament | null
  readonly dyscrasiaKey:
    CharacterBloodDyscrasiaKey | null
  readonly dyscrasiaAcquisitionMode:
    CharacterBloodDyscrasiaAcquisitionMode | null
  readonly hungerSlaked: number
  readonly hungerBefore: number
  readonly hungerAfter: number
}

export type CharacterBloodResonanceViolation =
  | 'PROFILE_INVALID'
  | 'HUNGER_SLAKED_INVALID'
  | 'DYSCRASIA_ACQUISITION_INVALID'
  | 'DYSCRASIA_REQUIRES_ACUTE'
  | 'DYSCRASIA_RESONANCE_MISMATCH'

export class InvalidCharacterBloodResonanceError
  extends Error {
  readonly violations:
    readonly CharacterBloodResonanceViolation[]

  constructor(
    violations:
      readonly CharacterBloodResonanceViolation[],
  ) {
    super('Character blood Resonance is invalid')
    this.name =
      'InvalidCharacterBloodResonanceError'
    this.violations = [...violations]
  }
}

const resonanceKeys = new Set(
  characterBloodResonanceCatalog.resonances.map(
    ({ key }) => key,
  ),
)

const temperamentKeys = new Set(
  characterBloodResonanceCatalog.temperaments.map(
    ({ key }) => key,
  ),
)

const affinityKeys = new Set(
  characterBloodResonanceCatalog
    .specialAffinities
    .map(({ key }) => key),
)

export function assertValidConsumedBloodProfile(
  profile: Pick<
    PersistedCharacterBloodResonanceOperation,
    | 'sourceKind'
    | 'resonanceKey'
    | 'specialAffinityKey'
    | 'temperament'
  >,
): void {
  const {
    sourceKind,
    resonanceKey,
    specialAffinityKey,
    temperament,
  } = profile

  const none =
    resonanceKey === null &&
    specialAffinityKey === null &&
    temperament === null

  const humoral =
    resonanceKey !== null &&
    resonanceKeys.has(resonanceKey) &&
    specialAffinityKey === null &&
    temperament !== null &&
    temperamentKeys.has(temperament)

  const animalBlood =
    sourceKind === 'animal' &&
    resonanceKey === null &&
    specialAffinityKey === 'animalBlood' &&
    affinityKeys.has(specialAffinityKey) &&
    temperament !== null &&
    temperamentKeys.has(temperament)

  const resonanceFree =
    sourceKind === 'human' &&
    resonanceKey === null &&
    specialAffinityKey === 'resonanceFree' &&
    affinityKeys.has(specialAffinityKey) &&
    temperament === null

  if (
    sourceKind !== 'human' &&
    sourceKind !== 'animal'
  ) {
    throw new InvalidCharacterBloodResonanceError(
      ['PROFILE_INVALID'],
    )
  }

  if (
    !none &&
    !humoral &&
    !animalBlood &&
    !resonanceFree
  ) {
    throw new InvalidCharacterBloodResonanceError(
      ['PROFILE_INVALID'],
    )
  }
}

export function assertValidConsumedBloodDyscrasia(
  profile: Pick<
    PersistedCharacterBloodResonanceOperation,
    | 'resonanceKey'
    | 'specialAffinityKey'
    | 'temperament'
  > & {
    readonly dyscrasiaKey?:
      CharacterBloodDyscrasiaKey | null
    readonly dyscrasiaAcquisitionMode?:
      CharacterBloodDyscrasiaAcquisitionMode | null
  },
): void {
  const dyscrasiaKey =
    profile.dyscrasiaKey ?? null
  const acquisitionMode =
    profile.dyscrasiaAcquisitionMode ?? null

  if (
    dyscrasiaKey === null &&
    acquisitionMode === null
  ) {
    return
  }

  if (
    dyscrasiaKey === null ||
    acquisitionMode === null
  ) {
    throw new InvalidCharacterBloodResonanceError(
      ['DYSCRASIA_ACQUISITION_INVALID'],
    )
  }

  const definition =
    characterBloodDyscrasiaCatalog
      .definitions
      .find(
        ({ key }) => key === dyscrasiaKey,
      )

  if (
    definition === undefined ||
    !definition.acquisitionModes.includes(
      acquisitionMode,
    )
  ) {
    throw new InvalidCharacterBloodResonanceError(
      ['DYSCRASIA_ACQUISITION_INVALID'],
    )
  }

  if (
    profile.resonanceKey === null ||
    profile.specialAffinityKey !== null ||
    profile.temperament !== 'acute'
  ) {
    throw new InvalidCharacterBloodResonanceError(
      ['DYSCRASIA_REQUIRES_ACUTE'],
    )
  }

  if (
    definition.resonanceKey !==
      profile.resonanceKey
  ) {
    throw new InvalidCharacterBloodResonanceError(
      ['DYSCRASIA_RESONANCE_MISMATCH'],
    )
  }
}

export function deriveCharacterBloodResonanceHungerAfter(
  hungerBefore: number,
  hungerSlaked: number,
): number {
  assertValidCharacterHunger(hungerBefore)

  if (
    !Number.isInteger(hungerSlaked) ||
    hungerSlaked < 1 ||
    hungerSlaked > hungerBefore
  ) {
    throw new InvalidCharacterBloodResonanceError(
      ['HUNGER_SLAKED_INVALID'],
    )
  }

  const hungerAfter =
    hungerBefore - hungerSlaked

  assertValidCharacterHunger(hungerAfter)

  return hungerAfter
}

export function toActiveCharacterBloodResonance(
  profile: Pick<
    PersistedCharacterBloodResonanceOperation,
    | 'sourceKind'
    | 'resonanceKey'
    | 'specialAffinityKey'
    | 'temperament'
  >,
): PersistedCharacterBloodResonance | null {
  assertValidConsumedBloodProfile(profile)

  if (
    profile.resonanceKey === null &&
    profile.specialAffinityKey === null
  ) {
    return null
  }

  return Object.freeze({
    sourceKind: profile.sourceKind,
    resonanceKey: profile.resonanceKey,
    specialAffinityKey:
      profile.specialAffinityKey,
    temperament: profile.temperament,
  })
}

export function isSameCharacterBloodResonanceOperation(
  existing:
    PersistedCharacterBloodResonanceOperation,
  attempted: Pick<
    ApplyCharacterBloodResonanceData,
    | 'sourceKind'
    | 'resonanceKey'
    | 'specialAffinityKey'
    | 'temperament'
    | 'hungerSlaked'
  > & Partial<
    Pick<
      ApplyCharacterBloodResonanceData,
      | 'dyscrasiaKey'
      | 'dyscrasiaAcquisitionMode'
    >
  >,
): boolean {
  return (
    existing.sourceKind === attempted.sourceKind &&
    existing.resonanceKey === attempted.resonanceKey &&
    existing.specialAffinityKey ===
      attempted.specialAffinityKey &&
    existing.temperament === attempted.temperament &&
    (existing.dyscrasiaKey ?? null) ===
      (attempted.dyscrasiaKey ?? null) &&
    (existing.dyscrasiaAcquisitionMode ?? null) ===
      (attempted.dyscrasiaAcquisitionMode ?? null) &&
    existing.hungerSlaked === attempted.hungerSlaked
  )
}

import type {
  ContentSourceKey,
} from './content-source.types'

export type BloodSorceryRitualKey = string

export interface BloodSorceryRitualDefinition {
  key: BloodSorceryRitualKey

  name: string

  level: number

  /*
   * Resumen editorial propio.
   * No debe reproducir extensamente
   * el texto protegido del manual.
   */
  summary?: string

  sourceKey?: ContentSourceKey

  sourcePage?: number
}

export interface CharacterBloodSorceryRitualsDraft {
  ritualKeys: BloodSorceryRitualKey[]
}

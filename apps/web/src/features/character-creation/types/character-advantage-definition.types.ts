import type {
  CharacterAdvantageCategory,
} from './character-advantages-draft.types'

export type CharacterAdvantageSource =
  | 'core'
  | 'playersGuide'
  | 'bloodSigils'
  | 'other'

export type CharacterAdvantageCharacterKind =
  | 'standard'
  | 'caitiff'
  | 'thinBlood'

export interface CharacterAdvantageRequirements {
  characterKinds?: CharacterAdvantageCharacterKind[]
  clanKeys?: string[]
  excludedClanKeys?: string[]
  requiredDefinitionKeys?: string[]
}

export interface CharacterAdvantageDefinition {
  key: string
  name: string
  category: CharacterAdvantageCategory

  /*
   * Puntuaciones legales para esta definición.
   * No asumimos que todas admitan automáticamente 1-5.
   */
  allowedRatings: readonly number[]

  source: CharacterAdvantageSource
  sourcePage?: number

  /*
   * Permite varias instancias de la misma definición.
   * Es especialmente útil para Trasfondos que representen
   * entidades, relaciones o recursos distintos.
   */
  allowMultiple: boolean

  /*
   * Indica que la selección necesitará configuración propia
   * por instancia en una fase posterior.
   *
   * Ejemplos futuros:
   * - identidad/nombre del contacto
   * - descripción de un aliado
   * - datos concretos de un refugio
   *
   * Este paso no modela todavía esos datos.
   */
  requiresInstanceDetails: boolean

  requirements?: CharacterAdvantageRequirements

  incompatibleDefinitionKeys?: string[]
}

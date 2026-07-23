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

  /*
   * Si existe, indica qué configuración tipada debe usar
   * cada instancia de esta definición.
   */
  instanceDetailsKind?:
    | 'allies'
    | 'contact'
    | 'retainer'
    | 'status'
    | 'fame'
    | 'influence'
    | 'mask'
    | 'mawla'
    | 'herd'
    | 'resources'
    | 'haven'
    | 'substanceUse'
    | 'loresheet'

  /*
   * Una definición asociada necesita estar vinculada a
   * otra selección mediante parentSelectionId.
   *
   * Se usará inicialmente para elementos vinculados
   * a una instancia de Refugio.
   */
  requiresParentSelection?: boolean

  /*
   * Limita qué definiciones pueden actuar como padre.
   */
  allowedParentDefinitionKeys?: string[]

  /*
   * Puntuación mínima que debe tener la selección padre.
   *
   * Ejemplo:
   * algunos Méritos de Refugio requieren Refugio 2+.
   */
  minimumParentRating?: number

  /*
   * Permite restringir las puntuaciones de esta definición
   * en función de la puntuación concreta de su padre.
   *
   * Ejemplo inicial:
   * Biblioteca está limitada cuando el Refugio es pequeño.
   */
  parentRatingConstraints?: readonly {
    parentRating: number
    allowedRatings: readonly number[]
  }[]

  requirements?: CharacterAdvantageRequirements

  incompatibleDefinitionKeys?: string[]
}

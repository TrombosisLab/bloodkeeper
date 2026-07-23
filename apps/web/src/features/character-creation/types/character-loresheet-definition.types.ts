import type {
  CharacterAdvantageCharacterKind,
  CharacterAdvantageSource,
} from './character-advantage-definition.types'

export type CharacterLoresheetLevel =
  | 1
  | 2
  | 3
  | 4
  | 5

export interface CharacterLoresheetRequirements {
  characterKinds?: CharacterAdvantageCharacterKind[]
  clanKeys?: string[]
  excludedClanKeys?: string[]
}

export interface CharacterLoresheetBenefitDefinition {
  /*
   * Identificador estable de esta ventaja concreta
   * dentro de la Ficha de Conocimientos.
   */
  key: string

  name: string

  /*
   * Cada ventaja de una Ficha de Conocimientos
   * ocupa uno de sus cinco niveles.
   */
  level: CharacterLoresheetLevel
}

export interface CharacterLoresheetDefinition {
  /*
   * Identificador estable de la Ficha de Conocimientos.
   */
  key: string

  name: string

  source: CharacterAdvantageSource
  sourcePage?: number

  /*
   * Restricciones de acceso a la ficha completa.
   */
  requirements?: CharacterLoresheetRequirements

  /*
   * Una Ficha de Conocimientos se modela como un catálogo
   * de cinco ventajas diferenciadas por nivel.
   *
   * Este contrato no incluye todavía textos editoriales
   * ni efectos mecánicos específicos.
   */
  benefits: readonly CharacterLoresheetBenefitDefinition[]
}

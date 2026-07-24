export type ThinBloodTraitCategory =
  | 'merit'
  | 'flaw'

export type ThinBloodTraitSource =
  | 'core'
  | 'playersGuide'
  | 'other'

/*
 * Los Méritos y Defectos específicos de Sangre Débil
 * no se modelan como Ventajas ordinarias con rating.
 *
 * Son rasgos discretos propios de la condición
 * Sangre Débil y siguen sus propias reglas de creación.
 */
export interface ThinBloodTraitDefinition {
  key: string
  name: string
  category: ThinBloodTraitCategory
  source: ThinBloodTraitSource
  sourcePage?: number

  /*
   * Relaciones normativas explícitas entre rasgos.
   *
   * No añadir incompatibilidades por inferencia:
   * sólo deben declararse cuando una fuente las indique.
   */
  incompatibleWithKeys?: readonly string[]
}

/*
 * Selección mínima y estable.
 *
 * No contiene rating porque estos rasgos específicos
 * no deben recibir una puntuación ficticia para encajar
 * en el presupuesto normal de Ventajas 7/2.
 */
import type {
  ClanKey,
} from './clan.types'

export interface ClanCurseThinBloodTraitDetails {
  clanKey: ClanKey
}

export interface ThinBloodTraitSelectionDraft {
  definitionKey: string

  /*
   * Datos específicos opcionales de un rasgo.
   *
   * En este checkpoint sólo se modela Maldición de Clan.
   * El resto de rasgos conserva exactamente el contrato
   * mínimo anterior: { definitionKey }.
   */
  clanCurseDetails?: ClanCurseThinBloodTraitDetails
}

export interface CharacterThinBloodTraitsDraft {
  selections: ThinBloodTraitSelectionDraft[]
}

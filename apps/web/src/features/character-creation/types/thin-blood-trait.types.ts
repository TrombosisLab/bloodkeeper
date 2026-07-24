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
}

/*
 * Selección mínima y estable.
 *
 * No contiene rating porque estos rasgos específicos
 * no deben recibir una puntuación ficticia para encajar
 * en el presupuesto normal de Ventajas 7/2.
 */
export interface ThinBloodTraitSelectionDraft {
  definitionKey: string
}

export interface CharacterThinBloodTraitsDraft {
  selections: ThinBloodTraitSelectionDraft[]
}

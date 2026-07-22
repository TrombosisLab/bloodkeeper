export type CharacterAdvantageCategory =
  | 'merit'
  | 'background'
  | 'flaw'

/*
 * Indica de dónde procede una selección.
 *
 * creation:
 *   Compra normal con el presupuesto inicial.
 *
 * predatorType:
 *   Concesión o coste derivado del Tipo de Depredador.
 *   No consume el presupuesto normal de 7 / 2.
 *
 * thinBlood:
 *   Mérito o Defecto específico de Sangre Débil.
 *   Se valida mediante sus reglas especiales y no se
 *   mezcla con el presupuesto normal de 7 / 2.
 */
export type CharacterAdvantageSelectionOrigin =
  | 'creation'
  | 'predatorType'
  | 'thinBlood'

/*
 * selectionId identifica una instancia concreta.
 *
 * Se mantiene separado de definitionKey porque algunos
 * Trasfondos pueden necesitar múltiples instancias de una
 * misma definición con datos diferentes en el futuro.
 */
export interface CharacterAdvantageSelectionDraft {
  selectionId: string
  definitionKey: string
  category: CharacterAdvantageCategory
  rating: number
  origin: CharacterAdvantageSelectionOrigin
}

export interface CharacterAdvantagesDraft {
  selections: CharacterAdvantageSelectionDraft[]
}

export type CharacterAdvantageCategory =
  | 'merit'
  | 'background'
  | 'flaw'

export type CharacterAdvantageSelectionOrigin =
  | 'creation'
  | 'predatorType'
  | 'thinBlood'

/*
 * Configuración específica por instancia.
 *
 * Es una unión discriminada deliberadamente cerrada.
 * Cuando aparezca una familia con necesidades nuevas,
 * añadiremos un tipo explícito en vez de recurrir a
 * Record<string, unknown>.
 */

export interface AlliesAdvantageDetails {
  kind: 'allies'

  /*
   * Aliados es un Trasfondo compuesto.
   * Conservamos sus componentes en lugar de reducirlos
   * únicamente a una puntuación opaca.
   */
  effectiveness: number
  reliability: number

  /*
   * Texto identificativo mínimo de la instancia.
   * No contiene reglas ni descripción editorial.
   */
  identity?: string
}

export interface ContactAdvantageDetails {
  kind: 'contact'
  identity?: string
}

export interface RetainerAdvantageDetails {
  kind: 'retainer'
  identity?: string
}

export interface StatusAdvantageDetails {
  kind: 'status'
  sphere?: string
}

export interface FameAdvantageDetails {
  kind: 'fame'
  sphere?: string
}

export interface InfluenceAdvantageDetails {
  kind: 'influence'
  sphere?: string
}

export interface MaskAdvantageDetails {
  kind: 'mask'
  identity?: string
}

export interface MawlaAdvantageDetails {
  kind: 'mawla'
  identity?: string
}

export interface HerdAdvantageDetails {
  kind: 'herd'
  identity?: string
}

export interface ResourcesAdvantageDetails {
  kind: 'resources'
  source?: string
}

export interface HavenAdvantageDetails {
  kind: 'haven'
  identity?: string
}

export interface SubstanceUseAdvantageDetails {
  kind: 'substanceUse'

  /*
   * Sustancia concreta asociada al Mérito o Defecto.
   */
  substance: string

  /*
   * Adicto Funcional requiere además concretar
   * la categoría de reserva beneficiada.
   *
   * Se mantiene como texto tipado de dominio abierto
   * hasta que la UI defina su catálogo cerrado.
   */
  poolCategory?: string
}

export interface FolkloricBaneAdvantageDetails {
  kind: 'folkloricBane'

  /*
   * Fuente folclórica concreta que causa el daño.
   * Ejemplos del manual no constituyen una lista cerrada.
   */
  source: string
}

export interface FolkloricBlockAdvantageDetails {
  kind: 'folkloricBlock'

  /*
   * Tabú folclórico concreto de esta instancia.
   * Cada tabú se contabiliza independientemente.
   */
  taboo: string
}

export interface PreyExclusionAdvantageDetails {
  kind: 'preyExclusion'

  /*
   * Tipo concreto de presa que el personaje rehúsa.
   */
  excludedPrey: string
}

export interface LoresheetAdvantageDetails {
  kind: 'loresheet'

  /*
   * Ficha de Conocimientos a la que pertenece
   * la ventaja adquirida.
   */
  loresheetKey: string

  /*
   * Ventaja concreta adquirida dentro de la ficha.
   *
   * Su nivel determina el coste/puntuación
   * de esta selección.
   */
  benefitKey: string
}

export type CharacterAdvantageInstanceDetails =
  | AlliesAdvantageDetails
  | ContactAdvantageDetails
  | RetainerAdvantageDetails
  | StatusAdvantageDetails
  | FameAdvantageDetails
  | InfluenceAdvantageDetails
  | MaskAdvantageDetails
  | MawlaAdvantageDetails
  | HerdAdvantageDetails
  | ResourcesAdvantageDetails
  | HavenAdvantageDetails
  | SubstanceUseAdvantageDetails
  | PreyExclusionAdvantageDetails
  | FolkloricBaneAdvantageDetails
  | FolkloricBlockAdvantageDetails
  | LoresheetAdvantageDetails

export interface CharacterAdvantageSelectionDraft {
  /*
   * Identifica esta instancia concreta.
   */
  selectionId: string

  /*
   * Referencia estable a la definición del catálogo.
   */
  definitionKey: string

  category: CharacterAdvantageCategory
  rating: number
  origin: CharacterAdvantageSelectionOrigin

  /*
   * Permite asociar una selección a otra instancia concreta.
   *
   * Caso inicial:
   * Méritos/Defectos de Refugio vinculados a un Refugio.
   */
  parentSelectionId?: string

  /*
   * Configuración tipada opcional de la instancia.
   */
  details?: CharacterAdvantageInstanceDetails
}

export interface CharacterAdvantagesDraft {
  selections: CharacterAdvantageSelectionDraft[]
}

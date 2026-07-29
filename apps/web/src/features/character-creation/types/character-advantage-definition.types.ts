import type {
  CharacterAdvantageCategory,
  CharacterAdvantageSelectionOrigin,
} from './character-advantages-draft.types'

import type {
  CharacterAdvantageRequirement,
} from './character-advantage-requirements.types'

/*
 * Fuente normativa de la ventaja.
 *
 * Permite identificar el origen del contenido para poder
 * ampliar el catálogo con suplementos u otras fuentes
 * sin mezclar reglas de procedencia distinta.
 */
export type CharacterAdvantageSource =
  | 'core'
  | 'playersGuide'
  | 'bloodSigils'
  | 'other'

/*
 * Tipo de personaje al que puede aplicarse una ventaja.
 *
 * Permite restringir ventajas concretas según la naturaleza
 * del personaje.
 */
export type CharacterAdvantageCharacterKind =
  | 'standard'
  | 'caitiff'
  | 'thinBlood'

/*
 * Categoría narrativa de edad vampírica.
 *
 * No representa generación.
 * Edad y generación son conceptos separados dentro del dominio.
 */
export type CharacterAdvantageAgeCategory =
  | 'neonate'
  | 'ancilla'
  | 'elder'

export interface CharacterAdvantageRequirements {
  characterKinds?: CharacterAdvantageCharacterKind[]
  clanKeys?: string[]
  excludedClanKeys?: string[]
  requiredDefinitionKeys?: string[]

  /*
   * Categoría etaria mínima exigida por la definición.
   *
   * No se deduce de Generación: edad y generación son
   * conceptos distintos en el dominio.
   */
  minimumAgeCategory?: CharacterAdvantageAgeCategory
}

/*
 * Definición estática de una ventaja disponible en el catálogo.
 *
 * Representa la opción que puede escoger un personaje.
 * No representa una elección concreta realizada por un jugador.
 *
 * Las elecciones reales se almacenan mediante
 * CharacterAdvantageSelectionDraft.
 */
export interface CharacterAdvantageDefinition {
  /*
   * Identificador estable interno.
   *
   * No debe depender del texto mostrado al usuario,
   * ya que puede cambiar la traducción o presentación.
   */
  key: string

  /*
   * Nombre visible de la ventaja.
   */
  name: string

  /*
   * Categoría de la ventaja:
   * - mérito
   * - defecto
   * - trasfondo
   */
  category: CharacterAdvantageCategory

  /*
   * Puntuaciones legales para esta definición.
   * No asumimos que todas admitan automáticamente 1-5.
   */
  allowedRatings: readonly number[]

  source: CharacterAdvantageSource
  sourcePage?: number

  /*
   * Excepciones de puntuación ligadas al origen de
   * la selección.
   *
   * allowedRatings sigue representando la adquisición
   * ordinaria. Estas reglas permiten que un origen
   * concreto conceda una puntuación distinta sin
   * convertirla en comprable libremente.
   */
  originRatingConstraints?: readonly {
    origin: CharacterAdvantageSelectionOrigin
    allowedRatings: readonly number[]
  }[]

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
   * Ejemplos:
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
   *
   * Este listado crece de forma explícita cuando una nueva
   * familia de ventajas necesita datos propios.
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
    | 'preyExclusion'
    | 'folkloricBane'
    | 'folkloricBlock'
    | 'loresheet'
    | 'linguistics'
    | 'methuselahVisage'
    | 'famousFace'
    | 'childOfTheScene'

  /*
   * Una definición asociada necesita estar vinculada a
   * otra selección mediante parentSelectionId.
   *
   * Se usará inicialmente para elementos vinculados
   * a una instancia de Refugio.
   */
  requiresParentSelection?: boolean

  /**
   * Permite vincular opcionalmente esta ventaja
   * a una selección padre compatible.
   */
  allowsOptionalParentSelection?: boolean

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

  /*
   * Requisitos modernos evaluados por advantage-requirement-engine.
   *
   * Permite reglas como:
   * - generación máxima
   * - humanidad mínima
   * - clan requerido
   */
  requirementRules?: readonly CharacterAdvantageRequirement[]

  /*
   * Contrato histórico conservado durante la migración.
   */
  requirements?: CharacterAdvantageRequirements

  /*
   * Lista de ventajas incompatibles con esta definición.
   *
   * Permite impedir combinaciones contradictorias
   * dentro del mismo personaje.
   */
  incompatibleDefinitionKeys?: string[]
}
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

import type {
  DisciplineKey,
} from './discipline.types'

import type {
  DisciplinePowerKey,
} from './discipline-power.types'

export interface ClanCurseThinBloodTraitDetails {
  clanKey: ClanKey
}

export interface DisciplineAffinityThinBloodTraitDetails {
  /*
   * La validez normativa no depende únicamente de DisciplineKey:
   * el dominio debe comprobar que sea una Disciplina presente
   * entre las Disciplinas de clan de los 13 clanes.
   *
   * Esto excluye Alquimia de Sangre Débil sin duplicar
   * manualmente un segundo catálogo de Disciplinas.
   */
  disciplineKey: DisciplineKey

  /*
   * El jugador debe conservar la elección real del poder
   * adquirido con el punto inicial de Disciplina Afín.
   *
   * El rating NO se almacena: siempre se deriva como 1.
   */
  powerKey: DisciplinePowerKey
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

  /*
   * Configuración propia del Mérito Disciplina Afín.
   *
   * El punto concedido por el Mérito NO se almacena aquí
   * ni se introduce todavía en draft.disciplines.
   * Este contrato sólo registra la Disciplina elegida.
   */
  disciplineAffinityDetails?:
    DisciplineAffinityThinBloodTraitDetails
}

export interface CharacterThinBloodTraitsDraft {
  selections: ThinBloodTraitSelectionDraft[]
}

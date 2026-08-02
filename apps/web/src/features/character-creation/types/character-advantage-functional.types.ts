/*
 * SPEC-026 — Naturaleza funcional de Ventajas.
 *
 * Este contrato complementa el catálogo existente sin sustituirlo.
 * No introduce persistencia ni conecta todavía el creador con la ficha.
 */

export type CharacterAdvantageFunctionalType =
  | 'scalar'
  | 'entity'
  | 'location'
  | 'collection'
  | 'dependent'
  | 'fixed'

/*
 * La información narrativa pendiente no invalida por sí sola
 * una selección reglamentariamente correcta.
 */
export type CharacterAdvantageNarrativeCompletionStatus =
  | 'notApplicable'
  | 'pending'
  | 'complete'

export interface CharacterAdvantageNarrativeFields {
  customName?: string
  description?: string
  notes?: string
}

export interface CharacterAllyInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'allies'
  relationship?: string
  organization?: string
}

export interface CharacterContactInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'contact'
  relationship?: string
  organization?: string
}

export interface CharacterRetainerInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'retainer'
  relationship?: string
  role?: string
}

export interface CharacterStatusInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'status'
  organization?: string
}

export interface CharacterFameInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'fame'
  field?: string
}

export interface CharacterInfluenceInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'influence'
  sphere?: string
}

export interface CharacterMaskInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'mask'
  identityName?: string
  benefits: (
    | 'erased'
    | 'tailor'
  )[]
}

export interface CharacterMawlaInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'mawla'
  relationship?: string
}

export interface CharacterHerdInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'herd'
  groupName?: string
}

export interface CharacterResourcesInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'resources'
  sourceDescription?: string
}

export interface CharacterHavenInstanceData
  extends CharacterAdvantageNarrativeFields {
  kind: 'haven'
  locationName?: string
  locationDescription?: string
}

export type CharacterAdvantageSpecificData =
  | CharacterAllyInstanceData
  | CharacterContactInstanceData
  | CharacterRetainerInstanceData
  | CharacterStatusInstanceData
  | CharacterFameInstanceData
  | CharacterInfluenceInstanceData
  | CharacterMaskInstanceData
  | CharacterMawlaInstanceData
  | CharacterHerdInstanceData
  | CharacterResourcesInstanceData
  | CharacterHavenInstanceData

/*
 * Contrato mínimo común para trabajar con relaciones explícitas.
 *
 * Se mantiene estructural para que pueda utilizarse con el draft
 * actual sin obligar a migrar todas las selecciones de una vez.
 */
export interface CharacterAdvantageRelationalSelection {
  selectionId: string
  definitionKey: string
  parentSelectionId?: string
}

export interface CharacterAdvantageNarrativeState {
  status: CharacterAdvantageNarrativeCompletionStatus
  missingFields: string[]
}

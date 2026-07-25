/*
 * SPEC-026 — Motor de requisitos de Ventajas.
 *
 * Contratos puros de dominio.
 * No dependen de React, persistencia ni del asistente visual.
 */

export interface CharacterAdvantageRequirementSelection {
  definitionKey: string
  rating: number
}

export interface CharacterAdvantageRequirementContext {
  selections: readonly CharacterAdvantageRequirementSelection[]
  clanKey?: string
  predatorTypeKey?: string
  isThinBlood: boolean
  humanity?: number
  generation?: number
}

export interface CharacterAdvantageRequiredSelectionRequirement {
  type: 'advantage'
  definitionKey: string
  minRating?: number
}

export interface CharacterAdvantageClanRequirement {
  type: 'clan'
  allowedClanKeys: readonly string[]
}

export interface CharacterAdvantagePredatorTypeRequirement {
  type: 'predatorType'
  allowedPredatorTypeKeys: readonly string[]
}

export interface CharacterAdvantageThinBloodRequirement {
  type: 'thinBlood'
  expected: boolean
}

export interface CharacterAdvantageHumanityRequirement {
  type: 'humanity'
  min: number
}

export interface CharacterAdvantageGenerationRequirement {
  type: 'generation'
  max: number
}

export type CharacterAdvantageRequirement =
  | CharacterAdvantageRequiredSelectionRequirement
  | CharacterAdvantageClanRequirement
  | CharacterAdvantagePredatorTypeRequirement
  | CharacterAdvantageThinBloodRequirement
  | CharacterAdvantageHumanityRequirement
  | CharacterAdvantageGenerationRequirement

export type CharacterAdvantageRequirementFailureCode =
  | 'missingAdvantage'
  | 'insufficientAdvantageRating'
  | 'clanNotAllowed'
  | 'missingClan'
  | 'predatorTypeNotAllowed'
  | 'missingPredatorType'
  | 'thinBloodMismatch'
  | 'insufficientHumanity'
  | 'missingHumanity'
  | 'generationTooHigh'
  | 'missingGeneration'

export interface CharacterAdvantageRequirementFailure {
  requirement: CharacterAdvantageRequirement
  code: CharacterAdvantageRequirementFailureCode
}

export interface CharacterAdvantageRequirementEvaluation {
  satisfied: boolean
  failures: CharacterAdvantageRequirementFailure[]
}

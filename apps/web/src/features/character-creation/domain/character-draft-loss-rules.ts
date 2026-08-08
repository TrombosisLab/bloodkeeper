import {
  applyCharacterDraftUpdate,
} from './blood-sorcery-ritual-draft-rules.ts'

import {
  isPredatorTypePointDistributionSelection,
} from './predator-type-point-distribution-draft-rules.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CharacterDraftUpdateOptions,
  CharacterDraftUpdater,
} from './blood-sorcery-ritual-draft-rules.ts'

export type CharacterDraftLossKey =
  | 'predatorTypeChoices'
  | 'predatorTypeDistributions'
  | 'predatorTypeAdvantageDetails'
  | 'skillSpecialties'
  | 'disciplines'
  | 'disciplinePowers'
  | 'bloodSorceryRituals'
  | 'oblivionCeremonies'
  | 'thinBloodTraits'
  | 'thinBloodAlchemy'

export interface CharacterDraftLoss {
  key: CharacterDraftLossKey
  label: string
}

export interface CharacterDraftUpdatePreview {
  draft: CharacterDraft
  losses: CharacterDraftLoss[]
}

const lossLabels:
  Record<CharacterDraftLossKey, string> = {
    predatorTypeChoices:
      'Elecciones del Tipo de Depredador',
    predatorTypeDistributions:
      'Repartos de puntos del Tipo de Depredador',
    predatorTypeAdvantageDetails:
      'Detalles configurados en Ventajas del Tipo de Depredador',
    skillSpecialties:
      'Especialidades dependientes de Habilidades',
    disciplines:
      'Disciplinas seleccionadas',
    disciplinePowers:
      'Poderes de Disciplina seleccionados',
    bloodSorceryRituals:
      'Rituales de Hechicería de Sangre',
    oblivionCeremonies:
      'Ceremonias de Olvido',
    thinBloodTraits:
      'Méritos y Defectos de Sangre Débil',
    thinBloodAlchemy:
      'Configuración de Alquimia de Sangre Débil',
  }

function sameValue(
  left: unknown,
  right: unknown,
): boolean {
  return JSON.stringify(left) ===
    JSON.stringify(right)
}

function addLoss(
  losses: CharacterDraftLoss[],
  key: CharacterDraftLossKey,
): void {
  if (
    losses.some(
      loss => loss.key === key,
    )
  ) {
    return
  }

  losses.push({
    key,
    label: lossLabels[key],
  })
}

function hasMeaningfulDetails(
  value: unknown,
): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (typeof value === 'number') {
    return true
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.some(
      hasMeaningfulDetails,
    )
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    return Object.entries(
      value as Record<string, unknown>,
    ).some(
      ([key, child]) =>
        key !== 'kind' &&
        hasMeaningfulDetails(child),
    )
  }

  return false
}

function hasRemovedSpecialty(
  current: CharacterDraft,
  updated: CharacterDraft,
  normalized: CharacterDraft,
): boolean {
  const skillsChanged =
    !sameValue(
      current.skills,
      updated.skills,
    )

  if (!skillsChanged) {
    return false
  }

  const remainingIds =
    new Set(
      normalized.skillSpecialties.map(
        specialty => specialty.id,
      ),
    )

  return current.skillSpecialties.some(
    specialty =>
      specialty.origin !==
        'predatorType' &&
      !remainingIds.has(
        specialty.id,
      ),
  )
}

function collectNormalizedLosses(
  updated: CharacterDraft,
  normalized: CharacterDraft,
  losses: CharacterDraftLoss[],
): void {
  const normalizedSpecialtyIds =
    new Set(
      normalized.skillSpecialties.map(
        specialty => specialty.id,
      ),
    )

  if (
    updated.skillSpecialties.some(
      specialty =>
        specialty.origin !==
          'predatorType' &&
        !normalizedSpecialtyIds.has(
          specialty.id,
        ),
    )
  ) {
    addLoss(
      losses,
      'skillSpecialties',
    )
  }

  const normalizedDisciplines =
    new Map(
      normalized.disciplines.map(
        discipline => [
          [
            discipline.key,
            discipline.origin ??
              'creation',
          ].join(':'),
          discipline,
        ],
      ),
    )

  for (
    const discipline of
      updated.disciplines
  ) {
    const key = [
      discipline.key,
      discipline.origin ??
        'creation',
    ].join(':')

    const remaining =
      normalizedDisciplines.get(key)

    if (remaining === undefined) {
      if (
        discipline.origin !==
          'predatorType'
      ) {
        addLoss(
          losses,
          'disciplines',
        )
      }

      if (
        discipline.powerKeys.length > 0
      ) {
        addLoss(
          losses,
          'disciplinePowers',
        )
      }

      continue
    }

    if (
      discipline.powerKeys.some(
        powerKey =>
          !remaining.powerKeys.includes(
            powerKey,
          ),
      )
    ) {
      addLoss(
        losses,
        'disciplinePowers',
      )
    }
  }

  if (
    updated.bloodSorceryRituals
      .ritualKeys.some(
        ritualKey =>
          !normalized
            .bloodSorceryRituals
            .ritualKeys.includes(
              ritualKey,
            ),
      )
  ) {
    addLoss(
      losses,
      'bloodSorceryRituals',
    )
  }

  if (
    updated.oblivionCeremonies
      .ceremonyKeys.some(
        ceremonyKey =>
          !normalized
            .oblivionCeremonies
            .ceremonyKeys.includes(
              ceremonyKey,
            ),
      )
  ) {
    addLoss(
      losses,
      'oblivionCeremonies',
    )
  }

  const normalizedThinBloodTraits =
    normalized.thinBloodTraits
      .selections

  if (
    updated.thinBloodTraits
      .selections.some(
        selection =>
          !normalizedThinBloodTraits
            .some(
              remaining =>
                sameValue(
                  remaining,
                  selection,
                ),
            ),
      )
  ) {
    addLoss(
      losses,
      'thinBloodTraits',
    )
  }

  const alchemyHasInformation =
    updated.thinBloodAlchemy
      .rating > 0 ||
    updated.thinBloodAlchemy
      .method !== null ||
    updated.thinBloodAlchemy
      .formulaKeys.length > 0

  if (
    alchemyHasInformation &&
    !sameValue(
      updated.thinBloodAlchemy,
      normalized.thinBloodAlchemy,
    )
  ) {
    addLoss(
      losses,
      'thinBloodAlchemy',
    )
  }

  const normalizedAdvantages =
    new Map(
      normalized.advantages
        .selections.map(
          selection => [
            selection.selectionId,
            selection,
          ],
        ),
    )

  const predatorDistributions =
    updated.advantages.selections
      .filter(
        selection =>
          isPredatorTypePointDistributionSelection(
            selection,
          ),
      )

  if (
    predatorDistributions.some(
      selection =>
        !sameValue(
          normalizedAdvantages.get(
            selection.selectionId,
          ),
          selection,
        ),
    )
  ) {
    addLoss(
      losses,
      'predatorTypeDistributions',
    )
  }

  const configuredPredatorAdvantages =
    updated.advantages.selections
      .filter(
        selection =>
          selection.origin ===
            'predatorType' &&
          selection.details !==
            undefined &&
          hasMeaningfulDetails(
            selection.details,
          ),
      )

  if (
    configuredPredatorAdvantages.some(
      selection =>
        !sameValue(
          normalizedAdvantages.get(
            selection.selectionId,
          ),
          selection,
        ),
    )
  ) {
    addLoss(
      losses,
      'predatorTypeAdvantageDetails',
    )
  }
}

export function detectCharacterDraftLosses(
  current: CharacterDraft,
  updated: CharacterDraft,
  normalized: CharacterDraft,
): CharacterDraftLoss[] {
  const losses:
    CharacterDraftLoss[] = []

  const identityContextChanged =
    current.identity.clan !==
      updated.identity.clan ||
    current.identity.predatorType !==
      updated.identity.predatorType

  if (
    identityContextChanged &&
    Object.keys(
      current.predatorTypeChoices ??
        {},
    ).length > 0 &&
    !sameValue(
      current.predatorTypeChoices ??
        {},
      normalized.predatorTypeChoices ??
        {},
    )
  ) {
    addLoss(
      losses,
      'predatorTypeChoices',
    )
  }

  if (
    hasRemovedSpecialty(
      current,
      updated,
      normalized,
    )
  ) {
    addLoss(
      losses,
      'skillSpecialties',
    )
  }

  collectNormalizedLosses(
    updated,
    normalized,
    losses,
  )

  return losses
}

/*
 * Previsualiza una actualización completa del borrador:
 *
 * 1. aplica la intención de la UI sin mutar el estado actual;
 * 2. ejecuta el coordinador canónico de normalización;
 * 3. compara ambos estados para detectar únicamente información
 *    que se perdería como consecuencia de dependencias.
 *
 * Las eliminaciones explícitas realizadas directamente por el
 * usuario no generan confirmación por sí mismas.
 */
export function previewCharacterDraftUpdate(
  current: CharacterDraft,
  updater: CharacterDraftUpdater,
  options: CharacterDraftUpdateOptions = {},
): CharacterDraftUpdatePreview {
  const updated =
    updater(current)

  const normalized =
    applyCharacterDraftUpdate(
      current,
      () => updated,
      options,
    )

  return {
    draft: normalized,
    losses:
      detectCharacterDraftLosses(
        current,
        updated,
        normalized,
      ),
  }
}

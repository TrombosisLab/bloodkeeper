import {
  characterBloodResonanceCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesDisciplineKey,
} from '@v5r/character-rules'

import type {
  PersistedCharacterBloodResonanceOperation,
} from './character-blood-resonance.types'

import type {
  CharacterAdvancementPreview,
  CharacterAdvancementRequest,
} from './character-advancement.types'

export const CHARACTER_DISCIPLINE_RESONANCE_EVIDENCE_REQUIRED =
  'DISCIPLINE_RESONANCE_EVIDENCE_REQUIRED'

export type CharacterDisciplineResonanceEvidenceStatus =
  | 'matched'
  | 'missing'
  | 'compatibilityUnverified'

export interface CharacterDisciplineResonanceEvidence {
  readonly operationId: string
  readonly disciplineKey:
    CharacterRulesDisciplineKey
  readonly sourceKind:
    PersistedCharacterBloodResonanceOperation['sourceKind']
  readonly resonanceKey:
    PersistedCharacterBloodResonanceOperation['resonanceKey']
  readonly specialAffinityKey:
    PersistedCharacterBloodResonanceOperation['specialAffinityKey']
  readonly temperament:
    PersistedCharacterBloodResonanceOperation['temperament']
  readonly acquiredAt: Date
}

export type CharacterDisciplineResonanceEvidenceAssessment =
  | {
      readonly status: 'matched'
      readonly evidence:
        CharacterDisciplineResonanceEvidence
    }
  | {
      readonly status: 'missing'
      readonly evidence: null
    }
  | {
      readonly status:
        'compatibilityUnverified'
      readonly evidence: null
    }

function operationDisciplineKeys(
  operation:
    PersistedCharacterBloodResonanceOperation,
): readonly CharacterRulesDisciplineKey[] {
  if (operation.resonanceKey !== null) {
    return (
      characterBloodResonanceCatalog
        .resonances
        .find(
          ({ key }) =>
            key === operation.resonanceKey,
        )
        ?.disciplineKeys ?? []
    )
  }

  if (
    operation.specialAffinityKey !== null
  ) {
    return (
      characterBloodResonanceCatalog
        .specialAffinities
        .find(
          ({ key }) =>
            key ===
            operation.specialAffinityKey,
        )
        ?.disciplineKeys ?? []
    )
  }

  return []
}

export function assessCharacterDisciplineResonanceEvidence(
  operations:
    readonly PersistedCharacterBloodResonanceOperation[],
  disciplineKey:
    CharacterRulesDisciplineKey,
): CharacterDisciplineResonanceEvidenceAssessment {
  if (operations.length === 0) {
    return {
      status: 'compatibilityUnverified',
      evidence: null,
    }
  }

  const matching = operations
    .filter((operation) =>
      operationDisciplineKeys(
        operation,
      ).includes(disciplineKey),
    )
    .sort(
      (left, right) =>
        right.createdAt.getTime() -
          left.createdAt.getTime() ||
        right.operationId.localeCompare(
          left.operationId,
        ),
    )[0]

  if (matching === undefined) {
    return {
      status: 'missing',
      evidence: null,
    }
  }

  return {
    status: 'matched',
    evidence: {
      operationId: matching.operationId,
      disciplineKey,
      sourceKind: matching.sourceKind,
      resonanceKey: matching.resonanceKey,
      specialAffinityKey:
        matching.specialAffinityKey,
      temperament: matching.temperament,
      acquiredAt: matching.createdAt,
    },
  }
}

function outOfClanBloodRequirementMessage(
  preview: CharacterAdvancementPreview,
): string | null {
  if (
    preview.currentRating !== 0 ||
    !preview.consequences.includes(
      'discipline_cost_class:other',
    )
  ) {
    return null
  }

  return (
    'Aprender una Disciplina nueva fuera de Clan requiere además ' +
    'probar sangre de alguien que posea esa Disciplina; ' +
    'BloodKeeper todavía no dispone de un donante verificable para automatizarlo.'
  )
}

export function applyCharacterDisciplineResonanceEvidence(
  preview: CharacterAdvancementPreview,
  request: CharacterAdvancementRequest,
  operations:
    readonly PersistedCharacterBloodResonanceOperation[],
): CharacterAdvancementPreview {
  if (request.kind !== 'discipline') {
    return preview
  }

  const assessment =
    assessCharacterDisciplineResonanceEvidence(
      operations,
      request.disciplineKey as
        CharacterRulesDisciplineKey,
    )

  const outOfClanMessage =
    outOfClanBloodRequirementMessage(
      preview,
    )

  const consequences = [
    ...preview.consequences,
    ...(outOfClanMessage === null
      ? []
      : [outOfClanMessage]),
  ]

  if (
    assessment.status ===
    'compatibilityUnverified'
  ) {
    return {
      ...preview,
      consequences: [
        ...consequences,
        (
          'No existe historial estructurado de Resonancia para este personaje; ' +
          'se mantiene compatibilidad y la justificación queda explícitamente a criterio del Narrador.'
        ),
      ],
    }
  }

  if (assessment.status === 'missing') {
    return {
      ...preview,
      eligible: false,
      issues: [
        ...preview.issues,
        {
          code:
            CHARACTER_DISCIPLINE_RESONANCE_EVIDENCE_REQUIRED,
          message:
            'No consta una alimentación con Resonancia o afinidad asociada a esta Disciplina.',
        },
      ],
      consequences,
    }
  }

  return {
    ...preview,
    consequences: [
      ...consequences,
      'Evidencia de Resonancia acreditada mediante una alimentación registrada.',
    ],
  }
}

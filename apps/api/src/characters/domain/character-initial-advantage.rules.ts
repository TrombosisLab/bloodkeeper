import {
  isDeepStrictEqual,
} from 'node:util'

import {
  createCharacterAdvantageValidationContributor,
} from './character-advantage-validation.contributor'

import {
  characterRulesCatalog,
} from './character-rules-catalog'

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
  CharacterValidationIssue,
} from './character-validation.types'

import type {
  PersistedCharacterAdvantageSelection,
  PersistedCharacterAdvantages,
  PersistedCharacterDraft,
} from './persisted-character.types'

export interface InitialAdvantageReview {
  readonly required: boolean
  readonly issues:
    readonly CharacterValidationIssue[]
  readonly replaceableSelectionIds:
    readonly string[]
}

function creationSelections(
  character: PersistedCharacterDraft,
): readonly PersistedCharacterAdvantageSelection[] {
  return character.advantages.selections.filter(
    ({ origin }) => origin === 'creation',
  )
}

function affectedSelectionIds(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  issues:
    readonly CharacterValidationIssue[],
): readonly string[] {
  const ids = new Set<string>()
  const byDefinition = new Map<
    string,
    PersistedCharacterAdvantageSelection[]
  >()

  for (const selection of selections) {
    const list =
      byDefinition.get(
        selection.definitionKey,
      ) ?? []
    list.push(selection)
    byDefinition.set(
      selection.definitionKey,
      list,
    )
  }

  for (const item of issues) {
    const details = item.details ?? {}

    const selectionId =
      details.selectionId

    if (typeof selectionId === 'string') {
      ids.add(selectionId)
    }

    for (const key of [
      'definitionKey',
      'incompatibleDefinitionKey',
    ] as const) {
      const definitionKey =
        details[key]

      if (
        typeof definitionKey === 'string'
      ) {
        for (
          const selection of
            byDefinition.get(
              definitionKey,
            ) ?? []
        ) {
          ids.add(selection.selectionId)
        }
      }
    }

    const loresheetKey =
      details.loresheetKey

    if (
      typeof loresheetKey === 'string'
    ) {
      for (const selection of selections) {
        if (
          selection.details?.kind ===
            'loresheet' &&
          selection.details.loresheetKey ===
            loresheetKey
        ) {
          ids.add(selection.selectionId)
        }
      }
    }
  }

  return [...ids].sort()
}

export function analyzeInitialAdvantageReview(
  character: PersistedCharacterDraft,
  catalog:
    CharacterRulesCatalog =
      characterRulesCatalog,
): InitialAdvantageReview {
  const selections =
    creationSelections(character)

  const reviewCharacter = {
    ...character,
    advantages: {
      selections: [...selections],
    },
  }

  const section =
    createCharacterAdvantageValidationContributor(
      catalog,
    ).validate(
      reviewCharacter,
      'activation',
    )[0]

  if (section === undefined) {
    throw new Error(
      'Advantage validator returned no section',
    )
  }

  return {
    required: section.issues.length > 0,
    issues: [...section.issues],
    replaceableSelectionIds:
      affectedSelectionIds(
        selections,
        section.issues,
      ),
  }
}

export function validateInitialAdvantageReplacement(
  character: PersistedCharacterDraft,
  advantages: PersistedCharacterAdvantages,
  catalog:
    CharacterRulesCatalog =
      characterRulesCatalog,
): readonly CharacterValidationIssue[] {
  if (
    advantages.selections.some(
      ({ origin }) => origin !== 'creation',
    )
  ) {
    return [
      {
        code:
          'CHARACTER_INITIAL_ADVANTAGE_REVIEW_CREATION_ONLY',
        severity: 'error',
        section: 'advantages',
        field: 'advantages',
        message:
          'La revisión inicial sólo puede sustituir selecciones del presupuesto de creación.',
      },
    ]
  }

  const current =
    creationSelections(character)

  const review =
    analyzeInitialAdvantageReview(
      character,
      catalog,
    )

  const replaceable =
    new Set(
      review.replaceableSelectionIds,
    )

  for (const selection of current) {
    if (
      replaceable.has(
        selection.selectionId,
      )
    ) {
      continue
    }

    const candidate =
      advantages.selections.find(
        ({ selectionId }) =>
          selectionId ===
          selection.selectionId,
      )

    if (
      candidate === undefined ||
      !isDeepStrictEqual(
        candidate,
        selection,
      )
    ) {
      return [
        {
          code:
            'CHARACTER_INITIAL_ADVANTAGE_VALID_SELECTION_MUST_BE_PRESERVED',
          severity: 'error',
          section: 'advantages',
          field: 'advantages',
          message:
            'Las Ventajas y Defectos que siguen siendo válidos tras el Abrazo deben conservarse.',
          details: {
            selectionId:
              selection.selectionId,
          },
        },
      ]
    }
  }

  const candidateCharacter = {
    ...character,
    advantages: {
      selections: [
        ...advantages.selections,
      ],
    },
  }

  const section =
    createCharacterAdvantageValidationContributor(
      catalog,
    ).validate(
      candidateCharacter,
      'activation',
    )[0]

  if (section === undefined) {
    throw new Error(
      'Advantage validator returned no section',
    )
  }

  return [...section.issues]
}

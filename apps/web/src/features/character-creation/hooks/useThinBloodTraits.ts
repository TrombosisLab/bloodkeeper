import { useMemo } from 'react'

import {
  validateThinBloodTraitSelection,
  validateThinBloodTraitsForCharacterKind,
} from '../domain/thin-blood-trait-rules'

import type {
  CharacterThinBloodTraitsDraft,
  DisciplineAffinityThinBloodTraitDetails,
  ThinBloodTraitSelectionDraft,
} from '../types/thin-blood-trait.types'

type ThinBloodCharacterKind =
  | 'clan'
  | 'thinBlood'

interface UseThinBloodTraitsOptions {
  value: CharacterThinBloodTraitsDraft

  onChange: (
    value: CharacterThinBloodTraitsDraft,
  ) => void

  meritKeys: readonly string[]
  flawKeys: readonly string[]

  characterKind: ThinBloodCharacterKind
}

export interface UseThinBloodTraitsResult {
  totalCount: number
  meritCount: number
  flawCount: number

  valid: boolean
  errors: readonly string[]

  isSelected: (
    definitionKey: string,
  ) => boolean

  toggle: (
    definitionKey: string,
  ) => void

  getDisciplineAffinityDetails: () =>
    DisciplineAffinityThinBloodTraitDetails | null

  setDisciplineAffinityDetails: (
    details:
      | DisciplineAffinityThinBloodTraitDetails
      | null,
  ) => void
}

function removeDisciplineAffinityDetails(
  selection: ThinBloodTraitSelectionDraft,
): ThinBloodTraitSelectionDraft {
  const {
    disciplineAffinityDetails: _removed,
    ...selectionWithoutDetails
  } = selection

  return selectionWithoutDetails
}

export function useThinBloodTraits({
  value,
  onChange,
  meritKeys,
  flawKeys,
  characterKind,
}: UseThinBloodTraitsOptions): UseThinBloodTraitsResult {
  const selectedKeys = useMemo(
    () =>
      new Set(
        value.selections.map(
          (selection) =>
            selection.definitionKey,
        ),
      ),
    [value.selections],
  )

  const meritKeySet = useMemo(
    () => new Set(meritKeys),
    [meritKeys],
  )

  const flawKeySet = useMemo(
    () => new Set(flawKeys),
    [flawKeys],
  )

  const meritCount = useMemo(
    () =>
      value.selections.filter(
        (selection) =>
          meritKeySet.has(
            selection.definitionKey,
          ),
      ).length,
    [value.selections, meritKeySet],
  )

  const flawCount = useMemo(
    () =>
      value.selections.filter(
        (selection) =>
          flawKeySet.has(
            selection.definitionKey,
          ),
      ).length,
    [value.selections, flawKeySet],
  )

  const structuralValidation = useMemo(
    () =>
      validateThinBloodTraitSelection(
        value,
      ),
    [value],
  )

  const characterValidation = useMemo(
    () =>
      validateThinBloodTraitsForCharacterKind(
        value,
        characterKind,
      ),
    [value, characterKind],
  )

  const errors = useMemo(
    () =>
      Array.from(
        new Set([
          ...structuralValidation.errors,
          ...characterValidation.errors,
        ]),
      ),
    [
      structuralValidation.errors,
      characterValidation.errors,
    ],
  )

  function isSelected(
    definitionKey: string,
  ): boolean {
    return selectedKeys.has(definitionKey)
  }

  function toggle(
    definitionKey: string,
  ): void {
    if (selectedKeys.has(definitionKey)) {
      onChange({
        ...value,
        selections:
          value.selections.filter(
            (selection) =>
              selection.definitionKey !==
              definitionKey,
          ),
      })

      return
    }

    onChange({
      ...value,
      selections: [
        ...value.selections,
        {
          definitionKey,
        },
      ],
    })
  }

  function getDisciplineAffinityDetails():
    DisciplineAffinityThinBloodTraitDetails | null {
    const selection =
      value.selections.find(
        (candidate) =>
          candidate.definitionKey ===
          'discipline-affinity',
      )

    return (
      selection?.disciplineAffinityDetails ??
      null
    )
  }

  function setDisciplineAffinityDetails(
    details:
      | DisciplineAffinityThinBloodTraitDetails
      | null,
  ): void {
    if (
      !selectedKeys.has(
        'discipline-affinity',
      )
    ) {
      return
    }

    onChange({
      ...value,
      selections:
        value.selections.map(
          (selection) => {
            if (
              selection.definitionKey !==
              'discipline-affinity'
            ) {
              return selection
            }

            if (details === null) {
              return removeDisciplineAffinityDetails(
                selection,
              )
            }

            return {
              ...selection,
              disciplineAffinityDetails:
                details,
            }
          },
        ),
    })
  }

  return {
    totalCount: value.selections.length,
    meritCount,
    flawCount,

    valid:
      structuralValidation.valid &&
      characterValidation.valid,

    errors,

    isSelected,
    toggle,

    getDisciplineAffinityDetails,
    setDisciplineAffinityDetails,
  }
}

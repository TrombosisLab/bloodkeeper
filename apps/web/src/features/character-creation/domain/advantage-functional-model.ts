import type {
  CharacterAdvantageFunctionalType,
  CharacterAdvantageNarrativeState,
  CharacterAdvantageRelationalSelection,
} from '../types/character-advantage-functional.types'

/*
 * Entrada estructural mínima.
 *
 * Coincide con los campos ya presentes en
 * CharacterAdvantageDefinition sin acoplar este módulo
 * a toda la validación reglamentaria existente.
 */
export interface CharacterAdvantageFunctionalDefinition {
  key: string
  requiresParentSelection?: boolean
  requiresInstanceDetails?: boolean
  instanceDetailsKind?: string
}

const collectionKinds = new Set([
  'allies',
  'contact',
  'retainer',
  'herd',
])

const entityKinds = new Set([
  'status',
  'fame',
  'influence',
  'mask',
  'mawla',
  'haven',
])

const scalarKinds = new Set([
  'resources',
])

export function getCharacterAdvantageFunctionalType(
  definition: CharacterAdvantageFunctionalDefinition,
): CharacterAdvantageFunctionalType {
  if (definition.requiresParentSelection === true) {
    return 'dependent'
  }

  const kind = definition.instanceDetailsKind

  if (kind && collectionKinds.has(kind)) {
    return 'collection'
  }

  if (kind && entityKinds.has(kind)) {
    return 'entity'
  }

  if (kind && scalarKinds.has(kind)) {
    return 'scalar'
  }

  return 'fixed'
}

function hasNarrativeValue(
  value: unknown,
): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (Array.isArray(value)) {
    return value.some(hasNarrativeValue)
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    return Object.entries(value).some(
      ([key, nestedValue]) =>
        key !== 'kind' &&
        hasNarrativeValue(nestedValue),
    )
  }

  return false
}

/*
 * La ausencia de datos narrativos produce "pending".
 * No produce un error reglamentario ni bloquea por sí misma
 * el paso del creador.
 */
export function getCharacterAdvantageNarrativeState(
  definition: CharacterAdvantageFunctionalDefinition,
  specificData: unknown,
): CharacterAdvantageNarrativeState {
  if (definition.requiresInstanceDetails !== true) {
    return {
      status: 'notApplicable',
      missingFields: [],
    }
  }

  if (hasNarrativeValue(specificData)) {
    return {
      status: 'complete',
      missingFields: [],
    }
  }

  return {
    status: 'pending',
    missingFields: [
      'instanceDetails',
    ],
  }
}

export function getCharacterAdvantageChildSelections<
  TSelection extends CharacterAdvantageRelationalSelection,
>(
  parentSelectionId: string,
  selections: readonly TSelection[],
): TSelection[] {
  return selections.filter(
    (selection) =>
      selection.parentSelectionId ===
      parentSelectionId,
  )
}

export function getCharacterAdvantageParentSelection<
  TSelection extends CharacterAdvantageRelationalSelection,
>(
  selection: TSelection,
  selections: readonly TSelection[],
): TSelection | undefined {
  if (!selection.parentSelectionId) {
    return undefined
  }

  return selections.find(
    (candidate) =>
      candidate.selectionId ===
      selection.parentSelectionId,
  )
}

export function hasExplicitCharacterAdvantageParent<
  TSelection extends CharacterAdvantageRelationalSelection,
>(
  selection: TSelection,
  selections: readonly TSelection[],
): boolean {
  return (
    getCharacterAdvantageParentSelection(
      selection,
      selections,
    ) !== undefined
  )
}

/*
 * Al retirar un padre, devuelve también sus descendientes.
 * No modifica el array recibido.
 */
export function collectCharacterAdvantageSelectionTreeIds<
  TSelection extends CharacterAdvantageRelationalSelection,
>(
  rootSelectionId: string,
  selections: readonly TSelection[],
): string[] {
  const collected = new Set<string>()

  const visit = (
    selectionId: string,
  ): void => {
    if (collected.has(selectionId)) {
      return
    }

    collected.add(selectionId)

    for (
      const child of
      getCharacterAdvantageChildSelections(
        selectionId,
        selections,
      )
    ) {
      visit(child.selectionId)
    }
  }

  visit(rootSelectionId)

  return [...collected]
}

export function removeCharacterAdvantageSelectionTree<
  TSelection extends CharacterAdvantageRelationalSelection,
>(
  rootSelectionId: string,
  selections: readonly TSelection[],
): TSelection[] {
  const removedIds = new Set(
    collectCharacterAdvantageSelectionTreeIds(
      rootSelectionId,
      selections,
    ),
  )

  return selections.filter(
    (selection) =>
      !removedIds.has(selection.selectionId),
  )
}

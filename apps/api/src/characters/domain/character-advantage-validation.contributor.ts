import {
  characterMortalAdvantageExclusionCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesAdvantageCatalog,
  CharacterRulesAdvantageDefinition,
  CharacterRulesLoresheetDefinition,
} from '@v5r/character-rules'

import {
  characterRulesCatalog,
} from './character-rules-catalog'

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
  CharacterAdvantageSelectionOrigin,
  PersistedCharacterAdvantageSelection,
  PersistedCharacterDraft,
} from './persisted-character.types'

import type {
  CharacterValidationContributor,
} from './character-validator'

import type {
  CharacterSectionValidation,
  CharacterValidationContext,
  CharacterValidationIssue,
  CharacterValidationSeverity,
} from './character-validation.types'

interface AdvantageCatalogIndex {
  readonly definitions: ReadonlyMap<
    string,
    CharacterRulesAdvantageDefinition
  >

  readonly loresheets: ReadonlyMap<
    string,
    CharacterRulesLoresheetDefinition
  >
}

function issue(
  code: string,
  severity: CharacterValidationSeverity,
  field: string | null,
  message: string,
  details?: Readonly<
    Record<string, string | number | boolean | null>
  >,
): CharacterValidationIssue {
  return {
    code,
    severity,
    section: 'advantages',
    field,
    message,
    details,
  }
}

function errorIssue(
  code: string,
  field: string | null,
  message: string,
  details?: Readonly<
    Record<string, string | number | boolean | null>
  >,
): CharacterValidationIssue {
  return issue(
    code,
    'error',
    field,
    message,
    details,
  )
}

function duplicateValues(
  values: readonly string[],
): string[] {
  const seen = new Set<string>()
  const duplicated = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicated.add(value)
    seen.add(value)
  }

  return [...duplicated]
}

function sectionResult(
  issues: readonly CharacterValidationIssue[],
): CharacterSectionValidation {
  if (
    issues.some(
      ({ severity }) => severity === 'error',
    )
  ) {
    return {
      section: 'advantages',
      state: 'invalid',
      issues,
    }
  }

  if (issues.length > 0) {
    return {
      section: 'advantages',
      state: 'pending',
      issues,
    }
  }

  return {
    section: 'advantages',
    state: 'complete',
    issues: [],
  }
}

function completionSeverity(
  context: CharacterValidationContext,
): CharacterValidationSeverity {
  return context === 'draftSave'
    ? 'warning'
    : 'error'
}

function validatesCreationBudget(
  context: CharacterValidationContext,
): boolean {
  return (
    context === 'draftSave' ||
    context === 'activation'
  )
}

function buildCatalogIndex(
  catalog: CharacterRulesAdvantageCatalog,
): AdvantageCatalogIndex {
  const definitions = new Map<
    string,
    CharacterRulesAdvantageDefinition
  >()

  for (const definition of catalog.definitions) {
    if (definitions.has(definition.key)) {
      throw new Error(
        `Duplicate advantage definition: ${definition.key}`,
      )
    }

    definitions.set(definition.key, definition)
  }

  const loresheets = new Map<
    string,
    CharacterRulesLoresheetDefinition
  >()

  for (const definition of catalog.loresheets) {
    if (loresheets.has(definition.key)) {
      throw new Error(
        `Duplicate loresheet definition: ${definition.key}`,
      )
    }

    loresheets.set(
      definition.key,
      definition,
    )
  }

  return Object.freeze({
    definitions,
    loresheets,
  })
}

function validateStructure(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []

  for (const selectionId of duplicateValues(
    selections.map(
      (selection) => selection.selectionId,
    ),
  )) {
    issues.push(
      errorIssue(
        'CHARACTER_ADVANTAGE_SELECTION_ID_DUPLICATE',
        'advantages',
        'Las selecciones deben tener identificadores unicos.',
        { selectionId },
      ),
    )
  }

  for (const selection of selections) {
    if (selection.selectionId.trim().length === 0) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_SELECTION_ID_REQUIRED',
          'advantages',
          'Toda seleccion necesita un identificador.',
        ),
      )
    }

    if (selection.definitionKey.trim().length === 0) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_DEFINITION_KEY_REQUIRED',
          'advantages',
          'Toda seleccion debe referenciar una definicion.',
          { selectionId: selection.selectionId },
        ),
      )
    }

    if (
      !Number.isInteger(selection.rating) ||
      selection.rating < 1 ||
      selection.rating > 7
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_RATING_OUT_OF_RANGE',
          'advantages',
          'La puntuacion debe ser un entero entre 1 y 7.',
          {
            selectionId: selection.selectionId,
            rating: selection.rating,
          },
        ),
      )
    }
  }

  return issues
}

function validateParentRelations(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const byId = new Map(
    selections.map(
      (selection) => [
        selection.selectionId,
        selection,
      ] as const,
    ),
  )

  for (const selection of selections) {
    const parentId = selection.parentSelectionId

    if (parentId === null) continue

    if (parentId === selection.selectionId) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_SELF_PARENT',
          'advantages',
          'Una seleccion no puede ser su propio padre.',
          { selectionId: selection.selectionId },
        ),
      )
      continue
    }

    if (!byId.has(parentId)) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_PARENT_NOT_FOUND',
          'advantages',
          'La seleccion padre no existe.',
          {
            selectionId: selection.selectionId,
            parentSelectionId: parentId,
          },
        ),
      )
      continue
    }

    const visited = new Set([
      selection.selectionId,
    ])
    let candidateId: string | null = parentId

    while (candidateId !== null) {
      if (visited.has(candidateId)) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_PARENT_CYCLE',
            'advantages',
            'Las relaciones padre no pueden formar ciclos.',
            { selectionId: selection.selectionId },
          ),
        )
        break
      }

      visited.add(candidateId)
      candidateId =
        byId.get(candidateId)
          ?.parentSelectionId ?? null
    }
  }

  return issues
}

function validateDetails(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []

  for (const selection of selections) {
    const details = selection.details
    if (details === null) continue

    const detailsIssue = (
      code: string,
      message: string,
    ): void => {
      issues.push(
        errorIssue(
          code,
          'advantages',
          message,
          { selectionId: selection.selectionId },
        ),
      )
    }

    switch (details.kind) {
      case 'allies':
        if (
          !Number.isInteger(details.effectiveness) ||
          details.effectiveness < 1 ||
          details.effectiveness > 4 ||
          !Number.isInteger(details.reliability) ||
          details.reliability < 1 ||
          details.reliability > 3 ||
          details.effectiveness +
              details.reliability !==
            selection.rating
        ) {
          detailsIssue(
            'CHARACTER_ALLIES_DETAILS_INVALID',
            'Aliados requiere Efectividad, Fiabilidad y puntuacion coherentes.',
          )
        }
        break
      case 'mask':
        if (
          duplicateValues(details.benefits).length > 0
        ) {
          detailsIssue(
            'CHARACTER_MASK_BENEFIT_DUPLICATE',
            'Los beneficios de Mascara no pueden repetirse.',
          )
        }
        break
      case 'linguistics':
        if (
          details.languages.some(
            (language) =>
              language.trim().length === 0,
          ) ||
          duplicateValues(
            details.languages.map((language) =>
              language.trim().toLocaleLowerCase(),
            ),
          ).length > 0
        ) {
          detailsIssue(
            'CHARACTER_LINGUISTICS_DETAILS_INVALID',
            'Los idiomas deben ser unicos y no pueden estar vacios.',
          )
        }
        break
      case 'folkloricBane':
        if (details.source.trim().length === 0) {
          detailsIssue(
            'CHARACTER_FOLKLORIC_BANE_SOURCE_REQUIRED',
            'El Defecto folclorico necesita una fuente.',
          )
        }
        break
      case 'folkloricBlock':
        if (details.taboo.trim().length === 0) {
          detailsIssue(
            'CHARACTER_FOLKLORIC_BLOCK_TABOO_REQUIRED',
            'El Bloqueo folclorico necesita un tabu.',
          )
        }
        break
      case 'preyExclusion':
        if (details.excludedPrey.trim().length === 0) {
          detailsIssue(
            'CHARACTER_PREY_EXCLUSION_REQUIRED',
            'La exclusion de presa debe estar definida.',
          )
        }
        break
      case 'substanceUse':
        if (details.substance.trim().length === 0) {
          detailsIssue(
            'CHARACTER_SUBSTANCE_REQUIRED',
            'El consumo de sustancia debe identificarla.',
          )
        }
        break
      case 'loresheet':
        if (
          details.loresheetKey.trim().length === 0 ||
          details.benefitKey.trim().length === 0
        ) {
          detailsIssue(
            'CHARACTER_LORESHEET_REFERENCE_REQUIRED',
            'La Ficha de Conocimientos necesita referencias completas.',
          )
        }
        break
      default:
        break
    }
  }

  return issues
}

function allowedRatingsFor(
  definition: CharacterRulesAdvantageDefinition,
  origin: CharacterAdvantageSelectionOrigin,
  context: CharacterValidationContext,
): readonly number[] {
  if (context === 'evolution' || origin === 'evolution') {
    return definition.allowedRatings
  }

  return (
    definition.originRatingConstraints?.find(
      (constraint) => constraint.origin === origin,
    )?.allowedRatings ?? definition.allowedRatings
  )
}

function validateCatalogSelections(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
  index: AdvantageCatalogIndex,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const bySelectionId = new Map(
    selections.map(
      (selection) => [
        selection.selectionId,
        selection,
      ] as const,
    ),
  )
  const byDefinitionKey = new Map<
    string,
    PersistedCharacterAdvantageSelection[]
  >()

  for (const selection of selections) {
    const definition = index.definitions.get(
      selection.definitionKey,
    )

    if (definition === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_DEFINITION_UNKNOWN',
          'advantages',
          'La seleccion referencia una Ventaja inexistente.',
          {
            selectionId: selection.selectionId,
            definitionKey: selection.definitionKey,
          },
        ),
      )
      continue
    }

    const selected =
      byDefinitionKey.get(definition.key) ?? []
    selected.push(selection)
    byDefinitionKey.set(definition.key, selected)

    if (!definition.active) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_DEFINITION_INACTIVE',
          'advantages',
          'La Ventaja seleccionada no esta activa.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (selection.category !== definition.category) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_CATEGORY_MISMATCH',
          'advantages',
          'La categoria persistida no coincide con el catalogo.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (
      !allowedRatingsFor(
        definition,
        selection.origin,
        context,
      ).includes(selection.rating)
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_RATING_NOT_ALLOWED',
          'advantages',
          'La puntuacion no esta permitida para esta Ventaja y origen.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
            rating: selection.rating,
            origin: selection.origin,
          },
        ),
      )
    }

    if (
      definition.requiresInstanceDetails &&
      selection.details === null
    ) {
      issues.push(
        issue(
          'CHARACTER_ADVANTAGE_DETAILS_REQUIRED',
          completionSeverity(context),
          'advantages',
          'La Ventaja necesita datos propios de la instancia.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (selection.details !== null) {
      if (definition.instanceDetailsKind === undefined) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_DETAILS_NOT_ALLOWED',
            'advantages',
            'La definicion no admite datos de instancia.',
            {
              selectionId: selection.selectionId,
              definitionKey: definition.key,
            },
          ),
        )
      } else if (
        selection.details.kind !==
        definition.instanceDetailsKind
      ) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_DETAILS_KIND_MISMATCH',
            'advantages',
            'El tipo de datos no coincide con la definicion.',
            {
              selectionId: selection.selectionId,
              definitionKey: definition.key,
              expectedKind:
                definition.instanceDetailsKind,
              actualKind: selection.details.kind,
            },
          ),
        )
      }
    }

    const parentId = selection.parentSelectionId

    if (
      definition.requiresParentSelection === true &&
      parentId === null
    ) {
      issues.push(
        issue(
          'CHARACTER_ADVANTAGE_CATALOG_PARENT_REQUIRED',
          completionSeverity(context),
          'advantages',
          'La Ventaja necesita una seleccion padre compatible.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (parentId !== null) {
      const parent = bySelectionId.get(parentId)
      const parentAllowed =
        definition.requiresParentSelection === true ||
        definition.allowsOptionalParentSelection === true

      if (!parentAllowed) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_CATALOG_PARENT_NOT_ALLOWED',
            'advantages',
            'La definicion no admite una seleccion padre.',
            {
              selectionId: selection.selectionId,
              definitionKey: definition.key,
            },
          ),
        )
      } else if (parent !== undefined) {
        if (
          !(
            definition.allowedParentDefinitionKeys ?? []
          ).includes(parent.definitionKey)
        ) {
          issues.push(
            errorIssue(
              'CHARACTER_ADVANTAGE_PARENT_DEFINITION_NOT_ALLOWED',
              'advantages',
              'La seleccion padre no pertenece a una definicion permitida.',
              {
                selectionId: selection.selectionId,
                parentSelectionId: parentId,
                parentDefinitionKey:
                  parent.definitionKey,
              },
            ),
          )
        }

        if (
          definition.minimumParentRating !== undefined &&
          parent.rating < definition.minimumParentRating
        ) {
          issues.push(
            errorIssue(
              'CHARACTER_ADVANTAGE_PARENT_RATING_TOO_LOW',
              'advantages',
              'La puntuacion de la seleccion padre es insuficiente.',
              {
                selectionId: selection.selectionId,
                parentSelectionId: parentId,
                parentRating: parent.rating,
                minimumParentRating:
                  definition.minimumParentRating,
              },
            ),
          )
        }

        const parentConstraint =
          definition.parentRatingConstraints?.find(
            (constraint) =>
              constraint.parentRating === parent.rating,
          )

        if (
          parentConstraint !== undefined &&
          !parentConstraint.allowedRatings.includes(
            selection.rating,
          )
        ) {
          issues.push(
            errorIssue(
              'CHARACTER_ADVANTAGE_PARENT_RATING_CONSTRAINT_VIOLATED',
              'advantages',
              'La puntuacion no esta permitida para el nivel del padre.',
              {
                selectionId: selection.selectionId,
                parentSelectionId: parentId,
                parentRating: parent.rating,
                rating: selection.rating,
              },
            ),
          )
        }
      }
    }
  }

  for (const [definitionKey, selected] of byDefinitionKey) {
    const definition = index.definitions.get(definitionKey)

    if (
      definition !== undefined &&
      !definition.allowMultiple &&
      selected.length > 1
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_MULTIPLE_NOT_ALLOWED',
          'advantages',
          'La Ventaja no admite multiples instancias.',
          {
            definitionKey,
            selectionCount: selected.length,
          },
        ),
      )
    }
  }

  const selectedDefinitionKeys = new Set(
    selections.map(
      (selection) => selection.definitionKey,
    ),
  )
  const incompatiblePairs = new Set<string>()

  for (const selection of selections) {
    const definition = index.definitions.get(
      selection.definitionKey,
    )

    if (definition === undefined) continue

    for (
      const incompatibleKey of
        definition.incompatibleDefinitionKeys ?? []
    ) {
      if (!selectedDefinitionKeys.has(incompatibleKey)) {
        continue
      }

      const pair = [
        definition.key,
        incompatibleKey,
      ].sort().join('|')

      if (incompatiblePairs.has(pair)) continue
      incompatiblePairs.add(pair)

      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_INCOMPATIBLE_SELECTIONS',
          'advantages',
          'El personaje contiene Ventajas incompatibles.',
          {
            definitionKey: definition.key,
            incompatibleDefinitionKey:
              incompatibleKey,
          },
        ),
      )
    }
  }

  return issues
}

const AGE_CATEGORY_RANK = {
  fledgling: 0,
  neonate: 1,
  ancilla: 2,
  elder: 3,
} as const

function validateAgeRequirements(
  character: PersistedCharacterDraft,
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
  index: AdvantageCatalogIndex,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const checked = new Set<string>()

  for (const selection of selections) {
    if (checked.has(selection.definitionKey)) {
      continue
    }

    checked.add(selection.definitionKey)

    const definition =
      index.definitions.get(
        selection.definitionKey,
      )

    const minimum =
      definition?.requirements
        ?.minimumAgeCategory

    if (minimum === undefined) {
      continue
    }

    const actual =
      character.identity.ageCategory

    if (actual === null) {
      issues.push(
        issue(
          'CHARACTER_ADVANTAGE_AGE_CATEGORY_REQUIRED',
          completionSeverity(context),
          'identity.ageCategory',
          'La Ventaja seleccionada requiere una categoría etaria conocida.',
          {
            definitionKey:
              selection.definitionKey,
            minimumAgeCategory: minimum,
          },
        ),
      )
      continue
    }

    if (
      AGE_CATEGORY_RANK[actual] <
      AGE_CATEGORY_RANK[minimum]
    ) {
      issues.push(
        issue(
          'CHARACTER_ADVANTAGE_AGE_CATEGORY_TOO_YOUNG',
          completionSeverity(context),
          'identity.ageCategory',
          'La categoría etaria del personaje no cumple el mínimo de la Ventaja seleccionada.',
          {
            definitionKey:
              selection.definitionKey,
            ageCategory: actual,
            minimumAgeCategory: minimum,
          },
        ),
      )
    }
  }

  return issues
}

/*
 * SPEC-026:
 * Paridad backend de los requisitos reglamentarios que
 * actualmente declara el catálogo canónico y que la Web
 * ya evalúa:
 *
 * - requirementRules: generation.max
 * - requirements: excludedClanKeys
 *
 * minimumAgeCategory permanece en validateAgeRequirements.
 *
 * Los requisitos sólo se evalúan para definiciones realmente
 * seleccionadas. Un borrador puede conservar información aún
 * incompleta como warning; los demás contextos la tratan como
 * error reglamentario mediante completionSeverity().
 */
function validateDeclaredRequirements(
  character: PersistedCharacterDraft,
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
  index: AdvantageCatalogIndex,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const checked = new Set<string>()

  for (const selection of selections) {
    if (checked.has(selection.definitionKey)) {
      continue
    }

    checked.add(selection.definitionKey)

    const definition =
      index.definitions.get(
        selection.definitionKey,
      )

    if (definition === undefined) {
      continue
    }

    const clanKey =
      character.identity?.clanKey ?? null

    if (
      clanKey !== null &&
      definition.requirements
        ?.excludedClanKeys
        ?.includes(clanKey)
    ) {
      issues.push(
        issue(
          'CHARACTER_ADVANTAGE_CLAN_EXCLUDED',
          completionSeverity(context),
          'identity.clanKey',
          'La Ventaja seleccionada excluye el Clan del personaje.',
          {
            definitionKey: definition.key,
            clanKey,
          },
        ),
      )
    }

    for (
      const requirement of
        definition.requirementRules ?? []
    ) {
      if (requirement.type !== 'generation') {
        continue
      }

      const generation =
        character.identity?.generation ?? null

      if (generation === null) {
        issues.push(
          issue(
            'CHARACTER_ADVANTAGE_GENERATION_REQUIRED',
            completionSeverity(context),
            'identity.generation',
            'La Ventaja seleccionada requiere una Generación conocida.',
            {
              definitionKey: definition.key,
              maximumGeneration:
                requirement.max,
            },
          ),
        )
        continue
      }

      if (generation > requirement.max) {
        issues.push(
          issue(
            'CHARACTER_ADVANTAGE_GENERATION_TOO_HIGH',
            completionSeverity(context),
            'identity.generation',
            'La Generación del personaje no cumple el máximo de la Ventaja seleccionada.',
            {
              definitionKey: definition.key,
              generation,
              maximumGeneration:
                requirement.max,
            },
          ),
        )
      }
    }
  }

  return issues
}

/*
 * SPEC-026.L3
 *
 * Contrasta las referencias persistidas de Fichas de
 * Conocimientos contra el catálogo canónico compartido.
 *
 * La selección sigue usando la definición contenedora
 * "loresheet-benefit"; la identidad concreta se conserva
 * en details.loresheetKey + details.benefitKey.
 *
 * Reglas:
 * - la Ficha debe existir;
 * - el beneficio debe pertenecer a esa Ficha;
 * - rating debe coincidir con el nivel del beneficio;
 * - un beneficio no puede repetirse;
 * - un personaje sólo puede adquirir beneficios de una Ficha;
 * - los requisitos declarados por la Ficha se revalidan
 *   contra el estado actual del personaje.
 */
function validateLoresheetSelections(
  character: PersistedCharacterDraft,
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
  index: AdvantageCatalogIndex,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []

  const selectedLoresheetKeys =
    new Set<string>()

  const selectedBenefits =
    new Set<string>()

  const checkedEligibility =
    new Set<string>()

  for (const selection of selections) {
    const details = selection.details

    if (
      details?.kind !==
      'loresheet'
    ) {
      continue
    }

    const loresheetKey =
      details.loresheetKey

    const benefitKey =
      details.benefitKey

    selectedLoresheetKeys.add(
      loresheetKey,
    )

    const loresheet =
      index.loresheets.get(
        loresheetKey,
      )

    if (loresheet === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_LORESHEET_NOT_FOUND',
          'advantages',
          'La Ficha de Conocimientos seleccionada no existe en el catálogo canónico.',
          {
            selectionId:
              selection.selectionId,
            loresheetKey,
          },
        ),
      )

      continue
    }

    const benefit =
      loresheet.benefits.find(
        (candidate) =>
          candidate.key ===
          benefitKey,
      )

    if (benefit === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_LORESHEET_BENEFIT_NOT_FOUND',
          'advantages',
          'La Ventaja seleccionada no pertenece a la Ficha de Conocimientos indicada.',
          {
            selectionId:
              selection.selectionId,
            loresheetKey,
            benefitKey,
          },
        ),
      )
    } else if (
      selection.rating !==
      benefit.level
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_LORESHEET_RATING_MISMATCH',
          'advantages',
          'La puntuación de la Ventaja debe coincidir con su nivel en la Ficha de Conocimientos.',
          {
            selectionId:
              selection.selectionId,
            loresheetKey,
            benefitKey,
            rating:
              selection.rating,
            expectedRating:
              benefit.level,
          },
        ),
      )
    }

    const uniqueBenefitKey =
      `${loresheetKey}:${benefitKey}`

    if (
      selectedBenefits.has(
        uniqueBenefitKey,
      )
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_LORESHEET_BENEFIT_DUPLICATE',
          'advantages',
          'La misma Ventaja de Ficha de Conocimientos no puede seleccionarse más de una vez.',
          {
            loresheetKey,
            benefitKey,
          },
        ),
      )
    }

    selectedBenefits.add(
      uniqueBenefitKey,
    )

    if (
      checkedEligibility.has(
        loresheetKey,
      )
    ) {
      continue
    }

    checkedEligibility.add(
      loresheetKey,
    )

    const requirements =
      loresheet.requirements

    if (requirements === undefined) {
      continue
    }

    const clanKey =
      character.identity?.clanKey ??
      null

    const characterKind =
      clanKey === 'thinBlood'
        ? 'thinBlood'
        : clanKey === 'caitiff'
          ? 'caitiff'
          : 'standard'

    if (
      requirements.characterKinds !==
        undefined &&
      !requirements.characterKinds.includes(
        characterKind,
      )
    ) {
      issues.push(
        issue(
          'CHARACTER_LORESHEET_CHARACTER_KIND_NOT_ALLOWED',
          completionSeverity(context),
          'identity.clanKey',
          'La Ficha de Conocimientos no está disponible para este tipo de personaje.',
          {
            loresheetKey,
            characterKind,
          },
        ),
      )
    }

    if (
      requirements.clanKeys !==
      undefined
    ) {
      if (clanKey === null) {
        issues.push(
          issue(
            'CHARACTER_LORESHEET_CLAN_REQUIRED',
            completionSeverity(context),
            'identity.clanKey',
            'La Ficha de Conocimientos requiere un Clan permitido.',
            {
              loresheetKey,
            },
          ),
        )
      } else if (
        !requirements.clanKeys.includes(
          clanKey,
        )
      ) {
        issues.push(
          issue(
            'CHARACTER_LORESHEET_CLAN_REQUIRED',
            completionSeverity(context),
            'identity.clanKey',
            'El Clan del personaje no cumple el requisito de la Ficha de Conocimientos.',
            {
              loresheetKey,
              clanKey,
            },
          ),
        )
      }
    }

    if (
      clanKey !== null &&
      requirements.excludedClanKeys
        ?.includes(clanKey)
    ) {
      issues.push(
        issue(
          'CHARACTER_LORESHEET_CLAN_EXCLUDED',
          completionSeverity(context),
          'identity.clanKey',
          'La Ficha de Conocimientos excluye el Clan del personaje.',
          {
            loresheetKey,
            clanKey,
          },
        ),
      )
    }
  }

  if (
    selectedLoresheetKeys.size > 1
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_LORESHEET_MULTIPLE_SHEETS_NOT_ALLOWED',
        'advantages',
        'Un personaje sólo puede adquirir Ventajas de una única Ficha de Conocimientos.',
        {
          loresheetCount:
            selectedLoresheetKeys.size,
        },
      ),
    )
  }

  return issues
}

function validateCreationBudget(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  if (!validatesCreationBudget(context)) return []

  let advantagePoints = 0
  let flawPoints = 0

  for (const selection of selections) {
    if (selection.origin !== 'creation') continue

    if (
      selection.category === 'merit' ||
      selection.category === 'background'
    ) {
      advantagePoints += selection.rating

      if (selection.details?.kind === 'mask') {
        advantagePoints +=
          selection.details.benefits.length
      }
    } else {
      flawPoints += selection.rating
    }
  }

  const severity = completionSeverity(context)
  const issues: CharacterValidationIssue[] = []

  if (advantagePoints !== 7) {
    issues.push(
      issue(
        'CHARACTER_ADVANTAGE_CREATION_BUDGET_INVALID',
        severity,
        'advantages',
        'La creacion requiere exactamente 7 puntos de Meritos y Trasfondos.',
        { advantagePoints },
      ),
    )
  }

  if (flawPoints !== 2) {
    issues.push(
      issue(
        'CHARACTER_FLAW_CREATION_BUDGET_INVALID',
        severity,
        'advantages',
        'La creacion requiere exactamente 2 puntos de Defectos.',
        { flawPoints },
      ),
    )
  }

  return issues
}

const mortalAdvantageExcludedKeys =
  new Set<string>(
    Object.values(
      characterMortalAdvantageExclusionCatalog,
    ).flat(),
  )

function validateMortalEligibility(
  character: PersistedCharacterDraft,
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
  index: AdvantageCatalogIndex,
): CharacterValidationIssue[] {
  if (
    character.nature !== 'human' ||
    character.creation.creationMode !==
      'sessionZero'
  ) {
    return []
  }

  const severity =
    completionSeverity(context)
  const issues:
    CharacterValidationIssue[] = []

  for (const selection of selections) {
    const definition =
      index.definitions.get(
        selection.definitionKey,
      )

    if (
      definition !== undefined &&
      mortalAdvantageExcludedKeys.has(
        definition.key,
      )
    ) {
      issues.push(
        issue(
          'CHARACTER_HUMAN_ADVANTAGE_NOT_ALLOWED',
          severity,
          'advantages',
          'La Ventaja o Defecto seleccionado no está disponible para personajes mortales.',
          {
            definitionKey:
              selection.definitionKey,
          },
        ),
      )
    }

    if (
      definition?.requirementRules?.some(
        ({ type }) =>
          type === 'generation' ||
          type === 'thinBlood' ||
          type === 'clan' ||
          type === 'predatorType',
      )
    ) {
      issues.push(
        issue(
          'CHARACTER_HUMAN_ADVANTAGE_VAMPIRE_REQUIREMENT',
          severity,
          'advantages',
          'La Ventaja seleccionada depende de un requisito vampírico no aplicable al humano.',
          {
            definitionKey:
              selection.definitionKey,
          },
        ),
      )
    }
  }

  return issues
}

function validatePersistedAdvantageState(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
  catalog: CharacterRulesCatalog,
  index: AdvantageCatalogIndex,
): CharacterSectionValidation {
  const selections = character.advantages.selections
  const structuralIssues = [
    ...validateStructure(selections),
    ...validateParentRelations(selections),
    ...validateDetails(selections),
  ]

  if (structuralIssues.length > 0) {
    return sectionResult(structuralIssues)
  }

  if (catalog.stateOf('advantages') !== 'ready') {
    return {
      section: 'advantages',
      state: 'pending',
      issues: [
        issue(
          'CHARACTER_ADVANTAGE_CATALOG_VALIDATION_PENDING',
          'warning',
          null,
          'Falta contrastar Ventajas con el catalogo canonico del backend.',
        ),
      ],
    }
  }

  return sectionResult([
    ...validateCatalogSelections(
      selections,
      context,
      index,
    ),
    ...validateAgeRequirements(
      character,
      selections,
      context,
      index,
    ),
    ...validateDeclaredRequirements(
      character,
      selections,
      context,
      index,
    ),
    ...validateLoresheetSelections(
      character,
      selections,
      context,
      index,
    ),
    ...validateMortalEligibility(
      character,
      selections,
      context,
      index,
    ),
    ...validateCreationBudget(
      selections,
      context,
    ),
  ])
}

export function createCharacterAdvantageValidationContributor(
  catalog: CharacterRulesCatalog,
): CharacterValidationContributor {
  const index = buildCatalogIndex(
    catalog.advantageCatalog,
  )

  return Object.freeze({
    sections: ['advantages'] as const,

    validate(
      character: PersistedCharacterDraft,
      context: CharacterValidationContext,
    ) {
      return [
        validatePersistedAdvantageState(
          character,
          context,
          catalog,
          index,
        ),
      ]
    },
  })
}

export const characterAdvantageValidationContributor =
  createCharacterAdvantageValidationContributor(
    characterRulesCatalog,
  )

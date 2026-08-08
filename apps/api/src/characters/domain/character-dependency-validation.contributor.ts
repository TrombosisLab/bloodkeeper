import type {
  CharacterRulesAdvantageDefinition,
  CharacterRulesPredatorTypeChoice,
  CharacterRulesPredatorTypeChoiceGrant,
  CharacterRulesPredatorTypeDefinition,
  CharacterRulesPredatorTypePointDistributionGrant,
  CharacterRulesPredatorTypePointDistributionOption,
} from '@v5r/character-rules'

import {
  characterRulesCatalog,
} from './character-rules-catalog'

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import {
  CHARACTER_DISCIPLINE_KEYS,
  CHARACTER_SKILL_KEYS,
} from './persisted-character.types'

import type {
  PersistedCharacterAdvantageSelection,
  PersistedCharacterDiscipline,
  PersistedCharacterDraft,
  PersistedCharacterSkillSpecialty,
  PersistedCharacterThinBloodTrait,
} from './persisted-character.types'

import {
  resolvePredatorTypeValidationSpecialties,
} from './predator-type-skill-grant.rules'

import type {
  CharacterValidationContributor,
} from './character-validator'

import type {
  CharacterSectionValidation,
  CharacterValidationContext,
  CharacterValidationIssue,
  CharacterValidationSeverity,
} from './character-validation.types'

interface DependencyCatalogIndex {
  readonly predatorTypes: ReadonlyMap<
    string,
    CharacterRulesPredatorTypeDefinition
  >
  readonly advantages: ReadonlyMap<
    string,
    CharacterRulesAdvantageDefinition
  >
}

interface ConsumedPredatorEffects {
  readonly advantages: Set<number>
  readonly disciplines: Set<number>
  readonly specialties: Set<number>
}

const bloodPotencyRanges: Readonly<
  Record<number, { readonly min: number; readonly max: number }>
> = {
  10: { min: 1, max: 4 },
  11: { min: 1, max: 3 },
  12: { min: 1, max: 3 },
  13: { min: 1, max: 3 },
  14: { min: 0, max: 2 },
  15: { min: 0, max: 1 },
  16: { min: 0, max: 0 },
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
    section: 'dependencies',
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

function completionSeverity(
  context: CharacterValidationContext,
): CharacterValidationSeverity {
  return context === 'draftSave'
    ? 'warning'
    : 'error'
}

function validatesInitialCreation(
  context: CharacterValidationContext,
): boolean {
  return (
    context === 'draftSave' ||
    context === 'activation'
  )
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
      section: 'dependencies',
      state: 'invalid',
      issues,
    }
  }

  if (issues.length > 0) {
    return {
      section: 'dependencies',
      state: 'pending',
      issues,
    }
  }

  return {
    section: 'dependencies',
    state: 'complete',
    issues: [],
  }
}

function selectedPredatorTypeKey(
  character: PersistedCharacterDraft,
): string | null {
  const value = character.identity.predatorTypeKey

  if (value === null || value.trim().length === 0) {
    return null
  }

  return value
}

function hasPredatorTypeOrigin(
  character: PersistedCharacterDraft,
): boolean {
  return (
    character.disciplines.some(
      (discipline) =>
        discipline.origin === 'predatorType',
    ) ||
    character.skillSpecialties.some(
      (specialty) =>
        specialty.origin === 'predatorType',
    ) ||
    character.advantages.selections.some(
      (selection) =>
        selection.origin === 'predatorType',
    )
  )
}

function hasThinBloodOrigin(
  character: PersistedCharacterDraft,
): boolean {
  return (
    character.disciplines.some(
      (discipline) =>
        discipline.origin === 'thinBlood',
    ) ||
    character.advantages.selections.some(
      (selection) =>
        selection.origin === 'thinBlood',
    )
  )
}

function validateOrigins(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []

  if (
    selectedPredatorTypeKey(character) === null &&
    hasPredatorTypeOrigin(character)
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_ORIGIN_WITHOUT_SELECTION',
        'identity.predatorTypeKey',
        'Hay efectos de Tipo de Depredador sin un Tipo seleccionado.',
      ),
    )
  }

  if (
    character.identity.clanKey !== 'thinBlood' &&
    hasThinBloodOrigin(character)
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_THIN_BLOOD_ORIGIN_NOT_ALLOWED',
        'identity.clanKey',
        'Solo Sangre Debil puede conservar efectos con este origen.',
      ),
    )
  }

  return issues
}

function duplicateTraitKeys(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
): string[] {
  const seen = new Set<string>()
  const duplicated = new Set<string>()

  for (const trait of traits) {
    if (seen.has(trait.definitionKey)) {
      duplicated.add(trait.definitionKey)
    }
    seen.add(trait.definitionKey)
  }

  return [...duplicated]
}

function validateThinBloodOwnership(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  if (character.identity.clanKey === 'thinBlood') {
    return []
  }

  const issues: CharacterValidationIssue[] = []

  if (character.thinBloodTraits.length > 0) {
    issues.push(
      errorIssue(
        'CHARACTER_THIN_BLOOD_TRAITS_NOT_ALLOWED',
        'thinBloodTraits',
        'Solo Sangre Debil puede conservar Meritos y Defectos de Sangre Debil.',
      ),
    )
  }

  if (
    character.thinBloodAlchemy.rating > 0 ||
    character.thinBloodAlchemy.method !== null ||
    character.thinBloodAlchemy.formulaKeys.length > 0
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_NOT_ALLOWED',
        'thinBloodAlchemy',
        'Solo Sangre Debil puede conservar Alquimia de Sangre Debil.',
      ),
    )
  }

  return issues
}

function validateThinBloodTraitDetails(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  if (character.identity.clanKey !== 'thinBlood') {
    return []
  }

  const issues: CharacterValidationIssue[] = []
  const traits = character.thinBloodTraits
  const selectedKeys = new Set(
    traits.map((trait) => trait.definitionKey),
  )

  for (const definitionKey of duplicateTraitKeys(traits)) {
    issues.push(
      errorIssue(
        'CHARACTER_THIN_BLOOD_TRAIT_DUPLICATE',
        'thinBloodTraits',
        'Un Merito o Defecto de Sangre Debil no puede repetirse.',
        { definitionKey },
      ),
    )
  }

  for (const trait of traits) {
    const clanCurse = trait.clanCurseDetails
    const affinity = trait.disciplineAffinityDetails

    if (trait.definitionKey === 'clan-curse') {
      if (
        clanCurse === null ||
        clanCurse.clanKey.trim().length === 0
      ) {
        issues.push(
          errorIssue(
            'CHARACTER_THIN_BLOOD_CLAN_CURSE_REQUIRED',
            'thinBloodTraits',
            'Maldicion de Clan necesita seleccionar un clan.',
          ),
        )
      }

      if (affinity !== null) {
        issues.push(
          errorIssue(
            'CHARACTER_THIN_BLOOD_TRAIT_DETAILS_CONFLICT',
            'thinBloodTraits',
            'Maldicion de Clan no puede contener una Disciplina Afin.',
          ),
        )
      }

      if (
        clanCurse?.clanKey === 'brujah' ||
        clanCurse?.clanKey === 'gangrel'
      ) {
        if (!selectedKeys.has('bestial-temper')) {
          issues.push(
            errorIssue(
              'CHARACTER_THIN_BLOOD_BESTIAL_TEMPER_REQUIRED',
              'thinBloodTraits',
              'Esta Maldicion de Clan requiere Temperamento Bestial.',
            ),
          )
        }
      }

      if (
        clanCurse?.clanKey === 'tremere' &&
        !selectedKeys.has('bonding-blood')
      ) {
        issues.push(
          errorIssue(
            'CHARACTER_THIN_BLOOD_BONDING_BLOOD_REQUIRED',
            'thinBloodTraits',
            'La Maldicion Tremere requiere Sangre Vinculante.',
          ),
        )
      }

      continue
    }

    if (clanCurse !== null) {
      issues.push(
        errorIssue(
          'CHARACTER_THIN_BLOOD_CLAN_CURSE_DETAILS_NOT_ALLOWED',
          'thinBloodTraits',
          'Solo Maldicion de Clan puede contener esos detalles.',
          { definitionKey: trait.definitionKey },
        ),
      )
    }

    if (trait.definitionKey === 'discipline-affinity') {
      if (
        affinity === null ||
        affinity.powerKey.trim().length === 0
      ) {
        issues.push(
          errorIssue(
            'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_REQUIRED',
            'thinBloodTraits',
            'Disciplina Afin necesita una Disciplina y un Poder.',
          ),
        )
      }
    } else if (affinity !== null) {
      issues.push(
        errorIssue(
          'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_DETAILS_NOT_ALLOWED',
          'thinBloodTraits',
          'Solo Disciplina Afin puede contener esos detalles.',
          { definitionKey: trait.definitionKey },
        ),
      )
    }
  }

  return issues
}

function allowedAdvantageRatings(
  definition: CharacterRulesAdvantageDefinition,
): readonly number[] {
  return (
    definition.originRatingConstraints?.find(
      (constraint) =>
        constraint.origin === 'predatorType',
    )?.allowedRatings ?? definition.allowedRatings
  )
}

function validateAdvantageGrant(
  definitionKey: string,
  category: string,
  rating: number,
  advantages: ReadonlyMap<
    string,
    CharacterRulesAdvantageDefinition
  >,
  label: string,
): void {
  const definition = advantages.get(definitionKey)

  if (definition === undefined) {
    throw new Error(
      `${label} references unknown advantage ${definitionKey}`,
    )
  }

  if (!definition.active) {
    throw new Error(
      `${label} references inactive advantage ${definitionKey}`,
    )
  }

  if (definition.category !== category) {
    throw new Error(
      `${label} has invalid category for ${definitionKey}`,
    )
  }

  if (!allowedAdvantageRatings(definition).includes(rating)) {
    throw new Error(
      `${label} has invalid rating for ${definitionKey}`,
    )
  }
}

function validatePointDistribution(
  distribution: CharacterRulesPredatorTypePointDistributionGrant,
  advantages: ReadonlyMap<
    string,
    CharacterRulesAdvantageDefinition
  >,
  label: string,
): void {
  if (
    !Number.isInteger(distribution.points) ||
    distribution.points < 1 ||
    distribution.options.length === 0
  ) {
    throw new Error(`${label} has invalid point distribution`)
  }

  for (const option of distribution.options) {
    if (
      option.maximumRating !== undefined &&
      (
        !Number.isInteger(option.maximumRating) ||
        option.maximumRating < 1
      )
    ) {
      throw new Error(`${label} has invalid maximum rating`)
    }

    const matches = [...advantages.values()].filter(
      (definition) => {
        if (
          !definition.active ||
          definition.category !== option.category
        ) {
          return false
        }

        if (
          'definitionKey' in option &&
          option.definitionKey !== undefined
        ) {
          return definition.key === option.definitionKey
        }

        if (
          'family' in option &&
          option.family !== undefined
        ) {
          return (
            definition.families?.includes(option.family) ===
            true
          )
        }

        return false
      },
    )

    if (matches.length === 0) {
      throw new Error(`${label} has an unresolved option`)
    }

    if (
      option.maximumRating !== undefined &&
      !matches.some((definition) =>
        allowedAdvantageRatings(definition).some(
          (rating) => rating <= option.maximumRating!,
        ),
      )
    ) {
      throw new Error(`${label} maximum rating rejects every option`)
    }
  }
}

function validateChoiceGrant(
  grant: CharacterRulesPredatorTypeChoiceGrant,
  index: DependencyCatalogIndex,
  label: string,
): void {
  switch (grant.type) {
    case 'specialty':
      if (
        !CHARACTER_SKILL_KEYS.includes(grant.skillKey) ||
        grant.name.trim().length === 0
      ) {
        throw new Error(`${label} has an invalid specialty grant`)
      }
      return
    case 'discipline':
      if (
        !CHARACTER_DISCIPLINE_KEYS.includes(
          grant.disciplineKey,
        ) ||
        !Number.isInteger(grant.dots) ||
        grant.dots < 1 ||
        grant.dots > 5
      ) {
        throw new Error(`${label} has an invalid discipline grant`)
      }
      return
    case 'advantage':
      validateAdvantageGrant(
        grant.definitionKey,
        grant.category,
        grant.rating,
        index.advantages,
        label,
      )
      return
    case 'humanity':
    case 'bloodPotency':
      if (!Number.isInteger(grant.modifier)) {
        throw new Error(`${label} has an invalid modifier`)
      }
      return
    case 'pointDistribution':
      validatePointDistribution(
        grant,
        index.advantages,
        label,
      )
      return
  }
}

function buildCatalogIndex(
  catalog: CharacterRulesCatalog,
): DependencyCatalogIndex {
  const advantages = new Map(
    catalog.advantageCatalog.definitions.map(
      (definition) => [definition.key, definition] as const,
    ),
  )
  const predatorTypes = new Map<
    string,
    CharacterRulesPredatorTypeDefinition
  >()
  const choiceIds = new Set<string>()

  for (
    const definition of
      catalog.dependencyCatalog.predatorTypes
  ) {
    if (
      definition.key.trim().length === 0 ||
      definition.name.trim().length === 0
    ) {
      throw new Error('Predator type identity is required')
    }

    if (predatorTypes.has(definition.key)) {
      throw new Error(
        `Duplicate predator type definition: ${definition.key}`,
      )
    }

    if ((definition.pendingReferences ?? []).length > 0) {
      throw new Error(
        `Predator type ${definition.key} has unresolved references`,
      )
    }

    const restrictions = definition.restrictions

    if (
      restrictions?.minimumHumanity !== undefined &&
      restrictions.maximumHumanity !== undefined &&
      restrictions.minimumHumanity >
        restrictions.maximumHumanity
    ) {
      throw new Error(
        `Predator type ${definition.key} has invalid Humanity limits`,
      )
    }

    if (
      restrictions?.minimumBloodPotency !== undefined &&
      restrictions.maximumBloodPotency !== undefined &&
      restrictions.minimumBloodPotency >
        restrictions.maximumBloodPotency
    ) {
      throw new Error(
        `Predator type ${definition.key} has invalid Blood Potency limits`,
      )
    }

    for (
      const requiredKey of [
        ...(restrictions?.requiredMerits ?? []),
        ...(restrictions?.forbiddenMerits ?? []),
      ]
    ) {
      if (!advantages.has(requiredKey)) {
        throw new Error(
          `Predator type ${definition.key} references unknown requirement ${requiredKey}`,
        )
      }
    }

    for (
      const grant of
        definition.fixedGrants?.advantages ?? []
    ) {
      validateAdvantageGrant(
        grant.definitionKey,
        grant.category,
        grant.rating,
        advantages,
        `Predator type ${definition.key}`,
      )
    }

    for (
      const distribution of
        definition.fixedGrants?.pointDistributions ?? []
    ) {
      validatePointDistribution(
        distribution,
        advantages,
        `Predator type ${definition.key}`,
      )
    }

    for (
      const modifier of [
        definition.fixedGrants?.humanityModifier,
        definition.fixedGrants?.bloodPotencyModifier,
      ]
    ) {
      if (
        modifier !== undefined &&
        !Number.isInteger(modifier)
      ) {
        throw new Error(
          `Predator type ${definition.key} has an invalid modifier`,
        )
      }
    }

    for (const choice of definition.choices ?? []) {
      if (
        choice.id.trim().length === 0 ||
        choiceIds.has(choice.id)
      ) {
        throw new Error(
          `Duplicate or empty predator choice: ${choice.id}`,
        )
      }
      choiceIds.add(choice.id)

      if (
        !Number.isInteger(choice.minimumSelections) ||
        !Number.isInteger(choice.maximumSelections) ||
        choice.minimumSelections < 0 ||
        choice.maximumSelections <
          choice.minimumSelections ||
        choice.maximumSelections > choice.options.length
      ) {
        throw new Error(
          `Predator choice ${choice.id} has invalid cardinality`,
        )
      }

      if (choice.options.length === 0) {
        throw new Error(
          `Predator choice ${choice.id} has no options`,
        )
      }

      for (const option of choice.options) {
        validateChoiceGrant(
          option.grant,
          { predatorTypes, advantages },
          `Predator choice ${choice.id}`,
        )
      }
    }

    predatorTypes.set(definition.key, definition)
  }

  return Object.freeze({ predatorTypes, advantages })
}

function optionConditionMatches(
  option: CharacterRulesPredatorTypeChoice['options'][number],
  clanKey: string | null,
): boolean {
  if (option.when === undefined) return true

  if (
    option.when.clan !== undefined &&
    option.when.clan !== clanKey
  ) {
    return false
  }

  return true
}

function eligibleChoiceGrants(
  choice: CharacterRulesPredatorTypeChoice,
  clanKey: string | null,
): readonly CharacterRulesPredatorTypeChoiceGrant[] {
  return choice.options
    .filter(
      (option) =>
        optionConditionMatches(
          option,
          clanKey,
        ),
    )
    .map(
      (option) =>
        option.grant,
    )
}

function isInitialMatch(
  context: CharacterValidationContext,
): boolean {
  return validatesInitialCreation(context)
}

function findAdvantageMatch(
  grant: Extract<
    CharacterRulesPredatorTypeChoiceGrant,
    { readonly type: 'advantage' }
  > | {
    readonly definitionKey: string
    readonly category: 'merit' | 'background' | 'flaw'
    readonly rating: number
  },
  actual:
    readonly PersistedCharacterAdvantageSelection[],
  consumed: Set<number>,
  context: CharacterValidationContext,
): number | null {
  for (let index = 0; index < actual.length; index += 1) {
    if (consumed.has(index)) continue

    const selection = actual[index]
    const ratingMatches = isInitialMatch(context)
      ? selection.rating === grant.rating
      : selection.rating >= grant.rating

    if (
      selection.definitionKey === grant.definitionKey &&
      selection.category === grant.category &&
      ratingMatches
    ) {
      return index
    }
  }

  return null
}

function findDisciplineMatch(
  grant: Extract<
    CharacterRulesPredatorTypeChoiceGrant,
    { readonly type: 'discipline' }
  >,
  actual: readonly PersistedCharacterDiscipline[],
  consumed: Set<number>,
  context: CharacterValidationContext,
): number | null {
  for (let index = 0; index < actual.length; index += 1) {
    if (consumed.has(index)) continue

    const discipline = actual[index]
    const ratingMatches = isInitialMatch(context)
      ? discipline.rating === grant.dots
      : discipline.rating >= grant.dots

    if (
      discipline.disciplineKey === grant.disciplineKey &&
      ratingMatches
    ) {
      return index
    }
  }

  return null
}

function findSpecialtyMatch(
  grant: Extract<
    CharacterRulesPredatorTypeChoiceGrant,
    { readonly type: 'specialty' }
  >,
  actual: readonly PersistedCharacterSkillSpecialty[],
  consumed: Set<number>,
): number | null {
  for (let index = 0; index < actual.length; index += 1) {
    if (consumed.has(index)) continue

    const specialty = actual[index]

    if (
      specialty.skillKey === grant.skillKey &&
      specialty.name.trim() === grant.name.trim()
    ) {
      return index
    }
  }

  return null
}

function consumeGrant(
  grant: CharacterRulesPredatorTypeChoiceGrant,
  actual: {
    readonly advantages:
      readonly PersistedCharacterAdvantageSelection[]
    readonly disciplines:
      readonly PersistedCharacterDiscipline[]
    readonly specialties:
      readonly PersistedCharacterSkillSpecialty[]
  },
  consumed: ConsumedPredatorEffects,
  context: CharacterValidationContext,
): boolean {
  switch (grant.type) {
    case 'advantage': {
      const match = findAdvantageMatch(
        grant,
        actual.advantages,
        consumed.advantages,
        context,
      )
      if (match === null) return false
      consumed.advantages.add(match)
      return true
    }
    case 'discipline': {
      const match = findDisciplineMatch(
        grant,
        actual.disciplines,
        consumed.disciplines,
        context,
      )
      if (match === null) return false
      consumed.disciplines.add(match)
      return true
    }
    case 'specialty': {
      const match = findSpecialtyMatch(
        grant,
        actual.specialties,
        consumed.specialties,
      )
      if (match === null) return false
      consumed.specialties.add(match)
      return true
    }
    case 'humanity':
    case 'bloodPotency':
    case 'pointDistribution':
      return false
  }
}

function optionMatchesAdvantage(
  option: CharacterRulesPredatorTypePointDistributionOption,
  selection: PersistedCharacterAdvantageSelection,
  definition: CharacterRulesAdvantageDefinition | undefined,
): boolean {
  if (
    definition === undefined ||
    selection.category !== option.category
  ) {
    return false
  }

  if (
    option.maximumRating !== undefined &&
    selection.rating > option.maximumRating
  ) {
    return false
  }

  if (
    'definitionKey' in option &&
    option.definitionKey !== undefined
  ) {
    return selection.definitionKey === option.definitionKey
  }

  if (
    'family' in option &&
    option.family !== undefined
  ) {
    return definition.families?.includes(option.family) === true
  }

  return false
}

function findDistributionAllocation(
  distribution: CharacterRulesPredatorTypePointDistributionGrant,
  actual:
    readonly PersistedCharacterAdvantageSelection[],
  consumed: Set<number>,
  index: DependencyCatalogIndex,
  context: CharacterValidationContext,
): number[] | null {
  const candidates = actual
    .map((selection, candidateIndex) => ({
      selection,
      candidateIndex,
    }))
    .filter(({ selection, candidateIndex }) =>
      !consumed.has(candidateIndex) &&
      distribution.options.some((option) =>
        optionMatchesAdvantage(
          option,
          selection,
          index.advantages.get(selection.definitionKey),
        ),
      ),
    )

  const exact = isInitialMatch(context)

  function search(
    position: number,
    points: number,
    chosen: number[],
    definitionKeys: Set<string>,
  ): number[] | null {
    if (
      exact
        ? points === distribution.points
        : points >= distribution.points
    ) {
      return chosen
    }

    if (
      position >= candidates.length ||
      points > distribution.points && exact
    ) {
      return null
    }

    const skipped = search(
      position + 1,
      points,
      chosen,
      definitionKeys,
    )

    if (skipped !== null) return skipped

    const candidate = candidates[position]

    if (
      definitionKeys.has(
        candidate.selection.definitionKey,
      )
    ) {
      return null
    }

    const nextKeys = new Set(definitionKeys)
    nextKeys.add(candidate.selection.definitionKey)

    return search(
      position + 1,
      points + candidate.selection.rating,
      [...chosen, candidate.candidateIndex],
      nextKeys,
    )
  }

  return search(0, 0, [], new Set())
}

function validatePredatorRestrictions(
  character: PersistedCharacterDraft,
  definition: CharacterRulesPredatorTypeDefinition,
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  const restrictions = definition.restrictions

  if (restrictions === undefined) return []

  const issues: CharacterValidationIssue[] = []
  const clanKey = character.identity.clanKey

  if (
    clanKey !== null &&
    restrictions.excludedClans?.includes(clanKey)
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_CLAN_EXCLUDED',
        'identity.clanKey',
        'El clan no puede utilizar el Tipo de Depredador seleccionado.',
        {
          predatorTypeKey: definition.key,
          clanKey,
        },
      ),
    )
  }

  if (
    clanKey !== null &&
    restrictions.requiredClans !== undefined &&
    !restrictions.requiredClans.includes(clanKey)
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_CLAN_REQUIRED',
        'identity.clanKey',
        'El Tipo de Depredador requiere un clan permitido.',
        {
          predatorTypeKey: definition.key,
          clanKey,
        },
      ),
    )
  }

  const selectedAdvantages = new Set(
    character.advantages.selections.map(
      (selection) => selection.definitionKey,
    ),
  )

  for (const definitionKey of restrictions.requiredMerits ?? []) {
    if (selectedAdvantages.has(definitionKey)) continue

    issues.push(
      issue(
        'CHARACTER_PREDATOR_TYPE_REQUIRED_ADVANTAGE_MISSING',
        completionSeverity(context),
        'advantages',
        'Falta una Ventaja requerida por el Tipo de Depredador.',
        {
          predatorTypeKey: definition.key,
          definitionKey,
        },
      ),
    )
  }

  for (const definitionKey of restrictions.forbiddenMerits ?? []) {
    if (!selectedAdvantages.has(definitionKey)) continue

    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_FORBIDDEN_ADVANTAGE',
        'advantages',
        'El personaje contiene una Ventaja prohibida por el Tipo de Depredador.',
        {
          predatorTypeKey: definition.key,
          definitionKey,
        },
      ),
    )
  }

  if (
    restrictions.minimumHumanity !== undefined &&
    character.humanity.value < restrictions.minimumHumanity
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_HUMANITY_TOO_LOW',
        'humanity.value',
        'La Humanidad es inferior al mínimo del Tipo de Depredador.',
        {
          predatorTypeKey: definition.key,
          minimumHumanity: restrictions.minimumHumanity,
          humanity: character.humanity.value,
        },
      ),
    )
  }

  if (
    restrictions.maximumHumanity !== undefined &&
    character.humanity.value > restrictions.maximumHumanity
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_HUMANITY_TOO_HIGH',
        'humanity.value',
        'La Humanidad supera el máximo del Tipo de Depredador.',
        {
          predatorTypeKey: definition.key,
          maximumHumanity: restrictions.maximumHumanity,
          humanity: character.humanity.value,
        },
      ),
    )
  }

  if (
    restrictions.minimumBloodPotency !== undefined &&
    character.blood.bloodPotency <
      restrictions.minimumBloodPotency
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_BLOOD_POTENCY_TOO_LOW',
        'blood.bloodPotency',
        'La Potencia de Sangre es inferior al mínimo del Tipo de Depredador.',
        {
          predatorTypeKey: definition.key,
          minimumBloodPotency:
            restrictions.minimumBloodPotency,
          bloodPotency: character.blood.bloodPotency,
        },
      ),
    )
  }

  if (
    restrictions.maximumBloodPotency !== undefined &&
    character.blood.bloodPotency >
      restrictions.maximumBloodPotency
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_BLOOD_POTENCY_TOO_HIGH',
        'blood.bloodPotency',
        'La Potencia de Sangre supera el máximo del Tipo de Depredador.',
        {
          predatorTypeKey: definition.key,
          maximumBloodPotency:
            restrictions.maximumBloodPotency,
          bloodPotency: character.blood.bloodPotency,
        },
      ),
    )
  }

  return issues
}

function modifierOptions(
  definition: CharacterRulesPredatorTypeDefinition,
  clanKey: string | null,
  kind: 'humanity' | 'bloodPotency',
): readonly number[] {
  let totals = new Set([
    kind === 'humanity'
      ? definition.fixedGrants?.humanityModifier ?? 0
      : definition.fixedGrants?.bloodPotencyModifier ?? 0,
  ])

  for (const choice of definition.choices ?? []) {
    const grants = eligibleChoiceGrants(choice, clanKey)
      .filter(
        (
          grant,
        ): grant is Extract<
          CharacterRulesPredatorTypeChoiceGrant,
          { readonly type: typeof kind }
        > => grant.type === kind,
      )

    if (grants.length === 0) continue

    const next = new Set<number>()

    for (const total of totals) {
      for (const grant of grants) {
        next.add(total + grant.modifier)
      }
    }

    totals = next
  }

  return [...totals]
}

function validatePredatorScalarEffects(
  character: PersistedCharacterDraft,
  definition: CharacterRulesPredatorTypeDefinition,
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  if (!validatesInitialCreation(context)) return []

  const issues: CharacterValidationIssue[] = []
  const humanityValues = modifierOptions(
    definition,
    character.identity.clanKey,
    'humanity',
  ).map((modifier) => 7 + modifier)

  if (!humanityValues.includes(character.humanity.value)) {
    issues.push(
      issue(
        'CHARACTER_PREDATOR_TYPE_HUMANITY_MODIFIER_MISSING',
        completionSeverity(context),
        'humanity.value',
        'La Humanidad inicial no incorpora el modificador del Tipo de Depredador.',
        {
          predatorTypeKey: definition.key,
          humanity: character.humanity.value,
          expectedHumanity: humanityValues[0] ?? 7,
        },
      ),
    )
  }

  const generation = character.identity.generation
  const range =
    generation === null
      ? undefined
      : bloodPotencyRanges[generation]

  if (range !== undefined) {
    const modifiers = modifierOptions(
      definition,
      character.identity.clanKey,
      'bloodPotency',
    )
    const satisfies = modifiers.some((modifier) => {
      if (modifier > 0) {
        return (
          character.blood.bloodPotency >=
          range.min + modifier
        )
      }

      if (modifier < 0) {
        return (
          character.blood.bloodPotency <=
          range.max + modifier
        )
      }

      return true
    })

    if (!satisfies) {
      issues.push(
        issue(
          'CHARACTER_PREDATOR_TYPE_BLOOD_POTENCY_MODIFIER_MISSING',
          completionSeverity(context),
          'blood.bloodPotency',
          'La Potencia de Sangre inicial no incorpora el modificador del Tipo de Depredador.',
          {
            predatorTypeKey: definition.key,
            bloodPotency: character.blood.bloodPotency,
          },
        ),
      )
    }
  }

  return issues
}

function validatePredatorEffects(
  character: PersistedCharacterDraft,
  definition: CharacterRulesPredatorTypeDefinition,
  context: CharacterValidationContext,
  index: DependencyCatalogIndex,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const actual = {
    advantages:
      character.advantages.selections.filter(
        (selection) =>
          selection.origin === 'predatorType',
      ),
    disciplines:
      character.disciplines.filter(
        (discipline) =>
          discipline.origin === 'predatorType',
      ),
    specialties:
      resolvePredatorTypeValidationSpecialties(
        character,
        definition,
      ).filter(
        (specialty) =>
          specialty.origin === 'predatorType',
      ),
  }
  const consumed: ConsumedPredatorEffects = {
    advantages: new Set(),
    disciplines: new Set(),
    specialties: new Set(),
  }
  const missingSeverity = completionSeverity(context)

  for (
    const grant of
      definition.fixedGrants?.advantages ?? []
  ) {
    const choiceGrant = {
      type: 'advantage' as const,
      ...grant,
    }

    if (
      !consumeGrant(
        choiceGrant,
        actual,
        consumed,
        context,
      )
    ) {
      issues.push(
        issue(
          'CHARACTER_PREDATOR_TYPE_FIXED_ADVANTAGE_MISSING',
          missingSeverity,
          'advantages',
          'Falta una Ventaja fija del Tipo de Depredador.',
          {
            predatorTypeKey: definition.key,
            definitionKey: grant.definitionKey,
            rating: grant.rating,
          },
        ),
      )
    }
  }

  const distributions = [
    ...(definition.fixedGrants?.pointDistributions ?? []),
  ]

  for (const choice of definition.choices ?? []) {
    const eligible = eligibleChoiceGrants(
      choice,
      character.identity.clanKey,
    )
    const scalarOrDistribution = eligible.filter(
      (grant) =>
        grant.type === 'humanity' ||
        grant.type === 'bloodPotency' ||
        grant.type === 'pointDistribution',
    )

    for (const grant of scalarOrDistribution) {
      if (grant.type === 'pointDistribution') {
        distributions.push(grant)
      }
    }

    const effectGrants = eligible.filter(
      (grant) =>
        grant.type === 'advantage' ||
        grant.type === 'discipline' ||
        grant.type === 'specialty',
    )

    if (effectGrants.length === 0) continue

    let matched = 0

    for (const grant of effectGrants) {
      if (matched >= choice.maximumSelections) break

      if (
        consumeGrant(
          grant,
          actual,
          consumed,
          context,
        )
      ) {
        matched += 1
      }
    }

    if (matched < choice.minimumSelections) {
      issues.push(
        issue(
          'CHARACTER_PREDATOR_TYPE_CHOICE_MISSING',
          missingSeverity,
          'identity.predatorTypeKey',
          'Falta resolver una elección obligatoria del Tipo de Depredador.',
          {
            predatorTypeKey: definition.key,
            choiceId: choice.id,
            minimumSelections: choice.minimumSelections,
            matchedSelections: matched,
          },
        ),
      )
    }
  }

  for (
    let distributionIndex = 0;
    distributionIndex < distributions.length;
    distributionIndex += 1
  ) {
    const distribution = distributions[distributionIndex]
    const allocation = findDistributionAllocation(
      distribution,
      actual.advantages,
      consumed.advantages,
      index,
      context,
    )

    if (allocation === null) {
      issues.push(
        issue(
          'CHARACTER_PREDATOR_TYPE_POINT_DISTRIBUTION_INCOMPLETE',
          missingSeverity,
          'advantages',
          'El reparto de puntos del Tipo de Depredador está incompleto.',
          {
            predatorTypeKey: definition.key,
            distributionIndex,
            requiredPoints: distribution.points,
          },
        ),
      )
      continue
    }

    for (const candidateIndex of allocation) {
      consumed.advantages.add(candidateIndex)
    }
  }

  actual.advantages.forEach((selection, effectIndex) => {
    if (consumed.advantages.has(effectIndex)) return

    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_ADVANTAGE_UNEXPECTED',
        'advantages',
        'Una Ventaja con origen Tipo de Depredador no corresponde al Tipo seleccionado.',
        {
          predatorTypeKey: definition.key,
          definitionKey: selection.definitionKey,
          rating: selection.rating,
        },
      ),
    )
  })

  actual.disciplines.forEach((discipline, effectIndex) => {
    if (consumed.disciplines.has(effectIndex)) return

    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_DISCIPLINE_UNEXPECTED',
        'disciplines',
        'Una Disciplina con origen Tipo de Depredador no corresponde al Tipo seleccionado.',
        {
          predatorTypeKey: definition.key,
          disciplineKey: discipline.disciplineKey,
          rating: discipline.rating,
        },
      ),
    )
  })

  actual.specialties.forEach((specialty, effectIndex) => {
    if (consumed.specialties.has(effectIndex)) return

    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_SPECIALTY_UNEXPECTED',
        'skillSpecialties',
        'Una Especialidad con origen Tipo de Depredador no corresponde al Tipo seleccionado.',
        {
          predatorTypeKey: definition.key,
          skillKey: specialty.skillKey,
          specialtyName: specialty.name,
        },
      ),
    )
  })

  return issues
}

function validatePredatorType(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
  index: DependencyCatalogIndex,
): CharacterValidationIssue[] {
  const predatorTypeKey = selectedPredatorTypeKey(character)

  if (predatorTypeKey === null) {
    if (
      validatesInitialCreation(context) &&
      character.humanity.value !== 7
    ) {
      return [
        issue(
          'INITIAL_HUMANITY_VALUE_INVALID',
          completionSeverity(context),
          'humanity.value',
          'La Humanidad inicial debe ser 7 cuando no existe modificador de Tipo de Depredador.',
          {
            humanity: character.humanity.value,
            expectedHumanity: 7,
          },
        ),
      ]
    }

    return []
  }

  if (character.identity.clanKey === 'thinBlood') {
    return [
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_THIN_BLOOD_FORBIDDEN',
        'identity.predatorTypeKey',
        'Los Sangre Débil no pueden tener Tipo de Depredador.',
        { predatorTypeKey },
      ),
    ]
  }

  const definition = index.predatorTypes.get(predatorTypeKey)

  if (definition === undefined) {
    return [
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_UNKNOWN',
        'identity.predatorTypeKey',
        'El Tipo de Depredador no existe en el catálogo canónico.',
        { predatorTypeKey },
      ),
    ]
  }

  return [
    ...validatePredatorRestrictions(
      character,
      definition,
      context,
    ),
    ...validatePredatorScalarEffects(
      character,
      definition,
      context,
    ),
    ...validatePredatorEffects(
      character,
      definition,
      context,
      index,
    ),
  ]
}

function validatePersistedDependencies(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
  catalog: CharacterRulesCatalog,
  index: DependencyCatalogIndex,
): CharacterSectionValidation {
  const structuralIssues = [
    ...validateOrigins(character),
    ...validateThinBloodOwnership(character),
    ...validateThinBloodTraitDetails(character),
  ]

  if (structuralIssues.length > 0) {
    return sectionResult(structuralIssues)
  }

  if (catalog.stateOf('dependencies') !== 'ready') {
    return {
      section: 'dependencies',
      state: 'pending',
      issues: [
        issue(
          'CHARACTER_CATALOG_DEPENDENCY_VALIDATION_PENDING',
          'warning',
          null,
          'Falta contrastar efectos y requisitos cruzados con los catalogos canonicos del backend.',
        ),
      ],
    }
  }

  return sectionResult(
    validatePredatorType(
      character,
      context,
      index,
    ),
  )
}

export function createCharacterDependencyValidationContributor(
  catalog: CharacterRulesCatalog,
): CharacterValidationContributor {
  const index = buildCatalogIndex(catalog)

  return Object.freeze({
    sections: ['dependencies'] as const,

    validate(
      character: PersistedCharacterDraft,
      context: CharacterValidationContext,
    ) {
      return [
        validatePersistedDependencies(
          character,
          context,
          catalog,
          index,
        ),
      ]
    },
  })
}

export const characterDependencyValidationContributor =
  createCharacterDependencyValidationContributor(
    characterRulesCatalog,
  )

import { predatorTypeDefinitions } from '../data/predator-type-definitions.ts';

import {
  characterAdvantageDefinitions,
} from '../data/character-advantage-definitions.ts'

import type {
  PredatorTypeChoice,
  PredatorTypeChoiceGrant,
  PredatorTypePointDistributionAllocation,
  PredatorTypePointDistributionGrant,
  PredatorTypePointDistributionOption,
} from '../types/predator-type.types.ts'


import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types.ts'

import type {
  CharacterAdvantagesDraft,
  CharacterAdvantageSelectionDraft,
} from '../types/character-advantages-draft.types.ts'

import type {
  CharacterDisciplineDraft,
  CharacterDisciplinesDraft,
} from '../types/discipline.types.ts'

import type {
  CharacterSkillSpecialtiesDraft,
  SkillSpecialty,
} from '../types/character-skills-draft.types.ts'


export function getPredatorType(key: string) {
    return predatorTypeDefinitions.find(x => x.key === key);
}

export function predatorTypeExists(key: string) {
    return getPredatorType(key) !== undefined;
}

export function clanAllowed(predatorTypeKey: string, clanKey: string) {

    const definition = getPredatorType(predatorTypeKey);

    if (!definition) {
        return false;
    }

    const excluded =
        definition.restrictions?.excludedClans ?? [];

    return !excluded.includes(clanKey);
}

export function resolveChoice(
  choice: PredatorTypeChoice,
  context: Record<string, unknown>,
): PredatorTypeChoiceGrant | null {

    for (const option of choice.options) {

        if (!option.when) {
            return option.grant;
        }

        let ok = true;

        for (const [k,v] of Object.entries(option.when)) {

            if (context[k] !== v) {
                ok = false;
                break;
            }

        }

        if (ok) {
            return option.grant;
        }
    }

    return null;
}

export function resolvePredatorChoices(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
): PredatorTypeChoiceGrant[] {

    const definition = getPredatorType(predatorTypeKey);

    if (!definition) {
        return [];
    }

    return (definition.choices ?? [])
        .map(choice => resolveChoice(choice, context))
        .filter(
            (
                grant,
            ): grant is PredatorTypeChoiceGrant =>
                grant !== null,
        );

}

export function predatorPendingReferences(
  predatorTypeKey: string,
): string[] {

    const definition = getPredatorType(predatorTypeKey);

    if(!definition){
        return [];
    }

    return (definition.pendingReferences ?? [])
        .map(x=>x.definitionKey);

}

export function humanityAllowed(
  predatorTypeKey: string,
  humanity: number,
): boolean {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return false
  }

  const minimum =
    definition.restrictions
      ?.minimumHumanity

  const maximum =
    definition.restrictions
      ?.maximumHumanity

  if (
    minimum !== undefined &&
    humanity < minimum
  ) {
    return false
  }

  if (
    maximum !== undefined &&
    humanity > maximum
  ) {
    return false
  }

  return true
}

export function bloodPotencyAllowed(
  predatorTypeKey: string,
  bloodPotency: number,
): boolean {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return false
  }

  const minimum =
    definition.restrictions
      ?.minimumBloodPotency

  const maximum =
    definition.restrictions
      ?.maximumBloodPotency

  if (
    minimum !== undefined &&
    bloodPotency < minimum
  ) {
    return false
  }

  if (
    maximum !== undefined &&
    bloodPotency > maximum
  ) {
    return false
  }

  return true
}

export function predatorTypeRequiresStorytellerApproval(
  predatorTypeKey: string,
): boolean {
  return (
    getPredatorType(predatorTypeKey)
      ?.restrictions
      ?.requiresStorytellerApproval === true
  )
}

export function resolvePredatorTypeHumanityModifier(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
  selections: PredatorTypeChoiceSelections = {},
): number {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return 0
  }

  const choiceModifier =
    resolveSelectedPredatorChoices(
      predatorTypeKey,
      context,
      selections,
    )
      .filter(
        (
          grant,
        ): grant is Extract<
          PredatorTypeChoiceGrant,
          {
            type: 'humanity'
          }
        > =>
          grant.type === 'humanity',
      )
      .reduce(
        (
          total,
          grant,
        ) =>
          total + grant.modifier,
        0,
      )

  return (
    definition.fixedGrants
      ?.humanityModifier ?? 0
  ) + choiceModifier
}

export function resolvePredatorTypeBloodPotencyModifier(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
  selections: PredatorTypeChoiceSelections = {},
): number {

  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return 0
  }

  const choiceModifier =
    resolveSelectedPredatorChoices(
      predatorTypeKey,
      context,
      selections,
    )
      .filter(
        (
          grant,
        ): grant is Extract<
          PredatorTypeChoiceGrant,
          {
            type: 'bloodPotency'
          }
        > =>
          grant.type === 'bloodPotency',
      )
      .reduce(
        (
          total,
          grant,
        ) =>
          total + grant.modifier,
        0,
      )

  return (
    definition.fixedGrants
      ?.bloodPotencyModifier ?? 0
  ) + choiceModifier
}

/*
 * Resuelve una opción de reparto a definiciones reales
 * del catálogo de Ventajas.
 *
 * El motor acepta dos formas equivalentes:
 *
 * - definitionKey: una definición concreta;
 * - family: todas las definiciones de una familia funcional.
 *
 * La categoría declarada en el Tipo de Depredador debe
 * coincidir con la categoría real de la definición.
 */
export function resolvePredatorTypePointDistributionOptionDefinitions(
  option: PredatorTypePointDistributionOption,
): CharacterAdvantageDefinition[] {
  return characterAdvantageDefinitions.filter(
    definition => {
      if (
        definition.category !==
        option.category
      ) {
        return false
      }

      if (
        'definitionKey' in option &&
        option.definitionKey !== undefined
      ) {
        return (
          definition.key ===
          option.definitionKey
        )
      }

      if (
        'family' in option &&
        option.family !== undefined
      ) {
        return (
          definition.families
            ?.includes(option.family) ===
          true
        )
      }

      return false
    },
  )
}

/*
 * Resuelve todas las opciones de una distribución y elimina
 * posibles duplicados cuando una definición aparece tanto
 * de forma explícita como mediante una familia.
 */
export function resolvePredatorTypePointDistributionDefinitions(
  distribution: PredatorTypePointDistributionGrant,
): CharacterAdvantageDefinition[] {
  const definitionsByKey =
    new Map<
      string,
      CharacterAdvantageDefinition
    >()

  for (
    const option of
    distribution.options
  ) {
    for (
      const definition of
      resolvePredatorTypePointDistributionOptionDefinitions(
        option,
      )
    ) {
      definitionsByKey.set(
        definition.key,
        definition,
      )
    }
  }

  return [
    ...definitionsByKey.values(),
  ]
}

export interface PredatorTypePointDistributionValidationResult {
  valid: boolean
  errors: string[]
}

/*
 * Valida la configuración estructural de una bolsa de reparto.
 *
 * Esta validación se aplica a las definiciones del catálogo,
 * antes de comprobar cómo ha repartido los puntos el jugador.
 */
export function validatePredatorTypePointDistributionGrant(
  distribution: PredatorTypePointDistributionGrant,
): PredatorTypePointDistributionValidationResult {
  const errors: string[] = []

  if (
    !Number.isInteger(distribution.points) ||
    distribution.points <= 0
  ) {
    errors.push(
      'La distribución debe conceder un número entero positivo de puntos.',
    )
  }

  if (distribution.options.length === 0) {
    errors.push(
      'La distribución debe contener al menos una opción.',
    )
  }

  distribution.options.forEach(
    (
      option,
      index,
    ) => {
      const optionLabel =
        `Opción ${index + 1}`

      if (
        option.maximumRating !== undefined &&
        (
          !Number.isInteger(
            option.maximumRating,
          ) ||
          option.maximumRating <= 0
        )
      ) {
        errors.push(
          `${optionLabel}: maximumRating debe ser un entero positivo.`,
        )
      }

      const definitions =
        resolvePredatorTypePointDistributionOptionDefinitions(
          option,
        )

      if (definitions.length === 0) {
        if (
          'definitionKey' in option &&
          option.definitionKey !== undefined
        ) {
          errors.push(
            `${optionLabel}: no existe una definición compatible para "${option.definitionKey}".`,
          )
        } else if (
          'family' in option &&
          option.family !== undefined
        ) {
          errors.push(
            `${optionLabel}: la familia "${option.family}" no contiene definiciones compatibles.`,
          )
        } else {
          errors.push(
            `${optionLabel}: no define definitionKey ni family.`,
          )
        }

        return
      }

      if (
        option.maximumRating !== undefined
      ) {
        const hasLegalRating =
          definitions.some(
            definition =>
              definition.allowedRatings.some(
                rating =>
                  rating <=
                  option.maximumRating!,
              ),
          )

        if (!hasLegalRating) {
          errors.push(
            `${optionLabel}: maximumRating no permite ninguna puntuación legal.`,
          )
        }
      }
    },
  )

  return {
    valid: errors.length === 0,
    errors,
  }
}

/*
 * Valida todas las bolsas de reparto resueltas para un
 * Tipo de Depredador concreto.
 */
/*
 * Valida la asignación realizada por el jugador dentro de
 * una bolsa de reparto.
 *
 * Reglas:
 * - todas las definiciones deben pertenecer a las opciones;
 * - las puntuaciones deben ser enteros positivos;
 * - deben respetarse allowedRatings y maximumRating;
 * - no se permiten definiciones duplicadas;
 * - deben gastarse exactamente todos los puntos.
 */
export function validatePredatorTypePointDistributionAllocation(
  distribution: PredatorTypePointDistributionGrant,
  allocations: readonly PredatorTypePointDistributionAllocation[],
): PredatorTypePointDistributionValidationResult {
  const structuralValidation =
    validatePredatorTypePointDistributionGrant(
      distribution,
    )

  if (!structuralValidation.valid) {
    return structuralValidation
  }

  const errors: string[] = []
  const seenDefinitionKeys =
    new Set<string>()

  for (const allocation of allocations) {
    if (
      seenDefinitionKeys.has(
        allocation.definitionKey,
      )
    ) {
      errors.push(
        `La definición "${allocation.definitionKey}" aparece más de una vez.`,
      )

      continue
    }

    seenDefinitionKeys.add(
      allocation.definitionKey,
    )

    if (
      !Number.isInteger(allocation.rating) ||
      allocation.rating <= 0
    ) {
      errors.push(
        `"${allocation.definitionKey}" debe tener una puntuación entera positiva.`,
      )

      continue
    }

    const matchingOptions =
      distribution.options.filter(
        option =>
          resolvePredatorTypePointDistributionOptionDefinitions(
            option,
          ).some(
            definition =>
              definition.key ===
              allocation.definitionKey,
          ),
      )

    if (matchingOptions.length === 0) {
      errors.push(
        `"${allocation.definitionKey}" no pertenece a esta distribución.`,
      )

      continue
    }

    const definition =
      characterAdvantageDefinitions.find(
        candidate =>
          candidate.key ===
          allocation.definitionKey,
      )

    if (!definition) {
      errors.push(
        `No existe la definición "${allocation.definitionKey}".`,
      )

      continue
    }

    if (
      !definition.allowedRatings.includes(
        allocation.rating,
      )
    ) {
      errors.push(
        `"${allocation.definitionKey}" no admite puntuación ${allocation.rating}.`,
      )
    }

    const maximumRatings =
      matchingOptions
        .map(option => option.maximumRating)
        .filter(
          (
            maximumRating,
          ): maximumRating is number =>
            maximumRating !== undefined,
        )

    if (
      maximumRatings.length > 0 &&
      allocation.rating >
        Math.max(...maximumRatings)
    ) {
      errors.push(
        `"${allocation.definitionKey}" supera maximumRating.`,
      )
    }
  }

  const spentPoints =
    allocations.reduce(
      (
        total,
        allocation,
      ) =>
        total +
        (
          Number.isInteger(
            allocation.rating,
          ) &&
          allocation.rating > 0
            ? allocation.rating
            : 0
        ),
      0,
    )

  if (
    spentPoints !==
    distribution.points
  ) {
    errors.push(
      `Deben gastarse exactamente ${distribution.points} puntos; se han gastado ${spentPoints}.`,
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validatePredatorTypePointDistributions(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
  selections: PredatorTypeChoiceSelections = {},
): PredatorTypePointDistributionValidationResult {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return {
      valid: false,
      errors: [
        `No existe el Tipo de Depredador "${predatorTypeKey}".`,
      ],
    }
  }

  const errors =
    resolvePredatorTypePointDistributions(
      predatorTypeKey,
      context,
      selections,
    ).flatMap(
      (
        distribution,
        index,
      ) =>
        validatePredatorTypePointDistributionGrant(
          distribution,
        ).errors.map(
          error =>
            `Distribución ${index + 1}: ${error}`,
        ),
    )

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function resolvePredatorTypePointDistributions(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
  selections: PredatorTypeChoiceSelections = {},
): PredatorTypePointDistributionGrant[] {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return []
  }

  const fixed =
    definition.fixedGrants
      ?.pointDistributions ?? []

  const selected =
    resolveSelectedPredatorChoices(
      predatorTypeKey,
      context,
      selections,
    )
      .filter(
        (
          grant,
        ): grant is PredatorTypePointDistributionGrant =>
          grant.type ===
          'pointDistribution',
      )

  return [
    ...fixed,
    ...selected,
  ]
}

export function normalizePredatorTypeForCharacter(
  predatorTypeKey: string,
  clanKey: string | null,
): string {
  if (predatorTypeKey === '') {
    return ''
  }

  if (clanKey === null) {
    return ''
  }

  if (!predatorTypeExists(predatorTypeKey)) {
    return ''
  }

  if (!clanAllowed(predatorTypeKey, clanKey)) {
    return ''
  }

  return predatorTypeKey
}

export function removePredatorTypeAdvantages(
  advantages: CharacterAdvantagesDraft,
): CharacterAdvantagesDraft {
  return {
    ...advantages,
    selections: advantages.selections.filter(
      selection =>
        selection.origin !== 'predatorType',
    ),
  }
}

export function removePredatorTypeDisciplines(
  disciplines: CharacterDisciplinesDraft,
): CharacterDisciplinesDraft {
  return disciplines.filter(
    discipline =>
      discipline.origin !== 'predatorType',
  )
}

export function removePredatorTypeSpecialties(
  specialties: CharacterSkillSpecialtiesDraft,
): CharacterSkillSpecialtiesDraft {
  return specialties.filter(
    specialty =>
      specialty.origin !== 'predatorType',
  )
}

export interface PredatorTypeOwnedEffects {
  advantages: CharacterAdvantagesDraft
  disciplines: CharacterDisciplinesDraft
  skillSpecialties: CharacterSkillSpecialtiesDraft
}

export function removePredatorTypeEffects(
  effects: PredatorTypeOwnedEffects,
): PredatorTypeOwnedEffects {
  return {
    advantages:
      removePredatorTypeAdvantages(
        effects.advantages,
      ),

    disciplines:
      removePredatorTypeDisciplines(
        effects.disciplines,
      ),

    skillSpecialties:
      removePredatorTypeSpecialties(
        effects.skillSpecialties,
      ),
  }
}

export type PredatorTypeChoiceSelections =
  Record<string, number>

export function resolveSelectedPredatorChoices(
  predatorTypeKey: string,
  context: Record<string, unknown> = {},
  selections: PredatorTypeChoiceSelections = {},
): PredatorTypeChoiceGrant[] {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return []
  }

  const grants: PredatorTypeChoiceGrant[] = []

  for (const choice of definition.choices ?? []) {
    const selectableOptions =
      choice.options.filter(
        option =>
          option.when === undefined,
      )

    const hasMultipleUnconditionalOptions =
      selectableOptions.length > 1

    if (hasMultipleUnconditionalOptions) {
      const selectedIndex =
        selections[choice.id]

      if (
        selectedIndex === undefined ||
        selectedIndex < 0 ||
        selectedIndex >=
          choice.options.length
      ) {
        continue
      }

      const selectedOption =
        choice.options[selectedIndex]

      if (selectedOption.when !== undefined) {
        continue
      }

      grants.push(selectedOption.grant)
      continue
    }

    const resolved =
      resolveChoice(
        choice,
        context,
      )

    if (resolved !== null) {
      grants.push(resolved)
    }
  }

  return grants
}

function createPredatorTypeSelectionId(
  predatorTypeKey: string,
  kind: string,
  key: string,
): string {
  return [
    'predatorType',
    predatorTypeKey,
    kind,
    key,
  ].join(':')
}

export function applyPredatorTypeAdvantages(
  predatorTypeKey: string,
  clanKey: string | null,
  advantages: CharacterAdvantagesDraft,
  choiceSelections: PredatorTypeChoiceSelections = {},
): CharacterAdvantagesDraft {
  const cleaned =
    removePredatorTypeAdvantages(
      advantages,
    )

  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return cleaned
  }

  const pendingReferences =
    new Set(
      predatorPendingReferences(
        predatorTypeKey,
      ),
    )

  const fixedGrants =
    definition.fixedGrants
      ?.advantages ?? []

  const selectedGrants =
    clanKey === null
      ? []
      : resolveSelectedPredatorChoices(
          predatorTypeKey,
          {
            clan: clanKey,
          },
          choiceSelections,
        )
          .filter(
            (
              grant,
            ): grant is Extract<
              PredatorTypeChoiceGrant,
              {
                type: 'advantage'
              }
            > =>
              grant.type ===
              'advantage',
          )

  const selections:
    CharacterAdvantageSelectionDraft[] =
      [
        ...fixedGrants,
        ...selectedGrants,
      ]
        .filter(
          grant =>
            !pendingReferences.has(
              grant.definitionKey,
            ),
        )
        .map(
          (
            grant,
            index,
          ) => ({
            selectionId:
              createPredatorTypeSelectionId(
                predatorTypeKey,
                'advantage',
                [
                  grant.definitionKey,
                  index,
                ].join(':'),
              ),

            definitionKey:
              grant.definitionKey,

            category:
              grant.category,

            rating:
              grant.rating,

            origin:
              'predatorType',
          }),
        )

  return {
    ...cleaned,

    selections: [
      ...cleaned.selections,
      ...selections,
    ],
  }
}

export function applyPredatorTypeDisciplines(
  predatorTypeKey: string,
  clanKey: string | null,
  disciplines: CharacterDisciplinesDraft,
  selections: PredatorTypeChoiceSelections = {},
): CharacterDisciplinesDraft {
  const cleaned =
    removePredatorTypeDisciplines(
      disciplines,
    )

  if (
    predatorTypeKey === '' ||
    clanKey === null ||
    !clanAllowed(
      predatorTypeKey,
      clanKey,
    )
  ) {
    return cleaned
  }

  const grants =
    resolveSelectedPredatorChoices(
      predatorTypeKey,
      {
        clan: clanKey,
      },
      selections,
    )

  const predatorDisciplines:
    CharacterDisciplineDraft[] =
      grants
        .filter(
          (
            grant,
          ): grant is Extract<
            PredatorTypeChoiceGrant,
            {
              type: 'discipline'
            }
          > =>
            grant.type ===
            'discipline',
        )
        .map(
          grant => ({
            key:
              grant.disciplineKey,

            value:
              grant.dots,

            powerKeys:
              [],

            origin:
              'predatorType',
          }),
        )

  return [
    ...cleaned,
    ...predatorDisciplines,
  ]
}

export function applyPredatorTypeSpecialties(
  predatorTypeKey: string,
  clanKey: string | null,
  specialties: CharacterSkillSpecialtiesDraft,
  selections: PredatorTypeChoiceSelections = {},
): CharacterSkillSpecialtiesDraft {
  const cleaned =
    removePredatorTypeSpecialties(
      specialties,
    )

  if (
    predatorTypeKey === '' ||
    clanKey === null ||
    !clanAllowed(
      predatorTypeKey,
      clanKey,
    )
  ) {
    return cleaned
  }

  const grants =
    resolveSelectedPredatorChoices(
      predatorTypeKey,
      {
        clan: clanKey,
      },
      selections,
    )

  const predatorSpecialties:
    SkillSpecialty[] =
      grants
        .filter(
          (
            grant,
          ): grant is Extract<
            PredatorTypeChoiceGrant,
            {
              type: 'specialty'
            }
          > =>
            grant.type ===
            'specialty',
        )
        .map(
          grant => ({
            id:
              createPredatorTypeSelectionId(
                predatorTypeKey,
                'specialty',
                [
                  grant.skillKey,
                  grant.name,
                ].join(':'),
              ),

            skillKey:
              grant.skillKey,

            name:
              grant.name,

            origin:
              'predatorType',
          }),
        )

  return [
    ...cleaned,
    ...predatorSpecialties,
  ]
}

export interface ApplyPredatorTypeEffectsInput
  extends PredatorTypeOwnedEffects {
  predatorTypeKey: string
  clanKey: string | null
  choiceSelections?: PredatorTypeChoiceSelections
}

export function applyPredatorTypeEffects(
  input: ApplyPredatorTypeEffectsInput,
): PredatorTypeOwnedEffects {
  const choiceSelections =
    input.choiceSelections ?? {}

  const validPredatorTypeKey =
    normalizePredatorTypeForCharacter(
      input.predatorTypeKey,
      input.clanKey,
    )

  if (validPredatorTypeKey === '') {
    return removePredatorTypeEffects(
      input,
    )
  }

  return {
    advantages:
      applyPredatorTypeAdvantages(
        validPredatorTypeKey,
        input.clanKey,
        input.advantages,
        choiceSelections,
      ),

    disciplines:
      applyPredatorTypeDisciplines(
        validPredatorTypeKey,
        input.clanKey,
        input.disciplines,
        choiceSelections,
      ),

    skillSpecialties:
      applyPredatorTypeSpecialties(
        validPredatorTypeKey,
        input.clanKey,
        input.skillSpecialties,
        choiceSelections,
      ),
  }
}


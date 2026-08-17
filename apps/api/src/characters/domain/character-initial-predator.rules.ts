import type {
  CharacterRulesPredatorTypeChoiceGrant,
  CharacterRulesPredatorTypeDefinition,
} from '@v5r/character-rules'

import {
  createCharacterAdvantageValidationContributor,
} from './character-advantage-validation.contributor'

import {
  characterBloodPotencyRanges,
} from './character-blood-potency.rules'

import {
  validateCharacterPredatorTypeState,
} from './character-dependency-validation.contributor'

import {
  validateCharacterHumanityState,
} from './character-humanity-state.rules'

import {
  resolvePredatorTypeSpecialtyGrant,
} from './predator-type-skill-grant.rules'

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import {
  CHARACTER_SKILL_KEYS,
} from './persisted-character.types'

import type {
  CharacterSkillKey,
  PersistedCharacterAdvantages,
  PersistedCharacterDraft,
  PersistedCharacterSkillSpecialty,
} from './persisted-character.types'

import type {
  CharacterValidationIssue,
} from './character-validation.types'

export interface InitialPredatorAdoptionInput {
  readonly predatorTypeKey: string
  readonly predatorTypeChoices:
    Readonly<Record<string, number>>
  readonly disciplinePowerKey: string
  readonly advantages:
    PersistedCharacterAdvantages
}

export interface InitialPredatorAdoptionPlan {
  readonly predatorTypeKey: string
  readonly predatorTypeChoices:
    Readonly<Record<string, number>>
  readonly humanityValue: number
  readonly bloodPotency: number
  readonly bonusSkillKey:
    CharacterSkillKey | null
  readonly specialty:
    PersistedCharacterSkillSpecialty | null
  readonly discipline: {
    readonly disciplineKey: string
    readonly rating: number
    readonly powerKey: string
  }
  readonly advantages:
    PersistedCharacterAdvantages
}

export interface InitialPredatorAdoptionAnalysis {
  readonly plan:
    InitialPredatorAdoptionPlan | null
  readonly issues:
    readonly CharacterValidationIssue[]
}

function errorIssue(
  code: string,
  field: string,
  message: string,
): CharacterValidationIssue {
  return {
    code,
    severity: 'error',
    section: 'dependencies',
    field,
    message,
  }
}

function optionMatchesClan(
  option: {
    readonly when?: {
      readonly clan?: string
    }
  },
  clanKey: string,
): boolean {
  return (
    option.when?.clan === undefined ||
    option.when.clan === clanKey
  )
}

function resolveSelectedGrants(
  definition:
    CharacterRulesPredatorTypeDefinition,
  clanKey: string,
  requested:
    Readonly<Record<string, number>>,
): {
  readonly choices:
    Readonly<Record<string, number>>
  readonly grants:
    readonly CharacterRulesPredatorTypeChoiceGrant[]
  readonly issues:
    readonly CharacterValidationIssue[]
} {
  const choices: Record<string, number> = {}
  const grants:
    CharacterRulesPredatorTypeChoiceGrant[] = []
  const issues:
    CharacterValidationIssue[] = []

  const definitions =
    definition.choices ?? []

  const knownChoiceIds =
    new Set(
      definitions.map(({ id }) => id),
    )

  for (const key of Object.keys(requested)) {
    if (!knownChoiceIds.has(key)) {
      issues.push(
        errorIssue(
          'INITIAL_PREDATOR_CHOICE_UNKNOWN',
          'creation.predatorTypeChoices',
          'La elección de Tipo de Depredador no existe.',
        ),
      )
    }
  }

  for (const choice of definitions) {
    if (
      choice.minimumSelections !== 1 ||
      choice.maximumSelections !== 1
    ) {
      issues.push(
        errorIssue(
          'INITIAL_PREDATOR_CHOICE_CARDINALITY_UNSUPPORTED',
          'creation.predatorTypeChoices',
          'La cardinalidad de la elección de Tipo de Depredador no puede representarse con el contrato vigente.',
        ),
      )
      continue
    }

    const available =
      choice.options
        .map(
          (option, index) => ({
            option,
            index,
          }),
        )
        .filter(
          ({ option }) =>
            optionMatchesClan(
              option,
              clanKey,
            ),
        )

    if (available.length === 0) {
      issues.push(
        errorIssue(
          'INITIAL_PREDATOR_CHOICE_UNAVAILABLE',
          'creation.predatorTypeChoices',
          'El Tipo de Depredador no dispone de una opción válida para el Clan actual.',
        ),
      )
      continue
    }

    const requestedIndex =
      requested[choice.id]

    let selected:
      (typeof available)[number] | undefined

    if (available.length === 1) {
      selected = available[0]

      if (
        requestedIndex !== undefined &&
        requestedIndex !== selected.index
      ) {
        issues.push(
          errorIssue(
            'INITIAL_PREDATOR_CHOICE_INVALID',
            'creation.predatorTypeChoices',
            'La opción elegida no es válida para el Clan actual.',
          ),
        )
        continue
      }
    } else {
      if (
        requestedIndex === undefined ||
        !Number.isInteger(requestedIndex)
      ) {
        issues.push(
          errorIssue(
            'INITIAL_PREDATOR_CHOICE_REQUIRED',
            'creation.predatorTypeChoices',
            'Debe elegirse explícitamente una opción del Tipo de Depredador.',
          ),
        )
        continue
      }

      selected =
        available.find(
          ({ index }) =>
            index === requestedIndex,
        )

      if (selected === undefined) {
        issues.push(
          errorIssue(
            'INITIAL_PREDATOR_CHOICE_INVALID',
            'creation.predatorTypeChoices',
            'La opción elegida no es válida para el Clan actual.',
          ),
        )
        continue
      }
    }

    choices[choice.id] =
      selected.index

    grants.push(
      selected.option.grant,
    )
  }

  return {
    choices,
    grants,
    issues,
  }
}

function effectiveDisciplineRating(
  character: PersistedCharacterDraft,
  disciplineKey: string,
  additionalRating = 0,
): number {
  return (
    character.disciplines
      .filter(
        (discipline) =>
          discipline.disciplineKey ===
            disciplineKey,
      )
      .reduce(
        (total, discipline) =>
          total + discipline.rating,
        0,
      ) + additionalRating
  )
}

function validatePredatorPower(
  character: PersistedCharacterDraft,
  disciplineGrant: Extract<
    CharacterRulesPredatorTypeChoiceGrant,
    {
      readonly type: 'discipline'
    }
  >,
  powerKey: string,
  catalog: CharacterRulesCatalog,
): readonly CharacterValidationIssue[] {
  const issues:
    CharacterValidationIssue[] = []

  const learned =
    new Set(
      character.disciplines.flatMap(
        ({ powerKeys }) => powerKeys,
      ),
    )

  if (learned.has(powerKey)) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_POWER_DUPLICATE',
        'disciplines',
        'El Poder concedido por el Tipo de Depredador ya está adquirido.',
      ),
    )
    return issues
  }

  const power =
    catalog.disciplineCatalog.powers.find(
      ({ key }) => key === powerKey,
    )

  if (power === undefined) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_POWER_UNKNOWN',
        'disciplines',
        'El Poder elegido no existe en el catálogo canónico.',
      ),
    )
    return issues
  }

  if (!power.active) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_POWER_INACTIVE',
        'disciplines',
        'El Poder elegido no está activo.',
      ),
    )
  }

  if (
    power.disciplineKey !==
      disciplineGrant.disciplineKey
  ) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_POWER_WRONG_DISCIPLINE',
        'disciplines',
        'El Poder elegido no pertenece a la Disciplina concedida.',
      ),
    )
  }

  const effective =
    effectiveDisciplineRating(
      character,
      disciplineGrant.disciplineKey,
      disciplineGrant.dots,
    )

  if (power.level > effective) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_POWER_LEVEL_UNMET',
        'disciplines',
        'La puntuación efectiva de Disciplina no permite adquirir el Poder elegido.',
      ),
    )
  }

  for (
    const prerequisite of
      power.requirements
        ?.prerequisitePowerKeys ?? []
  ) {
    if (!learned.has(prerequisite)) {
      issues.push(
        errorIssue(
          'INITIAL_PREDATOR_POWER_PREREQUISITE_MISSING',
          'disciplines',
          'Falta un Poder prerrequisito para la concesión del Tipo de Depredador.',
        ),
      )
    }
  }

  const amalgam =
    power.requirements?.amalgam

  if (
    amalgam !== undefined &&
    effectiveDisciplineRating(
      character,
      amalgam.disciplineKey,
      amalgam.disciplineKey ===
        disciplineGrant.disciplineKey
        ? disciplineGrant.dots
        : 0,
    ) < amalgam.minimumLevel
  ) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_POWER_AMALGAM_UNMET',
        'disciplines',
        'No se cumple la Disciplina requerida por la Amalgama.',
      ),
    )
  }

  return issues
}

function sumSelectedModifier(
  grants:
    readonly CharacterRulesPredatorTypeChoiceGrant[],
  type: 'humanity' | 'bloodPotency',
): number {
  return grants
    .filter(
      (
        grant,
      ): grant is Extract<
        CharacterRulesPredatorTypeChoiceGrant,
        {
          readonly type:
            | 'humanity'
            | 'bloodPotency'
        }
      > =>
        grant.type === type,
    )
    .reduce(
      (total, grant) =>
        total + grant.modifier,
      0,
    )
}

export function analyzeInitialPredatorAdoption(
  character: PersistedCharacterDraft,
  input: InitialPredatorAdoptionInput,
  catalog: CharacterRulesCatalog,
): InitialPredatorAdoptionAnalysis {
  const issues:
    CharacterValidationIssue[] = []

  if (character.identity.predatorTypeKey !== null) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_ALREADY_ADOPTED',
        'identity.predatorTypeKey',
        'El Tipo de Depredador ya fue adoptado.',
      ),
    )
  }

  const clanKey =
    character.identity.clanKey

  if (clanKey === null) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_CLAN_PENDING',
        'identity.clanKey',
        'Debe resolverse el Clan antes del Tipo de Depredador.',
      ),
    )
  }

  if (character.identity.generation === null) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_GENERATION_PENDING',
        'identity.generation',
        'Debe resolverse la Generación antes del Tipo de Depredador.',
      ),
    )
  }

  if (character.blood === null) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_BLOOD_PENDING',
        'blood',
        'Debe establecerse el estado de Sangre antes del Tipo de Depredador.',
      ),
    )
  }

  if (clanKey === 'thinBlood') {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_THIN_BLOOD_FORBIDDEN',
        'identity.predatorTypeKey',
        'Los Sangre Débil no pueden tener Tipo de Depredador.',
      ),
    )
  }

  if (
    input.advantages.selections.some(
      ({ origin }) =>
        origin !== 'predatorType',
    )
  ) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_ADVANTAGES_ORIGIN_INVALID',
        'advantages',
        'Las concesiones suministradas por esta operación deben tener origen predatorType.',
      ),
    )
  }

  const definition =
    catalog.dependencyCatalog
      .predatorTypes.find(
        ({ key }) =>
          key === input.predatorTypeKey,
      )

  if (definition === undefined) {
    issues.push(
      errorIssue(
        'CHARACTER_PREDATOR_TYPE_UNKNOWN',
        'identity.predatorTypeKey',
        'El Tipo de Depredador no existe en el catálogo canónico.',
      ),
    )
  }

  if (
    issues.length > 0 ||
    clanKey === null ||
    character.identity.generation === null ||
    character.blood === null ||
    definition === undefined
  ) {
    return {
      plan: null,
      issues,
    }
  }

  const selected =
    resolveSelectedGrants(
      definition,
      clanKey,
      input.predatorTypeChoices,
    )

  issues.push(...selected.issues)

  const projectedForSpecialty = {
    ...character,
    identity: {
      ...character.identity,
      predatorTypeKey:
        definition.key,
    },
    creation: {
      ...character.creation,
      predatorTypeChoices: {
        ...selected.choices,
      },
    },
  }

  const specialtyGrant =
    resolvePredatorTypeSpecialtyGrant(
      projectedForSpecialty,
      definition,
    )

  if (specialtyGrant === null) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_SPECIALTY_GRANT_MISSING',
        'creation.predatorTypeChoices',
        'No se pudo resolver la concesión canónica de Habilidad o Especialidad.',
      ),
    )
  }

  const disciplineGrants =
    selected.grants.filter(
      (
        grant,
      ): grant is Extract<
        CharacterRulesPredatorTypeChoiceGrant,
        {
          readonly type: 'discipline'
        }
      > =>
        grant.type === 'discipline',
    )

  if (disciplineGrants.length !== 1) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_DISCIPLINE_GRANT_INVALID',
        'creation.predatorTypeChoices',
        'Debe resolverse exactamente una concesión de Disciplina del Tipo de Depredador.',
      ),
    )
  }

  if (
    specialtyGrant === null ||
    disciplineGrants.length !== 1
  ) {
    return {
      plan: null,
      issues,
    }
  }

  const skillKey =
    specialtyGrant.skillKey as
      CharacterSkillKey

  if (
    !CHARACTER_SKILL_KEYS.includes(
      skillKey,
    )
  ) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_SKILL_UNKNOWN',
        'skills',
        'La Habilidad concedida no existe en el catálogo activo.',
      ),
    )

    return {
      plan: null,
      issues,
    }
  }

  const bonusSkillKey =
    character.skills[skillKey] === 0
      ? skillKey
      : null

  const specialty:
    PersistedCharacterSkillSpecialty | null =
      bonusSkillKey === null
        ? {
            id: [
              'predatorType',
              definition.key,
              'specialty',
              skillKey,
            ].join(':'),
            skillKey,
            name: specialtyGrant.name,
            origin: 'predatorType',
          }
        : null

  const disciplineGrant =
    disciplineGrants[0]

  issues.push(
    ...validatePredatorPower(
      character,
      disciplineGrant,
      input.disciplinePowerKey,
      catalog,
    ),
  )

  const humanityModifier =
    (definition.fixedGrants
      ?.humanityModifier ?? 0) +
    sumSelectedModifier(
      selected.grants,
      'humanity',
    )

  const bloodPotencyModifier =
    (definition.fixedGrants
      ?.bloodPotencyModifier ?? 0) +
    sumSelectedModifier(
      selected.grants,
      'bloodPotency',
    )

  const humanityValue =
    character.humanity.value +
    humanityModifier

  if (
    validateCharacterHumanityState(
      humanityValue,
      character.humanity.stains,
    ).length > 0
  ) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_HUMANITY_INVALID',
        'humanity',
        'El modificador del Tipo de Depredador produciría un estado de Humanidad inválido.',
      ),
    )
  }

  const bloodPotency =
    character.blood.bloodPotency +
    bloodPotencyModifier

  const generationRange =
    characterBloodPotencyRanges[
      character.identity.generation
    ]

  if (
    generationRange === undefined ||
    bloodPotency <
      generationRange.min ||
    bloodPotency >
      generationRange.max
  ) {
    issues.push(
      errorIssue(
        'INITIAL_PREDATOR_BLOOD_POTENCY_INVALID',
        'blood.bloodPotency',
        'El modificador del Tipo de Depredador produciría una Potencia de Sangre incompatible con la Generación.',
      ),
    )
  }

  const projected: PersistedCharacterDraft = {
    ...character,
    identity: {
      ...character.identity,
      predatorTypeKey:
        definition.key,
    },
    creation: {
      ...character.creation,
      predatorTypeChoices: {
        ...selected.choices,
      },
    },
    skills:
      bonusSkillKey === null
        ? {
            ...character.skills,
          }
        : {
            ...character.skills,
            [bonusSkillKey]:
              character.skills[
                bonusSkillKey
              ] + 1,
          },
    skillSpecialties:
      specialty === null
        ? [
            ...character.skillSpecialties,
          ]
        : [
            ...character.skillSpecialties,
            specialty,
          ],
    disciplines: [
      ...character.disciplines,
      {
        disciplineKey:
          disciplineGrant.disciplineKey,
        rating:
          disciplineGrant.dots,
        powerKeys: [
          input.disciplinePowerKey,
        ],
        origin: 'predatorType',
      },
    ],
    advantages: {
      selections: [
        ...character.advantages.selections,
        ...input.advantages.selections,
      ],
    },
    humanity: {
      ...character.humanity,
      value: humanityValue,
    },
    blood: {
      ...character.blood,
      bloodPotency,
    },
  }

  const advantageSection =
    createCharacterAdvantageValidationContributor(
      catalog,
    ).validate(
      projected,
      'editing',
    )[0]

  if (advantageSection !== undefined) {
    issues.push(
      ...advantageSection.issues,
    )
  }

  issues.push(
    ...validateCharacterPredatorTypeState(
      projected,
      'activation',
      catalog,
    ),
  )

  if (issues.length > 0) {
    return {
      plan: null,
      issues,
    }
  }

  return {
    plan: {
      predatorTypeKey:
        definition.key,
      predatorTypeChoices: {
        ...selected.choices,
      },
      humanityValue,
      bloodPotency,
      bonusSkillKey,
      specialty,
      discipline: {
        disciplineKey:
          disciplineGrant.disciplineKey,
        rating:
          disciplineGrant.dots,
        powerKey:
          input.disciplinePowerKey,
      },
      advantages: {
        selections:
          input.advantages.selections.map(
            (selection) => ({
              ...selection,
              details:
                selection.details === null
                  ? null
                  : structuredClone(
                      selection.details,
                    ),
            }),
          ),
      },
    },
    issues: [],
  }
}

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
  PersistedCharacterDiscipline,
  PersistedCharacterDraft,
  PersistedCharacterThinBloodAlchemy,
  PersistedCharacterThinBloodTrait,
} from './persisted-character.types'

export interface CharacterThinBloodRuleIssue {
  readonly code: string
  readonly message: string
  readonly details?: Readonly<
    Record<
      string,
      string | number | boolean | null
    >
  >
  readonly completion?: boolean
}

function ruleIssue(
  code: string,
  message: string,
  details?: Readonly<
    Record<
      string,
      string | number | boolean | null
    >
  >,
  completion = false,
): CharacterThinBloodRuleIssue {
  return {
    code,
    message,
    details,
    completion,
  }
}

function duplicateKeys(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
): readonly string[] {
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

function realClanKeys(
  catalog: CharacterRulesCatalog,
): ReadonlySet<string> {
  return new Set(
    catalog.disciplineCatalog
      .clanAffinities
      .filter(
        ({ kind }) => kind === 'clan',
      )
      .map(
        ({ clanKey }) => clanKey,
      ),
  )
}

function affinityDisciplineKeys(
  catalog: CharacterRulesCatalog,
): ReadonlySet<string> {
  return new Set(
    catalog.disciplineCatalog
      .clanAffinities
      .filter(
        ({ kind }) => kind === 'clan',
      )
      .flatMap(
        ({ disciplineKeys }) =>
          disciplineKeys,
      ),
  )
}

export function validateThinBloodTraitState(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
  catalog: CharacterRulesCatalog,
): readonly CharacterThinBloodRuleIssue[] {
  const issues:
    CharacterThinBloodRuleIssue[] = []

  const definitions = new Map(
    catalog.dependencyCatalog
      .thinBloodTraits
      .map(
        (definition) => [
          definition.key,
          definition,
        ] as const,
      ),
  )

  const selectedKeys = new Set(
    traits.map(
      ({ definitionKey }) =>
        definitionKey,
    ),
  )

  for (
    const definitionKey of
      duplicateKeys(traits)
  ) {
    issues.push(
      ruleIssue(
        'CHARACTER_THIN_BLOOD_TRAIT_DUPLICATE',
        'Un Mérito o Defecto de Sangre Débil no puede repetirse.',
        { definitionKey },
      ),
    )
  }

  let meritCount = 0
  let flawCount = 0

  for (const trait of traits) {
    const definition =
      definitions.get(
        trait.definitionKey,
      )

    if (definition === undefined) {
      issues.push(
        ruleIssue(
          'CHARACTER_THIN_BLOOD_TRAIT_UNKNOWN',
          'El rasgo de Sangre Débil no existe en el catálogo canónico.',
          {
            definitionKey:
              trait.definitionKey,
          },
        ),
      )
      continue
    }

    if (definition.category === 'merit') {
      meritCount += 1
    } else {
      flawCount += 1
    }

    for (
      const incompatibleKey of
        definition.incompatibleWithKeys ?? []
    ) {
      if (
        selectedKeys.has(
          incompatibleKey,
        ) &&
        trait.definitionKey <
          incompatibleKey
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_TRAIT_INCOMPATIBLE',
            'La selección contiene rasgos de Sangre Débil incompatibles.',
            {
              definitionKey:
                trait.definitionKey,
              incompatibleWithKey:
                incompatibleKey,
            },
          ),
        )
      }
    }

    const clanCurse =
      trait.clanCurseDetails
    const affinity =
      trait.disciplineAffinityDetails

    if (
      trait.definitionKey ===
        'clan-curse'
    ) {
      if (
        clanCurse === null ||
        clanCurse.clanKey.trim().length === 0
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_CLAN_CURSE_REQUIRED',
            'Maldición de Clan necesita seleccionar un clan.',
          ),
        )
      } else if (
        !realClanKeys(catalog).has(
          clanCurse.clanKey,
        )
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_CLAN_CURSE_UNKNOWN',
            'Maldición de Clan sólo puede adoptar la Prohibición de uno de los clanes.',
            {
              clanKey:
                clanCurse.clanKey,
            },
          ),
        )
      }

      if (affinity !== null) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_TRAIT_DETAILS_CONFLICT',
            'Maldición de Clan no puede contener una Disciplina Afín.',
          ),
        )
      }

      if (
        (
          clanCurse?.clanKey ===
            'brujah' ||
          clanCurse?.clanKey ===
            'gangrel'
        ) &&
        !selectedKeys.has(
          'bestial-temper',
        )
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_BESTIAL_TEMPER_REQUIRED',
            'Esta Maldición de Clan requiere Temperamento Bestial.',
          ),
        )
      }

      if (
        clanCurse?.clanKey ===
          'tremere' &&
        !selectedKeys.has(
          'bonding-blood',
        )
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_BONDING_BLOOD_REQUIRED',
            'La Maldición Tremere requiere Sangre Vinculante.',
          ),
        )
      }

      continue
    }

    if (clanCurse !== null) {
      issues.push(
        ruleIssue(
          'CHARACTER_THIN_BLOOD_CLAN_CURSE_DETAILS_NOT_ALLOWED',
          'Sólo Maldición de Clan puede contener esos detalles.',
          {
            definitionKey:
              trait.definitionKey,
          },
        ),
      )
    }

    if (
      trait.definitionKey ===
        'discipline-affinity'
    ) {
      if (
        affinity === null ||
        affinity.disciplineKey.trim()
          .length === 0 ||
        affinity.powerKey.trim()
          .length === 0
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_REQUIRED',
            'Disciplina Afín necesita una Disciplina y un Poder.',
          ),
        )
        continue
      }

      if (
        !affinityDisciplineKeys(
          catalog,
        ).has(
          affinity.disciplineKey,
        )
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_INVALID',
            'Disciplina Afín sólo puede seleccionar una Disciplina presente como Disciplina de clan.',
            {
              disciplineKey:
                affinity.disciplineKey,
            },
          ),
        )
        continue
      }

      const power =
        catalog.disciplineCatalog
          .powers.find(
            (candidate) =>
              candidate.key ===
                affinity.powerKey,
          )

      if (
        power === undefined ||
        !power.active ||
        power.disciplineKey !==
          affinity.disciplineKey ||
        power.level > 1 ||
        (
          power.requirements
            ?.prerequisitePowerKeys
            ?.length ?? 0
        ) > 0 ||
        power.requirements?.amalgam !==
          undefined
      ) {
        issues.push(
          ruleIssue(
            'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_POWER_INVALID',
            'El Poder elegido para Disciplina Afín no es legal con la puntuación efectiva 1.',
            {
              disciplineKey:
                affinity.disciplineKey,
              powerKey:
                affinity.powerKey,
            },
          ),
        )
      }
    } else if (affinity !== null) {
      issues.push(
        ruleIssue(
          'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_DETAILS_NOT_ALLOWED',
          'Sólo Disciplina Afín puede contener esos detalles.',
          {
            definitionKey:
              trait.definitionKey,
          },
        ),
      )
    }
  }

  if (
    meritCount < 1 ||
    meritCount > 3
  ) {
    issues.push(
      ruleIssue(
        'CHARACTER_THIN_BLOOD_MERIT_COUNT_INVALID',
        'Un Sangre Débil debe seleccionar entre 1 y 3 Méritos de Sangre Débil.',
        {
          meritCount,
        },
        traits.length === 0,
      ),
    )
  }

  if (flawCount !== meritCount) {
    issues.push(
      ruleIssue(
        'CHARACTER_THIN_BLOOD_FLAW_COUNT_INVALID',
        'Un Sangre Débil debe seleccionar la misma cantidad de Defectos que de Méritos de Sangre Débil.',
        {
          meritCount,
          flawCount,
        },
      ),
    )
  }

  return issues
}

function hasAlchemist(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
): boolean {
  return traits.some(
    ({ definitionKey }) =>
      definitionKey ===
        'thin-blood-alchemist',
  )
}

function emptyAlchemy(
  alchemy:
    PersistedCharacterThinBloodAlchemy,
): boolean {
  return (
    alchemy.rating === 0 &&
    alchemy.method === null &&
    alchemy.formulaKeys.length === 0
  )
}

export function validateThinBloodAlchemyEligibility(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
  alchemy:
    PersistedCharacterThinBloodAlchemy | null,
): readonly CharacterThinBloodRuleIssue[] {
  if (
    alchemy === null ||
    hasAlchemist(traits) ||
    emptyAlchemy(alchemy)
  ) {
    return []
  }

  return [
    ruleIssue(
      'CHARACTER_THIN_BLOOD_ALCHEMY_REQUIRES_ALCHEMIST',
      'Alquimia de Sangre Débil requiere el Mérito Alquimista de Sangre Débil.',
    ),
  ]
}

export function validateInitialThinBloodAlchemySelection(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
  alchemy:
    PersistedCharacterThinBloodAlchemy,
  catalog: CharacterRulesCatalog,
): readonly CharacterThinBloodRuleIssue[] {
  const issues = [
    ...validateThinBloodAlchemyEligibility(
      traits,
      alchemy,
    ),
  ]

  if (!hasAlchemist(traits)) {
    if (!emptyAlchemy(alchemy)) {
      issues.push(
        ruleIssue(
          'INITIAL_THIN_BLOOD_ALCHEMY_NOT_GRANTED',
          'Sin Alquimista de Sangre Débil, el estado inicial de Alquimia debe permanecer vacío.',
        ),
      )
    }

    return issues
  }

  if (alchemy.rating !== 1) {
    issues.push(
      ruleIssue(
        'INITIAL_THIN_BLOOD_ALCHEMY_RATING_INVALID',
        'Alquimista de Sangre Débil concede exactamente 1 punto inicial de Alquimia.',
        {
          rating: alchemy.rating,
        },
      ),
    )
  }

  if (
    ![
      'athanorCorporis',
      'calcinatio',
      'fixatio',
    ].includes(
      alchemy.method ?? '',
    )
  ) {
    issues.push(
      ruleIssue(
        'INITIAL_THIN_BLOOD_ALCHEMY_METHOD_INVALID',
        'La Alquimia inicial requiere un método de destilación válido.',
      ),
    )
  }

  if (alchemy.formulaKeys.length !== 1) {
    issues.push(
      ruleIssue(
        'INITIAL_THIN_BLOOD_ALCHEMY_FORMULA_COUNT_INVALID',
        'Durante la creación inicial debe seleccionarse exactamente 1 fórmula gratuita de Alquimia de Sangre Débil.',
        {
          formulaCount:
            alchemy.formulaKeys.length,
        },
      ),
    )
  }

  for (
    const formulaKey of
      alchemy.formulaKeys
  ) {
    const formula =
      catalog.disciplineCatalog
        .thinBloodAlchemyFormulas.find(
          (candidate) =>
            candidate.key === formulaKey,
        )

    if (
      formula === undefined ||
      formula.level !== 1
    ) {
      issues.push(
        ruleIssue(
          'INITIAL_THIN_BLOOD_ALCHEMY_FORMULA_INVALID',
          'La fórmula inicial debe existir y ser de nivel 1.',
          {
            formulaKey,
          },
        ),
      )
    }
  }

  if (
    new Set(
      alchemy.formulaKeys,
    ).size !==
      alchemy.formulaKeys.length
  ) {
    issues.push(
      ruleIssue(
        'INITIAL_THIN_BLOOD_ALCHEMY_FORMULA_DUPLICATE',
        'La fórmula inicial de Alquimia no puede repetirse.',
      ),
    )
  }

  return issues
}

export function deriveThinBloodAffinityDiscipline(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
): PersistedCharacterDiscipline | null {
  const affinity =
    traits.find(
      ({ definitionKey }) =>
        definitionKey ===
          'discipline-affinity',
    )
      ?.disciplineAffinityDetails

  if (affinity === null || affinity === undefined) {
    return null
  }

  return {
    disciplineKey:
      affinity.disciplineKey,
    rating: 1,
    powerKeys: [
      affinity.powerKey,
    ],
    origin: 'thinBlood',
  }
}

export function hasResolvedThinBloodState(
  character: Pick<
    PersistedCharacterDraft,
    | 'identity'
    | 'thinBloodTraits'
    | 'thinBloodAlchemy'
  >,
): boolean {
  if (
    character.identity.clanKey !==
      'thinBlood'
  ) {
    return true
  }

  return (
    character.thinBloodTraits.length > 0 &&
    character.thinBloodAlchemy !== null
  )
}

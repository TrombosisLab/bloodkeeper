import type {
  CharacterRulesBloodSorceryRitualDefinition,
  CharacterRulesDisciplineCatalog,
  CharacterRulesDisciplineDefinition,
  CharacterRulesDisciplinePowerDefinition,
  CharacterRulesOblivionCeremonyDefinition,
  CharacterRulesThinBloodAlchemyFormulaDefinition,
} from '@v5r/character-rules'

import {
  characterRulesCatalog,
} from './character-rules-catalog'

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
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

interface DisciplineCatalogIndex {
  readonly disciplines: ReadonlyMap<
    string,
    CharacterRulesDisciplineDefinition
  >
  readonly clanAffinities: ReadonlyMap<
    string,
    CharacterRulesDisciplineCatalog['clanAffinities'][number]
  >
  readonly powers: ReadonlyMap<
    string,
    CharacterRulesDisciplinePowerDefinition
  >
  readonly rituals: ReadonlyMap<
    string,
    CharacterRulesBloodSorceryRitualDefinition
  >
  readonly ceremonies: ReadonlyMap<
    string,
    CharacterRulesOblivionCeremonyDefinition
  >
  readonly formulas: ReadonlyMap<
    string,
    CharacterRulesThinBloodAlchemyFormulaDefinition
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
    section: 'disciplines',
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

function buildCatalogIndex(
  catalog: CharacterRulesDisciplineCatalog,
): DisciplineCatalogIndex {
  return {
    disciplines: new Map(
      catalog.disciplines.map(
        (definition) => [definition.key, definition],
      ),
    ),
    clanAffinities: new Map(
      catalog.clanAffinities.map(
        (definition) => [definition.clanKey, definition],
      ),
    ),
    powers: new Map(
      catalog.powers.map(
        (definition) => [definition.key, definition],
      ),
    ),
    rituals: new Map(
      catalog.bloodSorceryRituals.map(
        (definition) => [definition.key, definition],
      ),
    ),
    ceremonies: new Map(
      catalog.oblivionCeremonies.map(
        (definition) => [definition.key, definition],
      ),
    ),
    formulas: new Map(
      catalog.thinBloodAlchemyFormulas.map(
        (definition) => [definition.key, definition],
      ),
    ),
  }
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
      section: 'disciplines',
      state: 'invalid',
      issues,
    }
  }

  if (issues.length > 0) {
    return {
      section: 'disciplines',
      state: 'pending',
      issues,
    }
  }

  return {
    section: 'disciplines',
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

function validatesInitialSelection(
  context: CharacterValidationContext,
): boolean {
  return (
    context === 'draftSave' ||
    context === 'activation'
  )
}

function disciplineContributionIdentity(
  discipline:
    PersistedCharacterDraft['disciplines'][number],
): string {
  return [
    discipline.disciplineKey,
    discipline.origin ?? 'unspecified',
  ].join(':')
}

function effectiveDisciplineRatings(
  character: PersistedCharacterDraft,
): ReadonlyMap<string, number> {
  const ratings = new Map<string, number>()

  for (const discipline of character.disciplines) {
    ratings.set(
      discipline.disciplineKey,
      (
        ratings.get(
          discipline.disciplineKey,
        ) ?? 0
      ) + discipline.rating,
    )
  }

  return ratings
}

function validateDisciplines(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const identities =
    character.disciplines.map(
      disciplineContributionIdentity,
    )

  for (const identity of duplicateValues(
    identities,
  )) {
    const [disciplineKey, origin] =
      identity.split(':')

    issues.push(
      errorIssue(
        'CHARACTER_DISCIPLINE_DUPLICATE',
        'disciplines',
        'Una contribucion de Disciplina no puede repetirse para el mismo origen.',
        {
          disciplineKey,
          origin,
        },
      ),
    )
  }

  const learnedPowerKeys: string[] = []

  for (const discipline of character.disciplines) {
    if (
      !Number.isInteger(discipline.rating) ||
      discipline.rating < 1 ||
      discipline.rating > 5
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_DISCIPLINE_RATING_OUT_OF_RANGE',
          'disciplines',
          'La puntuacion de una contribucion de Disciplina debe estar entre 1 y 5.',
          {
            disciplineKey:
              discipline.disciplineKey,
            rating: discipline.rating,
          },
        ),
      )
    }

    if (
      discipline.powerKeys.length > discipline.rating
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_DISCIPLINE_POWER_CAPACITY_EXCEEDED',
          'disciplines',
          'Una contribucion no puede registrar mas Poderes que su puntuacion.',
          {
            disciplineKey:
              discipline.disciplineKey,
            rating: discipline.rating,
            powerCount:
              discipline.powerKeys.length,
          },
        ),
      )
    }

    for (const powerKey of discipline.powerKeys) {
      if (powerKey.trim().length === 0) {
        issues.push(
          errorIssue(
            'CHARACTER_DISCIPLINE_POWER_KEY_REQUIRED',
            'disciplines',
            'Cada Poder adquirido necesita un identificador.',
            {
              disciplineKey:
                discipline.disciplineKey,
            },
          ),
        )
      }

      learnedPowerKeys.push(powerKey)
    }
  }

  for (
    const [disciplineKey, rating] of
      effectiveDisciplineRatings(character)
  ) {
    if (rating > 5) {
      issues.push(
        errorIssue(
          'CHARACTER_DISCIPLINE_EFFECTIVE_RATING_OUT_OF_RANGE',
          'disciplines',
          'La suma efectiva de una Disciplina no puede superar 5.',
          {
            disciplineKey,
            rating,
          },
        ),
      )
    }
  }

  for (const powerKey of duplicateValues(
    learnedPowerKeys,
  )) {
    issues.push(
      errorIssue(
        'CHARACTER_DISCIPLINE_POWER_DUPLICATE',
        'disciplines',
        'Un Poder adquirido no puede repetirse.',
        { powerKey },
      ),
    )
  }

  return issues
}

function disciplineRating(
  character: PersistedCharacterDraft,
  disciplineKey: string,
): number {
  return character.disciplines
    .filter(
      (discipline) =>
        discipline.disciplineKey === disciplineKey,
    )
    .reduce(
      (total, discipline) =>
        total + discipline.rating,
      0,
    )
}

function learnedPowerSet(
  character: PersistedCharacterDraft,
): ReadonlySet<string> {
  return new Set(
    character.disciplines.flatMap(
      ({ powerKeys }) => powerKeys,
    ),
  )
}

function validateRelatedAcquisitionStructure(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const ritualKeys =
    character.bloodSorceryRituals.ritualKeys
  const ceremonyKeys =
    character.oblivionCeremonies.ceremonyKeys
  const formulaKeys =
    character.thinBloodAlchemy.formulaKeys

  for (const [code, field, values] of [
    [
      'CHARACTER_BLOOD_SORCERY_RITUAL_DUPLICATE',
      'bloodSorceryRituals',
      ritualKeys,
    ],
    [
      'CHARACTER_OBLIVION_CEREMONY_DUPLICATE',
      'oblivionCeremonies',
      ceremonyKeys,
    ],
    [
      'CHARACTER_THIN_BLOOD_FORMULA_DUPLICATE',
      'thinBloodAlchemy',
      formulaKeys,
    ],
  ] as const) {
    for (const definitionKey of duplicateValues(values)) {
      issues.push(
        errorIssue(
          code,
          field,
          'Una adquisicion relacionada no puede repetirse.',
          { definitionKey },
        ),
      )
    }
  }

  if (
    ritualKeys.length > 0 &&
    disciplineRating(character, 'bloodSorcery') < 1
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_BLOOD_SORCERY_REQUIRED_FOR_RITUALS',
        'bloodSorceryRituals',
        'Los Rituales requieren Hechiceria de Sangre.',
      ),
    )
  }

  if (
    ceremonyKeys.length > 0 &&
    disciplineRating(character, 'oblivion') < 1
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_OBLIVION_REQUIRED_FOR_CEREMONIES',
        'oblivionCeremonies',
        'Las Ceremonias requieren Olvido.',
      ),
    )
  }

  const alchemy = character.thinBloodAlchemy

  if (
    !Number.isInteger(alchemy.rating) ||
    alchemy.rating < 0 ||
    alchemy.rating > 5
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_RATING_OUT_OF_RANGE',
        'thinBloodAlchemy',
        'La puntuacion de Alquimia debe estar entre 0 y 5.',
        { rating: alchemy.rating },
      ),
    )
  }

  if (
    alchemy.rating === 0 &&
    (alchemy.method !== null ||
      alchemy.formulaKeys.length > 0)
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_WITHOUT_RATING',
        'thinBloodAlchemy',
        'Alquimia 0 no puede conservar metodo ni formulas.',
      ),
    )
  }

  if (
    alchemy.rating > 0 &&
    alchemy.method === null
  ) {
    issues.push(
      errorIssue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_METHOD_REQUIRED',
        'thinBloodAlchemy',
        'Una puntuacion positiva de Alquimia requiere metodo.',
      ),
    )
  }

  return issues
}

function validateInitialClanDisciplines(
  character: PersistedCharacterDraft,
  index: DisciplineCatalogIndex,
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  if (!validatesInitialSelection(context)) {
    return []
  }

  const clanKey =
    character.identity?.clanKey ?? null

  if (clanKey === null) {
    return []
  }

  const affinity = index.clanAffinities.get(clanKey)

  if (affinity === undefined) {
    return [
      errorIssue(
        'CHARACTER_DISCIPLINE_CLAN_AFFINITY_UNKNOWN',
        'identity.clanKey',
        'No existe una relación canónica Clan-Disciplinas para el Clan seleccionado.',
        { clanKey },
      ),
    ]
  }

  const creationContributions =
    character.disciplines.filter(
      (discipline) =>
        discipline.origin === 'creation' ||
        discipline.origin === null,
    )

  if (affinity.kind === 'thinBlood') {
    if (creationContributions.length === 0) {
      return []
    }

    return [
      errorIssue(
        'CHARACTER_DISCIPLINE_CREATION_NOT_ALLOWED_FOR_THIN_BLOOD',
        'disciplines',
        'Sangre Débil no puede conservar Disciplinas de creación estándar.',
        { clanKey },
      ),
    ]
  }

  if (affinity.kind === 'caitiff') {
    return creationContributions
      .filter(
        (discipline) =>
          discipline.disciplineKey === 'thinBloodAlchemy',
      )
      .map(
        (discipline) =>
          errorIssue(
            'CHARACTER_DISCIPLINE_NOT_AVAILABLE_FOR_CLAN',
            'disciplines',
            'La Disciplina no está disponible para este Clan durante la creación.',
            {
              clanKey,
              disciplineKey:
                discipline.disciplineKey,
            },
          ),
      )
  }

  const allowed = new Set(
    affinity.disciplineKeys,
  )

  return creationContributions
    .filter(
      (discipline) =>
        !allowed.has(discipline.disciplineKey),
    )
    .map(
      (discipline) =>
        errorIssue(
          'CHARACTER_DISCIPLINE_NOT_AVAILABLE_FOR_CLAN',
          'disciplines',
          'La Disciplina no pertenece a las afinidades del Clan durante la creación.',
          {
            clanKey,
            disciplineKey:
              discipline.disciplineKey,
          },
        ),
    )
}

function validateCatalogDisciplinesAndPowers(
  character: PersistedCharacterDraft,
  index: DisciplineCatalogIndex,
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const learned = learnedPowerSet(character)
  const requiredSeverity = completionSeverity(context)

  for (const discipline of character.disciplines) {
    const definition = index.disciplines.get(
      discipline.disciplineKey,
    )
    const effectiveRating = disciplineRating(
      character,
      discipline.disciplineKey,
    )

    if (definition === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_DISCIPLINE_DEFINITION_UNKNOWN',
          'disciplines',
          'La Disciplina no existe en el catalogo canonico.',
          {
            disciplineKey:
              discipline.disciplineKey,
          },
        ),
      )
      continue
    }

    if (!definition.active) {
      issues.push(
        errorIssue(
          'CHARACTER_DISCIPLINE_DEFINITION_INACTIVE',
          'disciplines',
          'La Disciplina no esta activa en el catalogo.',
          {
            disciplineKey:
              discipline.disciplineKey,
          },
        ),
      )
    }

    if (
      discipline.powerKeys.length < discipline.rating
    ) {
      issues.push(
        issue(
          'CHARACTER_DISCIPLINE_POWER_COUNT_INCOMPLETE',
          requiredSeverity,
          'disciplines',
          'La cantidad de Poderes debe coincidir con la puntuacion de Disciplina.',
          {
            disciplineKey:
              discipline.disciplineKey,
            rating: discipline.rating,
            powerCount:
              discipline.powerKeys.length,
          },
        ),
      )
    }

    for (const powerKey of discipline.powerKeys) {
      const power = index.powers.get(powerKey)

      if (power === undefined) {
        issues.push(
          errorIssue(
            'CHARACTER_DISCIPLINE_POWER_UNKNOWN',
            'disciplines',
            'El Poder no existe en el catalogo canonico.',
            {
              disciplineKey:
                discipline.disciplineKey,
              powerKey,
            },
          ),
        )
        continue
      }

      if (!power.active) {
        issues.push(
          errorIssue(
            'CHARACTER_DISCIPLINE_POWER_INACTIVE',
            'disciplines',
            'El Poder no esta activo en el catalogo.',
            { powerKey },
          ),
        )
      }

      if (
        power.disciplineKey !==
        discipline.disciplineKey
      ) {
        issues.push(
          errorIssue(
            'CHARACTER_DISCIPLINE_POWER_WRONG_DISCIPLINE',
            'disciplines',
            'El Poder no pertenece a la Disciplina registrada.',
            {
              disciplineKey:
                discipline.disciplineKey,
              powerDisciplineKey:
                power.disciplineKey,
              powerKey,
            },
          ),
        )
        continue
      }

      if (power.level > effectiveRating) {
        issues.push(
          errorIssue(
            'CHARACTER_DISCIPLINE_POWER_LEVEL_UNMET',
            'disciplines',
            'El nivel del Poder supera la puntuacion efectiva de Disciplina.',
            {
              disciplineKey:
                discipline.disciplineKey,
              powerKey,
              powerLevel: power.level,
              rating: effectiveRating,
            },
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
              'CHARACTER_DISCIPLINE_POWER_PREREQUISITE_MISSING',
              'disciplines',
              'Falta un Poder previo obligatorio.',
              {
                powerKey,
                prerequisitePowerKey:
                  prerequisite,
              },
            ),
          )
        }
      }

      const amalgam = power.requirements?.amalgam

      if (
        amalgam !== undefined &&
        disciplineRating(
          character,
          amalgam.disciplineKey,
        ) < amalgam.minimumLevel
      ) {
        issues.push(
          errorIssue(
            'CHARACTER_DISCIPLINE_POWER_AMALGAM_UNMET',
            'disciplines',
            'No se cumple la Disciplina requerida por la Amalgama.',
            {
              powerKey,
              requiredDisciplineKey:
                amalgam.disciplineKey,
              requiredLevel:
                amalgam.minimumLevel,
              actualLevel: disciplineRating(
                character,
                amalgam.disciplineKey,
              ),
            },
          ),
        )
      }
    }
  }

  return issues
}

function validateCatalogRelatedAcquisitions(
  character: PersistedCharacterDraft,
  index: DisciplineCatalogIndex,
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const learned = learnedPowerSet(character)
  const bloodSorceryLevel = disciplineRating(
    character,
    'bloodSorcery',
  )
  const oblivionLevel = disciplineRating(
    character,
    'oblivion',
  )
  const alchemyLevel =
    character.thinBloodAlchemy.rating

  for (
    const ritualKey of
    character.bloodSorceryRituals.ritualKeys
  ) {
    const ritual = index.rituals.get(ritualKey)

    if (ritual === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_BLOOD_SORCERY_RITUAL_UNKNOWN',
          'bloodSorceryRituals',
          'El Ritual no existe en el catalogo canonico.',
          { ritualKey },
        ),
      )
      continue
    }

    if (ritual.level > bloodSorceryLevel) {
      issues.push(
        errorIssue(
          'CHARACTER_BLOOD_SORCERY_RITUAL_LEVEL_UNMET',
          'bloodSorceryRituals',
          'El nivel del Ritual supera Hechiceria de Sangre.',
          {
            ritualKey,
            ritualLevel: ritual.level,
            bloodSorceryLevel,
          },
        ),
      )
    }
  }

  for (
    const ceremonyKey of
    character.oblivionCeremonies.ceremonyKeys
  ) {
    const ceremony = index.ceremonies.get(ceremonyKey)

    if (ceremony === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_OBLIVION_CEREMONY_UNKNOWN',
          'oblivionCeremonies',
          'La Ceremonia no existe en el catalogo canonico.',
          { ceremonyKey },
        ),
      )
      continue
    }

    if (ceremony.level > oblivionLevel) {
      issues.push(
        errorIssue(
          'CHARACTER_OBLIVION_CEREMONY_LEVEL_UNMET',
          'oblivionCeremonies',
          'El nivel de la Ceremonia supera la puntuacion de Olvido.',
          {
            ceremonyKey,
            ceremonyLevel: ceremony.level,
            oblivionLevel,
          },
        ),
      )
    }

    for (
      const prerequisite of
      ceremony.requirements
        ?.prerequisitePowerKeys ?? []
    ) {
      if (!learned.has(prerequisite)) {
        issues.push(
          errorIssue(
            'CHARACTER_OBLIVION_CEREMONY_PREREQUISITE_MISSING',
            'oblivionCeremonies',
            'Falta el Poder de Olvido requerido por la Ceremonia.',
            {
              ceremonyKey,
              prerequisitePowerKey:
                prerequisite,
            },
          ),
        )
      }
    }
  }

  for (
    const formulaKey of
    character.thinBloodAlchemy.formulaKeys
  ) {
    const formula = index.formulas.get(formulaKey)

    if (formula === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_THIN_BLOOD_FORMULA_UNKNOWN',
          'thinBloodAlchemy',
          'La Formula no existe en el catalogo canonico.',
          { formulaKey },
        ),
      )
      continue
    }

    if (formula.level > alchemyLevel) {
      issues.push(
        errorIssue(
          'CHARACTER_THIN_BLOOD_FORMULA_LEVEL_UNMET',
          'thinBloodAlchemy',
          'El nivel de la Formula supera la puntuacion de Alquimia.',
          {
            formulaKey,
            formulaLevel: formula.level,
            alchemyLevel,
          },
        ),
      )
    }
  }

  if (validatesInitialSelection(context)) {
    const severity = completionSeverity(context)
    const ritualKeys =
      character.bloodSorceryRituals.ritualKeys
    const ceremonyKeys =
      character.oblivionCeremonies.ceremonyKeys
    const formulaKeys =
      character.thinBloodAlchemy.formulaKeys

    if (
      bloodSorceryLevel > 0 &&
      ritualKeys.length !== 1
    ) {
      issues.push(
        issue(
          'CHARACTER_INITIAL_BLOOD_SORCERY_RITUAL_COUNT_INVALID',
          severity,
          'bloodSorceryRituals',
          'La creacion inicial requiere exactamente un Ritual de nivel 1.',
          {
            ritualCount: ritualKeys.length,
          },
        ),
      )
    }

    for (const ritualKey of ritualKeys) {
      const ritual = index.rituals.get(ritualKey)

      if (
        ritual !== undefined &&
        ritual.level !== 1
      ) {
        issues.push(
          issue(
            'CHARACTER_INITIAL_BLOOD_SORCERY_RITUAL_LEVEL_INVALID',
            severity,
            'bloodSorceryRituals',
            'La creacion inicial solo admite Rituales de nivel 1.',
            {
              ritualKey,
              ritualLevel: ritual.level,
            },
          ),
        )
      }
    }

    if (ceremonyKeys.length > 1) {
      issues.push(
        issue(
          'CHARACTER_INITIAL_OBLIVION_CEREMONY_COUNT_INVALID',
          severity,
          'oblivionCeremonies',
          'La creacion inicial admite como maximo una Ceremonia.',
          {
            ceremonyCount: ceremonyKeys.length,
          },
        ),
      )
    }

    for (const ceremonyKey of ceremonyKeys) {
      const ceremony = index.ceremonies.get(ceremonyKey)

      if (
        ceremony !== undefined &&
        ceremony.level !== 1
      ) {
        issues.push(
          issue(
            'CHARACTER_INITIAL_OBLIVION_CEREMONY_LEVEL_INVALID',
            severity,
            'oblivionCeremonies',
            'La creacion inicial solo admite Ceremonias de nivel 1.',
            {
              ceremonyKey,
              ceremonyLevel: ceremony.level,
            },
          ),
        )
      }
    }

    if (
      alchemyLevel > 0 &&
      formulaKeys.length !== alchemyLevel
    ) {
      issues.push(
        issue(
          'CHARACTER_INITIAL_THIN_BLOOD_FORMULA_COUNT_INVALID',
          severity,
          'thinBloodAlchemy',
          'La creacion inicial requiere una Formula por punto de Alquimia.',
          {
            alchemyLevel,
            formulaCount: formulaKeys.length,
          },
        ),
      )
    }
  }

  return issues
}

function validatePersistedDisciplineState(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
  catalog: CharacterRulesCatalog,
  index: DisciplineCatalogIndex,
): CharacterSectionValidation {
  const structuralIssues = [
    ...validateDisciplines(character),
    ...validateRelatedAcquisitionStructure(character),
  ]

  if (structuralIssues.length > 0) {
    return sectionResult(structuralIssues)
  }

  if (catalog.stateOf('disciplines') !== 'ready') {
    return {
      section: 'disciplines',
      state: 'pending',
      issues: [
        issue(
          'CHARACTER_DISCIPLINE_CATALOG_VALIDATION_PENDING',
          'warning',
          null,
          'Falta contrastar Disciplinas y Poderes con el catalogo canonico del backend.',
        ),
      ],
    }
  }

  return sectionResult([
    ...validateInitialClanDisciplines(
      character,
      index,
      context,
    ),
    ...validateCatalogDisciplinesAndPowers(
      character,
      index,
      context,
    ),
    ...validateCatalogRelatedAcquisitions(
      character,
      index,
      context,
    ),
  ])
}

export function createCharacterDisciplineValidationContributor(
  catalog: CharacterRulesCatalog,
): CharacterValidationContributor {
  const index = buildCatalogIndex(
    catalog.disciplineCatalog,
  )

  return Object.freeze({
    sections: ['disciplines'] as const,

    validate(
      character: PersistedCharacterDraft,
      context: CharacterValidationContext,
    ) {
      return [
        validatePersistedDisciplineState(
          character,
          context,
          catalog,
          index,
        ),
      ]
    },
  })
}

export const characterDisciplineValidationContributor =
  createCharacterDisciplineValidationContributor(
    characterRulesCatalog,
  )

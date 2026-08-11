import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'
import {
  CHARACTER_ATTRIBUTE_KEYS,
  CHARACTER_SKILL_KEYS,
} from './persisted-character.types'
import type {
  PersistedCharacterDraft,
} from './persisted-character.types'
import {
  characterBloodPotencyRanges,
} from './character-blood-potency.rules'
import type {
  CharacterAdvancementIssue,
  CharacterAdvancementPreview,
  CharacterAdvancementRequest,
  CharacterDisciplineCostClass,
} from './character-advancement.types'

export const characterAdvancementNormativeSources = [
  'Core V5 pp. 130-131',
  'Core V5 pp. 151-152',
  'Players Guide V5 p. 92',
] as const

export type CharacterAdvancementCostInput =
  | { readonly kind: 'attribute'; readonly newLevel: number }
  | { readonly kind: 'skill'; readonly newLevel: number }
  | { readonly kind: 'specialty' }
  | {
      readonly kind: 'discipline'
      readonly newLevel: number
      readonly costClass: CharacterDisciplineCostClass
    }
  | { readonly kind: 'ritual'; readonly level: number }
  | { readonly kind: 'formula'; readonly level: number }
  | { readonly kind: 'ceremony'; readonly level: number }
  | { readonly kind: 'advantage'; readonly dots: number }
  | { readonly kind: 'bloodPotency'; readonly newLevel: number }

export class InvalidCharacterAdvancementCostError extends Error {
  constructor() {
    super('Advancement cost input must be a positive integer')
    this.name = 'InvalidCharacterAdvancementCostError'
  }
}

function positive(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new InvalidCharacterAdvancementCostError()
  }
  return value
}

export function calculateCharacterAdvancementCost(
  input: CharacterAdvancementCostInput,
): number {
  switch (input.kind) {
    case 'attribute': return positive(input.newLevel) * 5
    case 'skill': return positive(input.newLevel) * 3
    case 'specialty': return 3
    case 'discipline': {
      const multiplier = input.costClass === 'clan'
        ? 5
        : input.costClass === 'caitiff'
          ? 6
          : 7
      return positive(input.newLevel) * multiplier
    }
    case 'ritual':
    case 'formula':
    case 'ceremony': return positive(input.level) * 3
    case 'advantage': return positive(input.dots) * 3
    case 'bloodPotency': return positive(input.newLevel) * 10
  }
}

function disciplineRating(
  character: PersistedCharacterDraft,
  key: string,
): number {
  return character.disciplines
    .filter(({ disciplineKey }) => disciplineKey === key)
    .reduce((sum, value) => sum + value.rating, 0)
}

function issue(
  issues: CharacterAdvancementIssue[],
  code: string,
  message: string,
): void {
  issues.push({ code, message })
}

function finish(
  character: PersistedCharacterDraft,
  available: number,
  request: CharacterAdvancementRequest,
  key: string,
  currentRating: number | null,
  newRating: number | null,
  cost: number | null,
  issues: CharacterAdvancementIssue[],
  consequences: string[] = [],
): CharacterAdvancementPreview {
  if (character.status === 'archived') {
    issue(issues, 'CHARACTER_ARCHIVED', 'Un personaje archivado no puede evolucionar.')
  }
  if (cost !== null && available < cost) {
    issue(issues, 'EXPERIENCE_INSUFFICIENT', 'La Experiencia disponible es insuficiente.')
  }
  return {
    characterId: character.characterId,
    revision: character.revision,
    kind: request.kind,
    key,
    currentRating,
    newRating,
    cost,
    available,
    eligible: cost !== null && issues.length === 0,
    issues,
    consequences,
  }
}

export function previewCharacterAdvancement(
  character: PersistedCharacterDraft,
  available: number,
  request: CharacterAdvancementRequest,
  catalog: CharacterRulesCatalog,
): CharacterAdvancementPreview {
  const issues: CharacterAdvancementIssue[] = []

  if (request.kind === 'attribute') {
    if (!CHARACTER_ATTRIBUTE_KEYS.includes(request.key as never)) {
      issue(issues, 'ATTRIBUTE_UNKNOWN', 'El Atributo no existe.')
      return finish(character, available, request, request.key, null, null, null, issues)
    }
    const current = character.attributes[
      request.key as keyof typeof character.attributes
    ]
    const next = current + 1
    if (next > 5) issue(issues, 'TRAIT_AT_MAXIMUM', 'El Atributo ya esta al maximo.')
    return finish(character, available, request, request.key, current, next,
      calculateCharacterAdvancementCost({ kind: 'attribute', newLevel: next }), issues)
  }

  if (request.kind === 'skill') {
    if (!CHARACTER_SKILL_KEYS.includes(request.key as never)) {
      issue(issues, 'SKILL_UNKNOWN', 'La Habilidad no existe.')
      return finish(character, available, request, request.key, null, null, null, issues)
    }
    const current = character.skills[
      request.key as keyof typeof character.skills
    ]
    const next = current + 1
    if (next > 5) issue(issues, 'TRAIT_AT_MAXIMUM', 'La Habilidad ya esta al maximo.')
    return finish(character, available, request, request.key, current, next,
      calculateCharacterAdvancementCost({ kind: 'skill', newLevel: next }), issues)
  }

  if (request.kind === 'specialty') {
    const rating = character.skills[
      request.skillKey as keyof typeof character.skills
    ]
    if (rating === undefined) issue(issues, 'SKILL_UNKNOWN', 'La Habilidad no existe.')
    else if (rating < 1) issue(issues, 'SPECIALTY_SKILL_REQUIRED', 'Una Especialidad requiere Habilidad 1 o superior.')
    const duplicate = character.skillSpecialties.some(
      ({ skillKey, name }) =>
        skillKey === request.skillKey &&
        name.trim().toLocaleLowerCase() === request.name.trim().toLocaleLowerCase(),
    )
    if (duplicate) issue(issues, 'SPECIALTY_DUPLICATE', 'La Especialidad ya existe.')
    return finish(character, available, request,
      `${request.skillKey}:${request.name}`, null, null,
      calculateCharacterAdvancementCost({ kind: 'specialty' }), issues)
  }

  if (request.kind === 'discipline') {
    const definition = catalog.disciplineCatalog.disciplines.find(
      ({ key }) => key === request.disciplineKey,
    )
    const current = disciplineRating(character, request.disciplineKey)
    const next = current + 1
    if (definition === undefined || !definition.active) {
      issue(issues, 'DISCIPLINE_UNKNOWN', 'La Disciplina no esta activa en el catalogo.')
    }
    if (next > 5) issue(issues, 'TRAIT_AT_MAXIMUM', 'La Disciplina ya esta al maximo.')
    const affinity = catalog.disciplineCatalog.clanAffinities.find(
      ({ clanKey }) => clanKey === character.identity.clanKey,
    )
    let costClass: CharacterDisciplineCostClass = 'other'
    if (affinity === undefined) {
      issue(issues, 'CLAN_AFFINITY_UNKNOWN', 'No existe afinidad canonica para el Clan.')
    } else if (affinity.kind === 'caitiff') {
      costClass = 'caitiff'
    } else if (affinity.kind === 'thinBlood') {
      issue(issues, 'THIN_BLOOD_DISCIPLINE_UNSUPPORTED', 'La Disciplina permanente de Sangre Debil requiere una regla explicita.')
    } else if (affinity.disciplineKeys.includes(request.disciplineKey as never)) {
      costClass = 'clan'
    }
    const power = catalog.disciplineCatalog.powers.find(
      ({ key }) => key === request.powerKey,
    )
    const learned = new Set(character.disciplines.flatMap(({ powerKeys }) => powerKeys))
    if (power === undefined || !power.active || power.disciplineKey !== request.disciplineKey) {
      issue(issues, 'DISCIPLINE_POWER_INVALID', 'El Poder no pertenece a la Disciplina o no esta activo.')
    } else {
      if (power.level > next) issue(issues, 'DISCIPLINE_POWER_LEVEL_UNMET', 'El nivel del Poder supera la nueva puntuacion.')
      if (learned.has(power.key)) issue(issues, 'DISCIPLINE_POWER_DUPLICATE', 'El Poder ya esta adquirido.')
      for (const prerequisite of power.requirements?.prerequisitePowerKeys ?? []) {
        if (!learned.has(prerequisite)) issue(issues, 'DISCIPLINE_POWER_PREREQUISITE_MISSING', `Falta el Poder ${prerequisite}.`)
      }
      const amalgam = power.requirements?.amalgam
      if (amalgam !== undefined && disciplineRating(character, amalgam.disciplineKey) < amalgam.minimumLevel) {
        issue(issues, 'DISCIPLINE_POWER_AMALGAM_UNMET', 'No se cumple el requisito de amalgama.')
      }
    }
    return finish(character, available, request, request.disciplineKey, current, next,
      calculateCharacterAdvancementCost({ kind: 'discipline', newLevel: next, costClass }), issues,
      [`discipline_cost_class:${costClass}`, `selected_power:${request.powerKey}`])
  }

  if (request.kind === 'ritual') {
    const definition = catalog.disciplineCatalog.bloodSorceryRituals.find(({ key }) => key === request.key)
    if (definition === undefined) return finish(character, available, request, request.key, null, null, null,
      [{ code: 'RITUAL_UNKNOWN', message: 'El Ritual no existe en el catalogo.' }])
    if (character.bloodSorceryRituals.ritualKeys.includes(request.key)) issue(issues, 'RITUAL_DUPLICATE', 'El Ritual ya esta adquirido.')
    if (disciplineRating(character, 'bloodSorcery') < definition.level) issue(issues, 'RITUAL_LEVEL_UNMET', 'Hechiceria de Sangre no alcanza el nivel del Ritual.')
    return finish(character, available, request, request.key, null, definition.level,
      calculateCharacterAdvancementCost({ kind: 'ritual', level: definition.level }), issues)
  }

  if (request.kind === 'formula') {
    const definition = catalog.disciplineCatalog.thinBloodAlchemyFormulas.find(({ key }) => key === request.key)
    if (definition === undefined) return finish(character, available, request, request.key, null, null, null,
      [{ code: 'FORMULA_UNKNOWN', message: 'La Formula no existe en el catalogo.' }])
    if (character.thinBloodAlchemy.formulaKeys.includes(request.key)) issue(issues, 'FORMULA_DUPLICATE', 'La Formula ya esta adquirida.')
    if (character.thinBloodAlchemy.rating < definition.level) issue(issues, 'FORMULA_LEVEL_UNMET', 'Alquimia no alcanza el nivel de la Formula.')
    return finish(character, available, request, request.key, null, definition.level,
      calculateCharacterAdvancementCost({ kind: 'formula', level: definition.level }), issues)
  }

  if (request.kind === 'ceremony') {
    const definition = catalog.disciplineCatalog.oblivionCeremonies.find(({ key }) => key === request.key)
    if (definition === undefined) return finish(character, available, request, request.key, null, null, null,
      [{ code: 'CEREMONY_UNKNOWN', message: 'La Ceremonia no existe en el catalogo.' }])
    if (character.oblivionCeremonies.ceremonyKeys.includes(request.key)) issue(issues, 'CEREMONY_DUPLICATE', 'La Ceremonia ya esta adquirida.')
    if (disciplineRating(character, 'oblivion') < definition.level) issue(issues, 'CEREMONY_LEVEL_UNMET', 'Olvido no alcanza el nivel de la Ceremonia.')
    const learned = new Set(character.disciplines.flatMap(({ powerKeys }) => powerKeys))
    for (const prerequisite of definition.requirements?.prerequisitePowerKeys ?? []) {
      if (!learned.has(prerequisite)) issue(issues, 'CEREMONY_PREREQUISITE_MISSING', `Falta el Poder ${prerequisite}.`)
    }
    return finish(character, available, request, request.key, null, definition.level,
      calculateCharacterAdvancementCost({ kind: 'ceremony', level: definition.level }), issues)
  }

  if (request.kind === 'advantage') {
    const definition = catalog.advantageCatalog.definitions.find(({ key }) => key === request.definitionKey)
    const selection = request.selectionId === null
      ? null
      : character.advantages.selections.find(({ selectionId }) => selectionId === request.selectionId) ?? null
    const current = selection?.rating ?? 0
    if (definition === undefined || !definition.active) issue(issues, 'ADVANTAGE_UNKNOWN', 'La Ventaja no esta activa en el catalogo.')
    else {
      if (definition.category === 'flaw') issue(issues, 'FLAW_NOT_PURCHASABLE', 'Los Defectos no son compras de Experiencia.')
      if (!definition.allowedRatings.includes(request.targetRating)) issue(issues, 'ADVANTAGE_RATING_INVALID', 'La puntuacion no esta permitida.')
      if (selection !== null && selection.definitionKey !== request.definitionKey) issue(issues, 'ADVANTAGE_SELECTION_MISMATCH', 'La seleccion no corresponde a la Ventaja.')
      if (selection === null && !definition.allowMultiple && character.advantages.selections.some(({ definitionKey }) => definitionKey === request.definitionKey)) {
        issue(issues, 'ADVANTAGE_DUPLICATE', 'La Ventaja ya existe; debe indicarse su seleccion estable.')
      }
    }
    const dots = request.targetRating - current
    if (dots < 1) issue(issues, 'ADVANTAGE_NOT_INCREMENTAL', 'La mejora debe adquirir al menos un punto adicional.')
    const cost = dots < 1 ? null : calculateCharacterAdvancementCost({ kind: 'advantage', dots })
    const consequences = ['full_advantage_validation:evolution']
    if (definition?.requiresInstanceDetails) consequences.push('requires_instance_details')
    if (definition?.requiresParentSelection) consequences.push('requires_parent_selection')
    return finish(character, available, request, request.definitionKey, current, request.targetRating, cost, issues, consequences)
  }

  const current = character.blood.bloodPotency
  const next = current + 1
  const generation = character.identity.generation
  const range = generation === null ? undefined : characterBloodPotencyRanges[generation]
  if (range === undefined) issue(issues, 'BLOOD_GENERATION_INVALID', 'La Generacion no permite validar Potencia de Sangre.')
  else if (next > range.max) issue(issues, 'BLOOD_POTENCY_AT_MAXIMUM', 'La Potencia de Sangre alcanzaria un valor imposible para la Generacion.')
  return finish(character, available, request, 'bloodPotency', current, next,
    calculateCharacterAdvancementCost({ kind: 'bloodPotency', newLevel: next }), issues)
}

import type {
  BloodSorceryRitualDefinition,
  BloodSorceryRitualKey,
} from '../types/blood-sorcery-ritual.types.ts'

export interface RitualValidationResult {
  valid: boolean
  errors: string[]
}

export function canLearnRitualAtDisciplineLevel(
  ritual:
    BloodSorceryRitualDefinition,
  bloodSorceryLevel:
    number,
): RitualValidationResult {
  const errors: string[] = []

  if (
    !Number.isInteger(
      bloodSorceryLevel,
    ) ||
    bloodSorceryLevel < 0 ||
    bloodSorceryLevel > 5
  ) {
    errors.push(
      'La puntuación de Hechicería de Sangre debe estar entre 0 y 5.',
    )
  }

  if (
    !Number.isInteger(
      ritual.level,
    ) ||
    ritual.level < 1 ||
    ritual.level > 5
  ) {
    errors.push(
      'El nivel del Ritual debe estar entre 1 y 5.',
    )
  }

  if (
    ritual.level >
    bloodSorceryLevel
  ) {
    errors.push(
      'El nivel del Ritual no puede superar la puntuación de Hechicería de Sangre.',
    )
  }

  return {
    valid:
      errors.length === 0,

    errors,
  }
}

export function canSelectRitualAtCharacterCreation(
  ritual:
    BloodSorceryRitualDefinition,
  bloodSorceryLevel:
    number,
): RitualValidationResult {
  const errors: string[] = []

  if (
    bloodSorceryLevel < 1
  ) {
    errors.push(
      'Se requiere al menos Hechicería de Sangre 1 para seleccionar un Ritual durante la creación.',
    )
  }

  if (
    ritual.level !== 1
  ) {
    errors.push(
      'Durante la creación inicial solo puede seleccionarse un Ritual de nivel 1.',
    )
  }

  return {
    valid:
      errors.length === 0,

    errors,
  }
}

export function getRitualExperienceCost(
  ritualLevel:
    number,
): number {
  if (
    !Number.isInteger(
      ritualLevel,
    ) ||
    ritualLevel < 1 ||
    ritualLevel > 5
  ) {
    throw new RangeError(
      'El nivel del Ritual debe estar entre 1 y 5.',
    )
  }

  return ritualLevel * 3
}

export function getMinimumRitualLearningWeeks(
  ritualLevel:
    number,
): number {
  if (
    !Number.isInteger(
      ritualLevel,
    ) ||
    ritualLevel < 1 ||
    ritualLevel > 5
  ) {
    throw new RangeError(
      'El nivel del Ritual debe estar entre 1 y 5.',
    )
  }

  return ritualLevel ** 2
}

export function addKnownRitual(
  ritualKeys:
    BloodSorceryRitualKey[],
  ritualKey:
    BloodSorceryRitualKey,
): BloodSorceryRitualKey[] {
  if (
    ritualKeys.includes(
      ritualKey,
    )
  ) {
    return ritualKeys
  }

  return [
    ...ritualKeys,
    ritualKey,
  ]
}

export function removeKnownRitual(
  ritualKeys:
    BloodSorceryRitualKey[],
  ritualKey:
    BloodSorceryRitualKey,
): BloodSorceryRitualKey[] {
  return ritualKeys.filter(
    (key) =>
      key !== ritualKey,
  )
}

export function normalizeKnownRituals(
  definitions:
    BloodSorceryRitualDefinition[],
  ritualKeys:
    BloodSorceryRitualKey[],
  bloodSorceryLevel:
    number,
): BloodSorceryRitualKey[] {
  const definitionMap =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  const seen =
    new Set<
      BloodSorceryRitualKey
    >()

  const normalized:
    BloodSorceryRitualKey[] = []

  for (
    const ritualKey of ritualKeys
  ) {
    if (
      seen.has(
        ritualKey,
      )
    ) {
      continue
    }

    const definition =
      definitionMap.get(
        ritualKey,
      )

    if (
      !definition
    ) {
      continue
    }

    if (
      !canLearnRitualAtDisciplineLevel(
        definition,
        bloodSorceryLevel,
      ).valid
    ) {
      continue
    }

    seen.add(
      ritualKey,
    )

    normalized.push(
      ritualKey,
    )
  }

  return normalized
}

export function validateInitialBloodSorceryRituals(
  definitions:
    BloodSorceryRitualDefinition[],
  ritualKeys:
    BloodSorceryRitualKey[],
  bloodSorceryLevel:
    number,
): RitualValidationResult {
  const errors: string[] = []

  /*
   * Sin Hechicería de Sangre no puede existir
   * ningún Ritual inicial seleccionado.
   */
  if (bloodSorceryLevel <= 0) {
    if (ritualKeys.length > 0) {
      errors.push(
        'No puedes seleccionar Rituales sin Hechicería de Sangre.',
      )
    }

    return {
      valid:
        errors.length === 0,

      errors,
    }
  }

  /*
   * En creación, un personaje con al menos
   * Hechicería de Sangre 1 selecciona
   * exactamente un Ritual inicial.
   */
  if (ritualKeys.length !== 1) {
    errors.push(
      'Debes seleccionar exactamente un Ritual inicial de nivel 1.',
    )
  }

  /*
   * Detectamos duplicados explícitamente.
   * Aunque una colección con duplicados ya
   * incumple el cardinal exacto, esta validación
   * protege también el dominio ante datos externos.
   */
  if (
    new Set(
      ritualKeys,
    ).size !==
    ritualKeys.length
  ) {
    errors.push(
      'No puede haber Rituales duplicados.',
    )
  }

  const definitionMap =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  for (
    const ritualKey of ritualKeys
  ) {
    const definition =
      definitionMap.get(
        ritualKey,
      )

    if (!definition) {
      errors.push(
        'El Ritual seleccionado no existe en el catálogo.',
      )

      continue
    }

    const creationResult =
      canSelectRitualAtCharacterCreation(
        definition,
        bloodSorceryLevel,
      )

    errors.push(
      ...creationResult.errors,
    )
  }

  return {
    valid:
      errors.length === 0,

    errors: [
      ...new Set(
        errors,
      ),
    ],
  }
}

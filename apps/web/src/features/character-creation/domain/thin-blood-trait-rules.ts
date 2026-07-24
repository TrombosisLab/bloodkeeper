import {
  getThinBloodTraitDefinition,
} from '../data/thin-blood-trait-definitions.ts'

import {
  clanDefinitions,
  getClanDefinition,
} from '../data/clan-definitions.ts'

import {
  disciplinePowerDefinitions,
} from '../data/discipline-power-definitions.ts'

import type {
  CharacterThinBloodTraitsDraft,
  ThinBloodTraitCategory,
} from '../types/thin-blood-trait.types.ts'

import type {
  CharacterDisciplineDraft,
  DisciplineKey,
} from '../types/discipline.types.ts'

import {
  validateSelectedPowers,
} from './discipline-power-rules.ts'

export const THIN_BLOOD_TRAIT_MIN_PER_CATEGORY = 1
export const THIN_BLOOD_TRAIT_MAX_PER_CATEGORY = 3

export interface ThinBloodTraitValidationResult {
  valid: boolean
  errors: string[]
}

/*
 * Validación estructural del Defecto Maldición de Clan.
 *
 * Este checkpoint sólo comprueba que:
 * - Maldición de Clan indique un clan;
 * - la referencia corresponda a un ClanKey existente;
 * - el destino sea uno de los clanes reales (kind === 'clan').
 *
 * Caitiff y Sangre Débil son tipos de personaje especiales
 * y no constituyen una Prohibición de Clan seleccionable.
 *
 * Severidad y prerrequisitos especiales se incorporarán
 * en checkpoints posteriores.
 */
/*
 * La Severidad de la Prohibición adoptada mediante el Defecto
 * Maldición de Clan de Sangre Débil es siempre 1.
 *
 * Es una regla derivada de dominio:
 * - no se almacena en el draft;
 * - no es configurable;
 * - no admite ratings arbitrarios.
 */
export function getThinBloodClanCurseSeverity(): 1 {
  return 1
}

export function validateThinBloodClanCurseDetails(
  draft: CharacterThinBloodTraitsDraft,
): ThinBloodTraitValidationResult {
  const errors: string[] = []

  for (const selection of draft.selections) {
    if (selection.definitionKey !== 'clan-curse') {
      if (selection.clanCurseDetails !== undefined) {
        errors.push(
          'Sólo Maldición de Clan puede contener datos de Prohibición de Clan.',
        )
      }

      continue
    }

    const clanKey =
      selection.clanCurseDetails?.clanKey

    if (!clanKey) {
      errors.push(
        'Maldición de Clan requiere seleccionar una Prohibición de Clan.',
      )
      continue
    }

    let clanDefinition

    try {
      clanDefinition =
        getClanDefinition(clanKey)
    } catch {
      errors.push(
        'Maldición de Clan referencia un clan desconocido.',
      )
      continue
    }

    if (clanDefinition.kind !== 'clan') {
      errors.push(
        'Maldición de Clan sólo puede adoptar la Prohibición de uno de los clanes.',
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/*
 * Valida únicamente los prerrequisitos especiales asociados
 * a determinadas Prohibiciones elegidas mediante Maldición de Clan.
 *
 * La fuente de verdad son las selecciones canónicas del propio
 * subsistema Sangre Débil. No se almacenan flags derivados.
 *
 * Reglas:
 * - Brujah requiere Temperamento Bestial.
 * - Gangrel requiere Temperamento Bestial.
 * - Tremere requiere Sangre Vinculante.
 * - El resto de clanes no recibe requisitos adicionales aquí.
 */
export function validateThinBloodClanCursePrerequisites(
  draft: CharacterThinBloodTraitsDraft,
): ThinBloodTraitValidationResult {
  const errors: string[] = []

  const selectedKeys = new Set(
    draft.selections.map(
      (selection) =>
        selection.definitionKey,
    ),
  )

  for (const selection of draft.selections) {
    if (
      selection.definitionKey !==
        'clan-curse'
    ) {
      continue
    }

    const clanKey =
      selection.clanCurseDetails?.clanKey

    if (!clanKey) {
      /*
       * La ausencia o invalidez estructural del clan
       * pertenece a validateThinBloodClanCurseDetails().
       */
      continue
    }

    if (
      (
        clanKey === 'brujah' ||
        clanKey === 'gangrel'
      ) &&
      !selectedKeys.has(
        'bestial-temper',
      )
    ) {
      errors.push(
        'La Maldición de Clan Brujah o Gangrel requiere Temperamento Bestial.',
      )
    }

    if (
      clanKey === 'tremere' &&
      !selectedKeys.has(
        'bonding-blood',
      )
    ) {
      errors.push(
        'La Maldición de Clan Tremere requiere Sangre Vinculante.',
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/*
 * Devuelve el conjunto canónico de Disciplinas que aparecen
 * como Disciplinas de clan entre los 13 clanes reales.
 *
 * La lista se deriva de clanDefinitions para evitar mantener
 * otro catálogo paralelo susceptible de divergencias.
 *
 * Caitiff y Sangre Débil no aportan Disciplinas porque
 * únicamente se consideran entradas kind === 'clan'.
 */
export function getThinBloodDisciplineAffinityKeys():
  DisciplineKey[] {
  return [
    ...new Set(
      clanDefinitions
        .filter(
          (clan) =>
            clan.kind === 'clan',
        )
        .flatMap(
          (clan) =>
            clan.inClanDisciplines,
        ),
    ),
  ]
}

/*
 * Devuelve la representación efectiva del punto concedido
 * por Disciplina Afín.
 *
 * Esta estructura NO pertenece a draft.disciplines.
 * Sólo adapta el efecto del Mérito al contrato canónico
 * que ya consume el core de poderes de Disciplina.
 *
 * El rating es siempre 1 y nunca se almacena como dato editable.
 */
export function getThinBloodDisciplineAffinityEffect(
  draft: CharacterThinBloodTraitsDraft,
): CharacterDisciplineDraft | null {
  const selection =
    draft.selections.find(
      (candidate) =>
        candidate.definitionKey ===
        'discipline-affinity',
    )

  const details =
    selection?.disciplineAffinityDetails

  if (
    !details?.disciplineKey ||
    !details.powerKey
  ) {
    return null
  }

  return {
    key: details.disciplineKey,
    value: 1,
    powerKeys: [
      details.powerKey,
    ],
  }
}

/*
 * Valida el contrato estructural y el efecto inicial
 * de Disciplina Afín.
 *
 * - Debe indicar una Disciplina válida de clan.
 * - Debe indicar exactamente un poder elegido.
 * - El poder debe existir y pertenecer a esa Disciplina.
 * - El poder debe ser legal con el rating efectivo 1.
 * - Alquimia de Sangre Débil queda fuera del conjunto.
 * - Ningún otro rasgo puede portar disciplineAffinityDetails.
 *
 * El rating 1 es derivado y draft.disciplines permanece intacto.
 */
export function validateThinBloodDisciplineAffinityDetails(
  draft: CharacterThinBloodTraitsDraft,
): ThinBloodTraitValidationResult {
  const errors: string[] = []

  const allowedKeys =
    new Set(
      getThinBloodDisciplineAffinityKeys(),
    )

  for (const selection of draft.selections) {
    if (
      selection.definitionKey !==
        'discipline-affinity'
    ) {
      if (
        selection.disciplineAffinityDetails !==
        undefined
      ) {
        errors.push(
          'Sólo Disciplina Afín puede contener datos de Disciplina Afín.',
        )
      }

      continue
    }

    const details =
      selection
        .disciplineAffinityDetails

    const disciplineKey =
      details?.disciplineKey

    if (!disciplineKey) {
      errors.push(
        'Disciplina Afín requiere seleccionar una Disciplina de clan.',
      )

      continue
    }

    if (
      !allowedKeys.has(
        disciplineKey,
      )
    ) {
      errors.push(
        'Disciplina Afín sólo puede seleccionar una Disciplina presente como Disciplina de clan entre los 13 clanes.',
      )

      continue
    }

    const powerKey =
      details?.powerKey

    if (!powerKey) {
      errors.push(
        'Disciplina Afín requiere seleccionar un poder inicial de la Disciplina elegida.',
      )

      continue
    }

    const effect:
      CharacterDisciplineDraft = {
        key: disciplineKey,
        value: 1,
        powerKeys: [
          powerKey,
        ],
      }

    const powerValidation =
      validateSelectedPowers(
        disciplinePowerDefinitions,
        [
          effect,
        ],
        disciplineKey,
        effect.powerKeys,
      )

    if (!powerValidation.valid) {
      errors.push(
        ...powerValidation.errors.map(
          (error) =>
            `Disciplina Afín: ${error}`,
        ),
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function getSelectedDefinitions(
  draft: CharacterThinBloodTraitsDraft,
) {
  return draft.selections
    .map((selection) =>
      getThinBloodTraitDefinition(
        selection.definitionKey,
      ),
    )
    .filter(
      (definition) =>
        definition !== null,
    )
}

export function countThinBloodTraitsByCategory(
  draft: CharacterThinBloodTraitsDraft,
  category: ThinBloodTraitCategory,
): number {
  return getSelectedDefinitions(draft)
    .filter(
      (definition) =>
        definition.category === category,
    )
    .length
}

export function hasDuplicateThinBloodTraitSelections(
  draft: CharacterThinBloodTraitsDraft,
): boolean {
  const keys = draft.selections.map(
    (selection) =>
      selection.definitionKey,
  )

  return new Set(keys).size !== keys.length
}

export function hasUnknownThinBloodTraitSelections(
  draft: CharacterThinBloodTraitsDraft,
): boolean {
  return draft.selections.some(
    (selection) =>
      getThinBloodTraitDefinition(
        selection.definitionKey,
      ) === null,
  )
}

export function getThinBloodTraitIncompatibilities(
  draft: CharacterThinBloodTraitsDraft,
): Array<{
  definitionKey: string
  incompatibleWithKey: string
}> {
  const selectedKeys = new Set(
    draft.selections.map(
      (selection) =>
        selection.definitionKey,
    ),
  )

  const conflicts: Array<{
    definitionKey: string
    incompatibleWithKey: string
  }> = []

  const recordedPairs = new Set<string>()

  for (
    const definition
    of getSelectedDefinitions(draft)
  ) {
    for (
      const incompatibleWithKey
      of definition.incompatibleWithKeys ?? []
    ) {
      if (
        !selectedKeys.has(
          incompatibleWithKey,
        )
      ) {
        continue
      }

      const pairKey = [
        definition.key,
        incompatibleWithKey,
      ]
        .sort()
        .join('::')

      if (
        recordedPairs.has(pairKey)
      ) {
        continue
      }

      recordedPairs.add(pairKey)

      conflicts.push({
        definitionKey:
          definition.key,
        incompatibleWithKey,
      })
    }
  }

  return conflicts
}

/*
 * Valida la selección completa exigida durante la creación
 * de un personaje Sangre Débil.
 *
 * Regla CORE:
 * - entre 1 y 3 Méritos de Sangre Débil;
 * - igual cantidad de Defectos de Sangre Débil.
 *
 * Los rasgos son discretos y no participan en el
 * presupuesto ordinario de Ventajas 7/2.
 */
export function validateThinBloodTraitSelection(
  draft: CharacterThinBloodTraitsDraft,
): ThinBloodTraitValidationResult {
  const errors: string[] = []

  const clanCurseValidation =
    validateThinBloodClanCurseDetails(
      draft,
    )

  errors.push(
    ...clanCurseValidation.errors,
  )

  const clanCursePrerequisiteValidation =
    validateThinBloodClanCursePrerequisites(
      draft,
    )

  errors.push(
    ...clanCursePrerequisiteValidation.errors,
  )

  const disciplineAffinityValidation =
    validateThinBloodDisciplineAffinityDetails(
      draft,
    )

  errors.push(
    ...disciplineAffinityValidation.errors,
  )

  if (
    hasUnknownThinBloodTraitSelections(
      draft,
    )
  ) {
    errors.push(
      'La selección contiene rasgos de Sangre Débil desconocidos.',
    )
  }

  if (
    hasDuplicateThinBloodTraitSelections(
      draft,
    )
  ) {
    errors.push(
      'No se puede seleccionar dos veces el mismo rasgo de Sangre Débil.',
    )
  }

  const incompatibilities =
    getThinBloodTraitIncompatibilities(
      draft,
    )

  if (
    incompatibilities.length > 0
  ) {
    errors.push(
      'La selección contiene Méritos y Defectos de Sangre Débil incompatibles.',
    )
  }

  const meritCount =
    countThinBloodTraitsByCategory(
      draft,
      'merit',
    )

  const flawCount =
    countThinBloodTraitsByCategory(
      draft,
      'flaw',
    )

  if (
    meritCount <
      THIN_BLOOD_TRAIT_MIN_PER_CATEGORY ||
    meritCount >
      THIN_BLOOD_TRAIT_MAX_PER_CATEGORY
  ) {
    errors.push(
      'Un Sangre Débil debe seleccionar entre 1 y 3 Méritos de Sangre Débil.',
    )
  }

  if (flawCount !== meritCount) {
    errors.push(
      'Un Sangre Débil debe seleccionar la misma cantidad de Defectos que de Méritos de Sangre Débil.',
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/*
 * Valida la aplicabilidad según el tipo de personaje.
 *
 * Para personajes que no son Sangre Débil, este subsistema
 * debe permanecer vacío.
 *
 * En Sangre Débil se exige una selección completa válida.
 */
export function validateThinBloodTraitsForCharacterKind(
  draft: CharacterThinBloodTraitsDraft,
  characterKind: string,
): ThinBloodTraitValidationResult {
  if (characterKind !== 'thinBlood') {
    if (draft.selections.length === 0) {
      return {
        valid: true,
        errors: [],
      }
    }

    return {
      valid: false,
      errors: [
        'Los Méritos y Defectos de Sangre Débil sólo pueden seleccionarse para personajes Sangre Débil.',
      ],
    }
  }

  return validateThinBloodTraitSelection(
    draft,
  )
}

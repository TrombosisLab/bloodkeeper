import {
  getClanDefinition,
} from '../data/clan-definitions.ts'

import type {
  ClanKey,
} from '../types/clan.types'

import type {
  CharacterDisciplineDraft,
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types'

export interface DisciplineValidationResult {
  valid: boolean
  errors: string[]
}

export function getAvailableDisciplinesForClan(
  clanKey: ClanKey,
): DisciplineKey[] {
  return [
    ...getClanDefinition(
      clanKey,
    ).inClanDisciplines,
  ]
}

export function createEmptyDisciplines():
  CharacterDisciplinesDraft {
  return []
}

export function getDisciplineValue(
  disciplines:
    CharacterDisciplinesDraft,
  key: DisciplineKey,
): number {
  return (
    disciplines.find(
      (discipline) =>
        discipline.key === key,
    )?.value ?? 0
  )
}

export function updateDiscipline(
  disciplines:
    CharacterDisciplinesDraft,
  clanKey: ClanKey,
  key: DisciplineKey,
  value: number,
): CharacterDisciplinesDraft {
  const clan =
    getClanDefinition(
      clanKey,
    )

  if (
    clan.kind === 'clan' &&
    !clan.inClanDisciplines.includes(
      key,
    )
  ) {
    return disciplines
  }

  const safeValue =
    Math.max(
      0,
      Math.min(
        2,
        Math.trunc(value),
      ),
    )

  const withoutCurrent =
    disciplines.filter(
      (discipline) =>
        discipline.key !== key,
    )

  if (safeValue === 0) {
    return withoutCurrent
  }

  return [
    ...withoutCurrent,
    {
      key,
      value: safeValue,
      powerKeys:
        disciplines.find(
          (discipline) =>
            discipline.key === key,
        )?.powerKeys ?? [],
    },
  ]
}

export function normalizeDisciplinesForClan(
  disciplines:
    CharacterDisciplinesDraft,
  clanKey: ClanKey,
): CharacterDisciplinesDraft {
  const clan =
    getClanDefinition(
      clanKey,
    )

  if (clan.kind !== 'clan') {
    return []
  }

  return disciplines.filter(
    (discipline) =>
      clan.inClanDisciplines.includes(
        discipline.key,
      ),
  )
}

export function validateDisciplines(
  disciplines:
    CharacterDisciplinesDraft,
  clanKey:
    | ClanKey
    | null,
): DisciplineValidationResult {
  const errors: string[] = []

  if (clanKey === null) {
    return {
      valid: false,
      errors: [
        'Debes seleccionar un clan antes de elegir Disciplinas.',
      ],
    }
  }

  const clan =
    getClanDefinition(
      clanKey,
    )

  if (clan.kind === 'caitiff') {
    return {
      valid: false,
      errors: [
        'La creación de Disciplinas para Caitiff requiere sus reglas especiales.',
      ],
    }
  }

  if (clan.kind === 'thinBlood') {
    return {
      valid: false,
      errors: [
        'La creación de Sangre Débil requiere sus reglas especiales.',
      ],
    }
  }

  for (
    const discipline of disciplines
  ) {
    if (
      !clan.inClanDisciplines.includes(
        discipline.key,
      )
    ) {
      errors.push(
        'Solo puedes seleccionar Disciplinas de clan durante esta fase.',
      )
      break
    }

    if (
      !Number.isInteger(
        discipline.value,
      ) ||
      discipline.value < 1 ||
      discipline.value > 2
    ) {
      errors.push(
        'Las puntuaciones iniciales de Disciplina deben estar entre 1 y 2.',
      )
      break
    }
  }

  const values =
    disciplines.map(
      (discipline) =>
        discipline.value,
    )

  const rating2 =
    values.filter(
      (value) => value === 2,
    ).length

  const rating1 =
    values.filter(
      (value) => value === 1,
    ).length

  if (
    rating2 !== 1 ||
    rating1 !== 1 ||
    disciplines.length !== 2
  ) {
    errors.push(
      'Debes asignar 2 puntos a una Disciplina de clan y 1 punto a otra distinta.',
    )
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}

export function randomizeClanDisciplines(
  clanKey: ClanKey,
  random: () => number =
    Math.random,
): CharacterDisciplinesDraft {
  const clan =
    getClanDefinition(
      clanKey,
    )

  if (
    clan.kind !== 'clan' ||
    clan.inClanDisciplines.length < 2
  ) {
    return []
  }

  const shuffled = [
    ...clan.inClanDisciplines,
  ]

  for (
    let index =
      shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const target =
      Math.floor(
        random() * (index + 1),
      )

    ;[
      shuffled[index],
      shuffled[target],
    ] = [
      shuffled[target],
      shuffled[index],
    ]
  }

  return [
    {
      key: shuffled[0],
      value: 2,
      powerKeys: [],
    },
    {
      key: shuffled[1],
      value: 1,
      powerKeys: [],
    },
  ]
}

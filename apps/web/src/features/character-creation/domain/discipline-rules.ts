import {
  getClanDefinition,
} from '../data/clan-definitions.ts'
import {
  disciplineDefinitions,
} from '../data/discipline-definitions.ts'

import type {
  ClanKey,
} from '../types/clan.types'

import type {
  CharacterDisciplineDraft,
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types'

import {
  filterActiveDisciplineKeys,
  isDisciplineActive,
} from './discipline-catalog-rules.ts'

export interface DisciplineValidationResult {
  valid: boolean
  errors: string[]
}

export const caitiffAvailableDisciplines: DisciplineKey[] = [
  'animalism',
  'auspex',
  'bloodSorcery',
  'celerity',
  'dominate',
  'fortitude',
  'obfuscate',
  'oblivion',
  'potence',
  'presence',
  'protean',
]

export function getAvailableDisciplinesForClan(
  clanKey: ClanKey,
): DisciplineKey[] {
  const clan =
    getClanDefinition(
      clanKey,
    )

  const available =
    clan.kind === 'caitiff'
      ? caitiffAvailableDisciplines
      : clan.inClanDisciplines

  return filterActiveDisciplineKeys(
    disciplineDefinitions,
    available,
  )
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
    !isDisciplineActive(
      disciplineDefinitions,
      key,
    )
  ) {
    return disciplines
  }

  if (
    clan.kind === 'clan' &&
    !clan.inClanDisciplines.includes(
      key,
    )
  ) {
    return disciplines
  }

  if (
    clan.kind === 'caitiff' &&
    !caitiffAvailableDisciplines.includes(
      key,
    )
  ) {
    return disciplines
  }

  if (clan.kind === 'thinBlood') {
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

  if (clan.kind === 'caitiff') {
    return disciplines.filter(
      (discipline) =>
        caitiffAvailableDisciplines.includes(
          discipline.key,
        ) &&
        isDisciplineActive(
          disciplineDefinitions,
          discipline.key,
        ),
    )
  }

  if (clan.kind !== 'clan') {
    return []
  }

  return disciplines.filter(
    (discipline) =>
      clan.inClanDisciplines.includes(
        discipline.key,
      ) &&
      isDisciplineActive(
        disciplineDefinitions,
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

  for (const discipline of disciplines) {
    if (
      !isDisciplineActive(
        disciplineDefinitions,
        discipline.key,
      )
    ) {
      errors.push(
        'No puedes seleccionar una Disciplina inactiva.',
      )
    }
  }

  if (clan.kind === 'caitiff') {
    for (
      const discipline of disciplines
    ) {
      if (
        !caitiffAvailableDisciplines.includes(
          discipline.key,
        )
      ) {
        errors.push(
          'Caitiff solo puede seleccionar Disciplinas vampíricas válidas durante la creación.',
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
          'Las puntuaciones iniciales de Disciplina Caitiff deben estar entre 1 y 2.',
        )
        break
      }
    }

    const uniqueKeys =
      new Set(
        disciplines.map(
          (discipline) =>
            discipline.key,
        ),
      )

    const values =
      disciplines.map(
        (discipline) =>
          discipline.value,
      )

    const rating2 =
      values.filter(
        (value) =>
          value === 2,
      ).length

    const rating1 =
      values.filter(
        (value) =>
          value === 1,
      ).length

    if (
      disciplines.length !== 2 ||
      uniqueKeys.size !== 2 ||
      rating2 !== 1 ||
      rating1 !== 1
    ) {
      errors.push(
        'Caitiff debe seleccionar dos Disciplinas distintas con distribución 2 + 1.',
      )
    }

    return {
      valid: errors.length === 0,
      errors: [
        ...new Set(errors),
      ],
    }
  }

  if (clan.kind === 'thinBlood') {
    if (disciplines.length > 0) {
      return {
        valid: false,
        errors: [
          'Sangre Débil no recibe la distribución inicial normal de Disciplinas 2 + 1.',
        ],
      }
    }

    return {
      valid: true,
      errors: [],
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

export function randomizeCaitiffDisciplines(
  random: () => number =
    Math.random,
): CharacterDisciplinesDraft {
  const shuffled = [
    ...getAvailableDisciplinesForClan(
      'caitiff',
    ),
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

export function randomizeClanDisciplines(
  clanKey: ClanKey,
  random: () => number =
    Math.random,
): CharacterDisciplinesDraft {
  const clan =
    getClanDefinition(
      clanKey,
    )

  const availableDisciplines =
    clan.kind === 'clan'
      ? getAvailableDisciplinesForClan(
          clanKey,
        )
      : []

  if (availableDisciplines.length < 2) {
    return []
  }

  const shuffled = [
    ...availableDisciplines,
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

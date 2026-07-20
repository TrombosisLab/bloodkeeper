import type {
  ClanDefinition,
  ClanKey,
} from '../types/clan.types.ts'

export const clanDefinitions:
  ClanDefinition[] = [
    {
      key: 'banuHaqim',
      name: 'Banu Haqim',
      kind: 'clan',
      inClanDisciplines: [
        'bloodSorcery',
        'celerity',
        'obfuscate',
      ],
    },
    {
      key: 'brujah',
      name: 'Brujah',
      kind: 'clan',
      inClanDisciplines: [
        'celerity',
        'potence',
        'presence',
      ],
    },
    {
      key: 'caitiff',
      name: 'Caitiff',
      kind: 'caitiff',
      inClanDisciplines: [],
    },
    {
      key: 'gangrel',
      name: 'Gangrel',
      kind: 'clan',
      inClanDisciplines: [
        'animalism',
        'fortitude',
        'protean',
      ],
    },
    {
      key: 'hecata',
      name: 'Hecata',
      kind: 'clan',
      inClanDisciplines: [
        'auspex',
        'fortitude',
        'oblivion',
      ],
    },
    {
      key: 'lasombra',
      name: 'Lasombra',
      kind: 'clan',
      inClanDisciplines: [
        'dominate',
        'oblivion',
        'potence',
      ],
    },
    {
      key: 'malkavian',
      name: 'Malkavian',
      kind: 'clan',
      inClanDisciplines: [
        'auspex',
        'dominate',
        'obfuscate',
      ],
    },
    {
      key: 'ministry',
      name: 'Ministerio',
      kind: 'clan',
      inClanDisciplines: [
        'obfuscate',
        'presence',
        'protean',
      ],
    },
    {
      key: 'nosferatu',
      name: 'Nosferatu',
      kind: 'clan',
      inClanDisciplines: [
        'animalism',
        'obfuscate',
        'potence',
      ],
    },
    {
      key: 'ravnos',
      name: 'Ravnos',
      kind: 'clan',
      inClanDisciplines: [
        'animalism',
        'obfuscate',
        'presence',
      ],
    },
    {
      key: 'salubri',
      name: 'Salubri',
      kind: 'clan',
      inClanDisciplines: [
        'auspex',
        'dominate',
        'fortitude',
      ],
    },
    {
      key: 'thinBlood',
      name: 'Sangre Débil',
      kind: 'thinBlood',
      inClanDisciplines: [],
    },
    {
      key: 'toreador',
      name: 'Toreador',
      kind: 'clan',
      inClanDisciplines: [
        'auspex',
        'celerity',
        'presence',
      ],
    },
    {
      key: 'tremere',
      name: 'Tremere',
      kind: 'clan',
      inClanDisciplines: [
        'auspex',
        'bloodSorcery',
        'dominate',
      ],
    },
    {
      key: 'tzimisce',
      name: 'Tzimisce',
      kind: 'clan',
      inClanDisciplines: [
        'animalism',
        'dominate',
        'protean',
      ],
    },
    {
      key: 'ventrue',
      name: 'Ventrue',
      kind: 'clan',
      inClanDisciplines: [
        'dominate',
        'fortitude',
        'presence',
      ],
    },
  ]

export const clanKeys:
  ClanKey[] =
    clanDefinitions.map(
      (clan) =>
        clan.key,
    )

export function getClanDefinition(
  key: ClanKey,
): ClanDefinition {
  const clan =
    clanDefinitions.find(
      (definition) =>
        definition.key === key,
    )

  if (!clan) {
    throw new Error(
      `Clan desconocido: ${key}`,
    )
  }

  return clan
}

export function getClanName(
  key: ClanKey,
): string {
  return getClanDefinition(
    key,
  ).name
}

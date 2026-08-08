import {
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import type {
  ClanDefinition,
  ClanKey,
} from '../types/clan.types.ts'

const clanIdentityDefinitions:
  Omit<ClanDefinition, 'inClanDisciplines'>[] = [
    { key: 'banuHaqim', name: 'Banu Haqim', kind: 'clan' },
    { key: 'brujah', name: 'Brujah', kind: 'clan' },
    { key: 'caitiff', name: 'Caitiff', kind: 'caitiff' },
    { key: 'gangrel', name: 'Gangrel', kind: 'clan' },
    { key: 'hecata', name: 'Hecata', kind: 'clan' },
    { key: 'lasombra', name: 'Lasombra', kind: 'clan' },
    { key: 'malkavian', name: 'Malkavian', kind: 'clan' },
    { key: 'ministry', name: 'Ministerio', kind: 'clan' },
    { key: 'nosferatu', name: 'Nosferatu', kind: 'clan' },
    { key: 'ravnos', name: 'Ravnos', kind: 'clan' },
    { key: 'salubri', name: 'Salubri', kind: 'clan' },
    { key: 'thinBlood', name: 'Sangre Débil', kind: 'thinBlood' },
    { key: 'toreador', name: 'Toreador', kind: 'clan' },
    { key: 'tremere', name: 'Tremere', kind: 'clan' },
    { key: 'tzimisce', name: 'Tzimisce', kind: 'clan' },
    { key: 'ventrue', name: 'Ventrue', kind: 'clan' },
  ]

const affinitiesByClan =
  new Map(
    characterDisciplineCatalog.clanAffinities.map(
      (affinity) => [
        affinity.clanKey,
        affinity,
      ],
    ),
  )

export const clanDefinitions:
  ClanDefinition[] =
    clanIdentityDefinitions.map(
      (clan) => {
        const affinity =
          affinitiesByClan.get(clan.key)

        if (
          affinity === undefined ||
          affinity.kind !== clan.kind
        ) {
          throw new Error(
            `Afinidades de Clan no disponibles para ${clan.key}`,
          )
        }

        return {
          ...clan,
          inClanDisciplines: [
            ...affinity.disciplineKeys,
          ],
        }
      },
    )

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

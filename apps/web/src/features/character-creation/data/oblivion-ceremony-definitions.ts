import type {
  OblivionCeremonyDefinition,
  OblivionCeremonyKey,
} from '../types/oblivion-ceremony.types'

export const oblivionCeremonyDefinitions:
  OblivionCeremonyDefinition[] = [
    {
      key: 'oblivion-ceremony-gift-of-false-life',
      name: 'Don de Falsa Vida',
      level: 1,
      summary:
        'Permite animar temporalmente uno o varios cadáveres para realizar una tarea sencilla.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 92,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-ashes-to-ashes',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-summon-spirit',
      name: 'Invocar Espíritu',
      level: 1,
      summary:
        'Permite llamar a un espíritu mediante una ceremonia necromántica.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 92,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-binding-fetter',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-compel-spirit',
      name: 'Compeler Espíritu',
      level: 2,
      summary:
        'Permite imponer una orden sobrenatural a un espíritu mediante una ceremonia.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 93,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-where-the-shroud-thins',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-awaken-homuncular-servant',
      name: 'Despertar al Sirviente Homuncular',
      level: 2,
      summary:
        'Crea mediante necromancia un sirviente sobrenatural destinado a obedecer al conjurador.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 93,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-where-the-shroud-thins',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-shambling-hordes',
      name: 'Hordas Tambaleantes',
      level: 3,
      summary:
        'Permite levantar múltiples cadáveres como una fuerza de muertos animados.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 94,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-aura-of-decay',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-host-spirit',
      name: 'Hospedar Espíritu',
      level: 3,
      summary:
        'Permite albergar sobrenaturalmente a un espíritu mediante una ceremonia de Olvido.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 94,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-aura-of-decay',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-split-the-shroud',
      name: 'Partir el Velo',
      level: 4,
      summary:
        'Manipula mediante una ceremonia la barrera sobrenatural que separa vivos y muertos.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 95,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-necrotic-plague',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-bind-the-spirit',
      name: 'Vincular al Espíritu',
      level: 4,
      summary:
        'Permite someter sobrenaturalmente a un espíritu mediante un vínculo necromántico.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 95,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-necrotic-plague',
        ],
      },
    },
    {
      key: 'oblivion-ceremony-lazarene-blessing',
      name: 'Bendición Lazarena',
      level: 5,
      summary:
        'Representa una de las ceremonias necrománticas más avanzadas vinculadas al dominio del Olvido.',
      sourceKey: 'players-guide-v5-es',
      sourcePage: 96,
      requirements: {
        prerequisitePowerKeys: [
          'oblivion-skuld-fulfilled',
        ],
      },
    },
  ]

export function getOblivionCeremony(
  key: OblivionCeremonyKey,
): OblivionCeremonyDefinition | undefined {
  return oblivionCeremonyDefinitions.find(
    (ceremony) =>
      ceremony.key === key,
  )
}

export function getOblivionCeremoniesByLevel(
  level: number,
): OblivionCeremonyDefinition[] {
  return oblivionCeremonyDefinitions.filter(
    (ceremony) =>
      ceremony.level === level,
  )
}

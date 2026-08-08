import {
  skillDefinitions,
} from '../../character-creation/data/skill-definitions'

import type {
  SkillKey,
} from '../../character-creation/types/character-skills-draft.types'

import type {
  CharacterSkillCategory,
} from '../types/character-skills.types'

const categoryOrder = [
  'physical',
  'social',
  'mental',
] as const

const categoryLabels = {
  physical: 'Físicas',
  social: 'Sociales',
  mental: 'Mentales',
} as const

const demoSkillRatings: Record<SkillKey, number> = {
  athletics: 2,
  brawl: 3,
  craft: 1,
  drive: 2,
  firearms: 1,
  larceny: 2,
  melee: 2,
  stealth: 3,
  survival: 1,

  animalKen: 1,
  etiquette: 2,
  insight: 3,
  intimidation: 3,
  leadership: 2,
  performance: 1,
  persuasion: 3,
  streetwise: 2,
  subterfuge: 2,

  academics: 2,
  awareness: 3,
  finance: 1,
  investigation: 2,
  medicine: 1,
  occult: 2,
  politics: 3,
  science: 1,
  technology: 2,
}

const demoSkillSpecialties:
  Partial<Record<SkillKey, string[]>> = {
    brawl: ['Peleas callejeras'],
    drive: ['Motocicletas'],
    etiquette: ['Camarilla'],
    persuasion: ['Política'],
    awareness: ['Emboscadas'],
    politics: ['Política local'],
  }

export const demoSkills: CharacterSkillCategory[] =
  categoryOrder.map(
    (category) => ({
      key: category,
      label: categoryLabels[category],
      skills:
        skillDefinitions
          .filter(
            (definition) =>
              definition.category === category,
          )
          .map(
            (definition) => ({
              key: definition.key,
              label: definition.label,
              value:
                demoSkillRatings[
                  definition.key
                ],
              ...(
                demoSkillSpecialties[
                  definition.key
                ] === undefined
                  ? {}
                  : {
                      specialties: [
                        ...demoSkillSpecialties[
                          definition.key
                        ]!,
                      ],
                    }
              ),
            }),
          ),
    }),
  )

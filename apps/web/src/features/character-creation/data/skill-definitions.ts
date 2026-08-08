import {
  characterSkillCatalog,
} from '@v5r/character-rules'

import type {
  SkillDefinition,
  SkillKey,
} from '../types/character-skills-draft.types'

const allSkillDefinitions: SkillDefinition[] =
  characterSkillCatalog.definitions.map(
    (definition) => ({
      key: definition.key,
      label: definition.name,
      category: definition.category,
      active: definition.active,
    }),
  )

export const skillDefinitions: SkillDefinition[] =
  allSkillDefinitions.filter(
    (definition) => definition.active,
  )

export const skillKeys: SkillKey[] =
  skillDefinitions.map(
    (skill) => skill.key,
  )

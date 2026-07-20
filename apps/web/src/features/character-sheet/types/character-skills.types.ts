export interface CharacterSkill {
  key: string
  label: string
  value: number
}

export interface CharacterSkillCategory {
  key: string
  label: string
  skills: CharacterSkill[]
}

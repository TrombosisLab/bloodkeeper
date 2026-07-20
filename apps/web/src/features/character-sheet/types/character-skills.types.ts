export interface CharacterSkill {
  key: string
  label: string
  value: number
  specialties?: string[]
}

export interface CharacterSkillCategory {
  key: string
  label: string
  skills: CharacterSkill[]
}

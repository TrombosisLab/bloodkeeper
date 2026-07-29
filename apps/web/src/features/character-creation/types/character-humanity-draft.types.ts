export interface CharacterConvictionDraft {
  convictionId: string
  text: string
  touchstoneId: string | null
}

export interface CharacterTouchstoneDraft {
  touchstoneId: string
  name: string
  relationship: string
}

export interface CharacterHumanityDraft {
  value: number
  convictions: CharacterConvictionDraft[]
  touchstones: CharacterTouchstoneDraft[]
}

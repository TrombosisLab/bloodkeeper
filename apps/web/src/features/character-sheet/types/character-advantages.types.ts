export interface RatedTrait {
  key: string
  name: string
  value: number
  detail?: string
}

export interface CharacterAdvantages {
  advantages: RatedTrait[]
  backgrounds: RatedTrait[]
  flaws: RatedTrait[]
}

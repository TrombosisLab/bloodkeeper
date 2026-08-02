import type {
  ContentSourceKey,
} from '../../character-creation/types/content-source.types'

export type CatalogReferenceStatus =
  | 'resolved'
  | 'missing'

export interface CharacterDisciplineState {
  key: string
  value: number
  powerKeys: string[]
}

export interface DisciplinePowerView {
  key: string
  name: string
  level: number | null
  summary?: string
  sourceKey?: ContentSourceKey
  sourceName?: string
  sourcePage?: number
  catalogStatus: CatalogReferenceStatus
}

export interface CharacterDisciplineView {
  key: string
  name: string
  value: number
  powers: DisciplinePowerView[]
  catalogStatus: CatalogReferenceStatus
}

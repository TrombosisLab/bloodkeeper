export type ContentSourceKey = string

export interface ContentSourceDefinition {
  key: ContentSourceKey

  name: string

  shortName: string

  edition: 'V5'

  category:
    | 'core'
    | 'supplement'
    | 'development'
}

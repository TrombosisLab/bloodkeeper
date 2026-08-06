export type AppView =
  | 'characters'
  | 'character-creation'
  | 'chronicles'

export type AppSection =
  | 'characters'
  | 'chronicles'

export interface AppNavigationPermissions {
  readonly canManageChronicles: boolean
}

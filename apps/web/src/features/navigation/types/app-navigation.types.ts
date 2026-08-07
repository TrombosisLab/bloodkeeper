export type AppView =
  | 'dashboard'
  | 'characters'
  | 'character-creation'
  | 'chronicles'

export type AppSection =
  | 'dashboard'
  | 'characters'
  | 'chronicles'

export interface AppNavigationPermissions {
  readonly canManageChronicles: boolean
}

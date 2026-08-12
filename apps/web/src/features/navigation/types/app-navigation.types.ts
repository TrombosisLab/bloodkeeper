export type AppView =
  | 'dashboard'
  | 'characters'
  | 'character-creation'
  | 'chronicles'
  | 'administration'

export type AppSection =
  | 'dashboard'
  | 'characters'
  | 'chronicles'
  | 'administration'

export interface AppNavigationPermissions {
  readonly canAccessChronicles: boolean
  readonly canAccessAdministration: boolean
}

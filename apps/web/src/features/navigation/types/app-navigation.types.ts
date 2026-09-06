export type AppView =
  | 'dashboard'
  | 'characters'
  | 'character-creation'
  | 'chronicles'
  | 'administration'
  | 'notebook'

export type AppSection =
  | 'dashboard'
  | 'characters'
  | 'chronicles'
  | 'administration'
  | 'notebook'

export interface AppNavigationPermissions {
  readonly canAccessChronicles: boolean
  readonly canAccessAdministration: boolean
}

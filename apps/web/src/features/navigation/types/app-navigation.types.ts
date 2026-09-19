export type AppView =
  | 'resources'
  | 'dashboard'
  | 'characters'
  | 'character-creation'
  | 'chronicles'
  | 'administration'
  | 'notebook'
  | 'play'

export type AppSection =
  | 'resources'
  | 'dashboard'
  | 'characters'
  | 'chronicles'
  | 'administration'
  | 'notebook'
  | 'chronicle-space'
  | 'play'

export interface AppNavigationPermissions {
  readonly canAccessChronicles: boolean
  readonly canAccessAdministration: boolean
}

export type AppView =
  | 'resources'
  | 'history'
  | 'map'
  | 'dashboard'
  | 'characters'
  | 'character-creation'
  | 'chronicles'
  | 'administration'
  | 'notebook'
  | 'play'
  | 'manual'

export type AppSection =
  | 'resources'
  | 'history'
  | 'dashboard'
  | 'characters'
  | 'chronicles'
  | 'administration'
  | 'notebook'
  | 'chronicle-space'
  | 'play'
  | 'map'
  | 'manual'

export interface AppNavigationPermissions {
  readonly canAccessChronicles: boolean
  readonly canAccessAdministration: boolean
}

export type AppView =
  | 'resources'
  | 'map'
  | 'dashboard'
  | 'characters'
  | 'character-creation'
  | 'chronicles'
  | 'administration'
  | 'notebook'
  | 'manual'
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
  | 'map'
  | 'manual'

export interface AppNavigationPermissions {
  readonly canAccessChronicles: boolean
  readonly canAccessAdministration: boolean
}

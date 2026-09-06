import type {
  AppNavigationPermissions,
  AppSection,
  AppView,
} from '../types/app-navigation.types'

const hashByView:
  Readonly<Record<AppView, string>> = {
    dashboard: '#/dashboard',
    characters: '#/characters',
    'character-creation':
      '#/characters/create',
    chronicles: '#/chronicles',
    administration: '#/administration',
    notebook: '#/notebook',
  }

export function hashForAppView(
  view: AppView,
): string {
  return hashByView[view]
}

export function appViewFromHash(
  hash: string,
  permissions: AppNavigationPermissions,
): AppView {
  switch (hash.trim()) {
    case '#/characters':
      return 'characters'

    case '#/characters/create':
      return 'character-creation'

    case '#/administration':
      return permissions.canAccessAdministration
        ? 'administration'
        : 'dashboard'

    case '#/notebook':
      return permissions.canAccessChronicles ? 'notebook' : 'dashboard'

    case '#/chronicles':
      return permissions.canAccessChronicles
        ? 'chronicles'
        : 'dashboard'

    case '':
    case '#':
    case '#/dashboard':
    default:
      return 'dashboard'
  }
}

export function sectionForAppView(
  view: AppView,
): AppSection {
  if (view === 'dashboard') {
    return 'dashboard'
  }

  if (view === 'chronicles') {
    return 'chronicles'
  }

  if (view === 'notebook') {
    return 'notebook'
  }

  if (view === 'administration') {
    return 'administration'
  }

  return 'characters'
}

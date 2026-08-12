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

  return view === 'chronicles'
    ? 'chronicles'
    : view === 'administration'
      ? 'administration'
      : 'characters'
}

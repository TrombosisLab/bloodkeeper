import type {
  AppNavigationPermissions,
  AppSection,
  AppView,
} from '../types/app-navigation.types'

const hashByView:
  Readonly<Record<AppView, string>> = {
    characters: '#/characters',
    'character-creation':
      '#/characters/create',
    chronicles: '#/chronicles',
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
    case '#/characters/create':
      return 'character-creation'

    case '#/chronicles':
      return permissions.canManageChronicles
        ? 'chronicles'
        : 'characters'

    case '':
    case '#':
    case '#/characters':
    default:
      return 'characters'
  }
}

export function sectionForAppView(
  view: AppView,
): AppSection {
  return view === 'chronicles'
    ? 'chronicles'
    : 'characters'
}

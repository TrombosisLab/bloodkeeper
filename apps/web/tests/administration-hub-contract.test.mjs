import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  appViewFromHash,
  hashForAppView,
  sectionForAppView,
} from '../src/features/navigation/domain/app-navigation-location.ts'

const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
const navigation = await readFile(new URL('../src/features/navigation/components/AppNavigation.tsx', import.meta.url), 'utf8')
const hub = await readFile(new URL('../src/features/administration/components/AdministrationHub.tsx', import.meta.url), 'utf8')


const styles = await readFile(
  new URL(
    '../src/features/administration/components/administration-hub.css',
    import.meta.url,
  ),
  'utf8',
)

test('040-A autoriza la ruta solo con permiso administrativo', () => {
  assert.equal(hashForAppView('administration'), '#/administration')
  assert.equal(appViewFromHash('#/administration', {
    canAccessChronicles: true, canAccessAdministration: true,
  }), 'administration')
  assert.equal(appViewFromHash('#/administration', {
    canAccessChronicles: true, canAccessAdministration: false,
  }), 'dashboard')
  assert.equal(sectionForAppView('administration'), 'administration')
})

test('040-A muestra el acceso solo cuando existe permiso', () => {
  assert.match(navigation, /\{canAccessAdministration \? \(/)
  assert.match(navigation, /selectSection\('administration'\)/)
  assert.match(main, /roles\.includes\('admin'\)/)
})

test('040-A renderiza administracion como una rama exclusiva', () => {
  assert.match(main, /view === 'administration'[\s\S]*?<AdministrationHub \/>[\s\S]*?: view === 'dashboard'/)
  assert.match(main, /: view === 'character-creation' \? \(/)
  assert.match(main, /\) : null\}\s*<\/AppLayout>/)
  const dashboard = main.match(/<Dashboard[\s\S]*?\/>/)?.[0] ?? ''
  assert.doesNotMatch(dashboard, /canAccessAdministration/)
})

test('040-A reutiliza usuarios y reserva operaciones tecnicas para otra fase', () => {
  assert.match(hub, /Usuarios y cuentas/)
  assert.match(hub, /Operaciones del sistema/)
  assert.match(hub, /window\.confirm/)
  assert.doesNotMatch(hub, /passwordHash|prisma|docker compose/i)
})

test(
  '040-A UX organiza Administración en Usuarios Sistema y Copias',
  () => {
    assert.match(
      hub,
      /type AdministrationTab[\s\S]*'users'[\s\S]*'system'[\s\S]*'backups'/,
    )
    assert.match(
      hub,
      /activeTab[\s\S]*useState<AdministrationTab>[\s\S]*'users'/,
    )
    assert.match(
      hub,
      />\s*Usuarios\s*</,
    )
    assert.match(
      hub,
      />\s*Sistema\s*</,
    )
    assert.match(
      hub,
      />\s*Copias de seguridad\s*</,
    )
  },
)

test(
  '040-A UX pliega Crear cuenta por defecto',
  () => {
    assert.match(
      hub,
      /showCreateAccount[\s\S]*useState\(false\)/,
    )
    assert.match(
      hub,
      /aria-expanded=\{[\s\S]*showCreateAccount[\s\S]*\}/,
    )
    assert.match(
      hub,
      /showCreateAccount \? \([\s\S]*administration-create-account/,
    )
  },
)

test(
  '040-A UX mantiene ids para operaciones pero evita usernames técnicos largos',
  () => {
    assert.match(
      hub,
      /userApi[\s\S]*changeStatus\([\s\S]*user\.id/,
    )
    assert.match(
      hub,
      /userApi[\s\S]*changeRoles\([\s\S]*user\.id/,
    )
    assert.match(
      hub,
      /userApi[\s\S]*resetPassword\([\s\S]*user\.id/,
    )
    assert.match(
      hub,
      /readableUsername[\s\S]*normalized\.length > 32/,
    )
  },
)

test(
  '040-A UX conserva paginación roles editables y acciones por fila',
  () => {
    assert.match(
      hub,
      /\.\.\.current,[\s\S]*\.\.\.page\.items/,
    )
    assert.match(
      hub,
      /Cargar más usuarios/,
    )
    assert.match(
      hub,
      /toggleRole/,
    )
    assert.match(
      hub,
      /Restablecer contraseña/,
    )
    assert.match(
      hub,
      /Desactivar/,
    )
  },
)

test(
  '040-A UX no adelanta búsqueda filtros restauración ni control host',
  () => {
    assert.doesNotMatch(
      hub,
      /Buscar usuarios|Filtrar usuarios|restoreBackup|Restaurar copia|docker compose|terminal web/i,
    )
  },
)

test(
  '040-A UX distingue visualmente estado de cuenta y restablecimiento de contraseña',
  () => {
    assert.match(
      hub,
      /administration-hub__compact-action--danger/,
    )
    assert.match(
      hub,
      /administration-hub__compact-action--success/,
    )
    assert.match(
      hub,
      /administration-hub__compact-action--secondary/,
    )

    assert.match(
      styles,
      /administration-hub__compact-action--danger[\s\S]*var\(--color-danger\)/,
    )
    assert.match(
      styles,
      /administration-hub__compact-action--success[\s\S]*var\(--color-success\)/,
    )
    assert.match(
      styles,
      /administration-hub__compact-action--secondary[\s\S]*background:\s*transparent/,
    )
  },
)

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  createBackupRequestGateway,
} from '../infrastructure/backup-request.api'

import {
  createBackupStatusGateway,
} from '../infrastructure/backup-status.api'

import {
  createSystemOperationsGateway,
} from '../infrastructure/system-operations.api'

import {
  createUserAdministrationGateway,
} from '../infrastructure/user-administration.api'

import type {
  AdministrationBackupStatus,
} from '../types/backup-status.types'

import type {
  SystemOperationsDiagnostics,
  SystemStorageUsage,
} from '../types/system-operations.types'

import type {
  AdministrationRole,
  AdministrationUser,
} from '../types/user-administration.types'

import { LifecycleTrashPanel } from './LifecycleTrashPanel'

import './administration-hub.css'

const userApi =
  createUserAdministrationGateway()
const systemApi =
  createSystemOperationsGateway()
const backupApi =
  createBackupStatusGateway()
const backupRequestApi =
  createBackupRequestGateway()

const roles:
  readonly AdministrationRole[] = [
    'admin',
    'narrator',
    'player',
  ]

type AdministrationTab =
  | 'users'
  | 'trash'
  | 'system'
  | 'storage'
  | 'backups'

function diagnosticLabel(
  state: 'ok' | 'unavailable',
): string {
  return state === 'ok'
    ? 'Disponible'
    : 'No disponible'
}

function backupStatusLabel(
  state:
    AdministrationBackupStatus['status'],
): string {
  if (state === 'ok') {
    return 'Correcta'
  }

  if (state === 'error') {
    return 'Con errores'
  }

  return 'Sin información'
}

function integrityLabel(
  state:
    AdministrationBackupStatus['integrity'],
): string {
  if (state === 'ok') {
    return 'Verificada'
  }

  if (state === 'failed') {
    return 'Fallida'
  }

  return 'Sin verificar'
}

function dateLabel(
  value: string | null,
): string {
  return value === null
    ? 'No disponible'
    : new Date(value)
        .toLocaleString('es-ES')
}

function sizeLabel(
  bytes: number,
): string {
  return bytes <= 0
    ? 'No disponible'
    : `${(
        bytes /
        1024 /
        1024
      ).toFixed(1)} MB`
}

function statusLabel(
  status:
    AdministrationUser['status'],
): string {
  return status === 'active'
    ? 'Activo'
    : 'Desactivado'
}

function readableUsername(
  username: string,
): string | null {
  const normalized =
    username.trim()

  if (
    normalized.length === 0 ||
    normalized.length > 32
  ) {
    return null
  }

  return `@${normalized}`
}

export function AdministrationHub() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<AdministrationTab>(
    'users',
  )

  const [
    showCreateAccount,
    setShowCreateAccount,
  ] = useState(false)

  const [userQuery, setUserQuery] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | AdministrationRole>("all")

  const [
    users,
    setUsers,
  ] = useState<
    readonly AdministrationUser[]
  >([])

  const [
    usersNextOffset,
    setUsersNextOffset,
  ] =
    useState<number | null>(null)

  const [
    usersLoadingMore,
    setUsersLoadingMore,
  ] =
    useState(false)

  const [
    message,
    setMessage,
  ] =
    useState('')

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    diagnosticsLoading,
    setDiagnosticsLoading,
  ] =
    useState(true)

  const [
    diagnostics,
    setDiagnostics,
  ] =
    useState<
      SystemOperationsDiagnostics | null
    >(null)

  const [storageLoading, setStorageLoading] = useState(true)
  const [storage, setStorage] = useState<SystemStorageUsage | null>(null)

  const [
    backupStatusLoading,
    setBackupStatusLoading,
  ] =
    useState(true)

  const [
    backupStatus,
    setBackupStatus,
  ] =
    useState<
      AdministrationBackupStatus | null
    >(null)

  const [
    backupRequestPending,
    setBackupRequestPending,
  ] =
    useState(false)

  const loadUsers = async () => {
    setLoading(true)

    try {
      const page =
        await userApi.list({
          limit: 25,
          offset: 0,
        })

      setUsers(page.items)
      setUsersNextOffset(
        page.nextOffset,
      )
    } catch {
      setMessage(
        'No se pudieron cargar las cuentas.',
      )
    } finally {
      setLoading(false)
    }
  }

  const loadMoreUsers = async () => {
    if (
      usersNextOffset === null ||
      usersLoadingMore
    ) {
      return
    }

    setUsersLoadingMore(true)

    try {
      const page =
        await userApi.list({
          limit: 25,
          offset:
            usersNextOffset,
        })

      setUsers(
        (current) => [
          ...current,
          ...page.items,
        ],
      )

      setUsersNextOffset(
        page.nextOffset,
      )
    } catch {
      setMessage(
        'No se pudieron cargar más cuentas.',
      )
    } finally {
      setUsersLoadingMore(false)
    }
  }

  const loadDiagnostics =
    async () => {
      setDiagnosticsLoading(
        true,
      )

      try {
        setDiagnostics(
          await systemApi
            .diagnostics(),
        )
      } catch {
        setDiagnostics(null)
        setMessage(
          'No se pudo obtener el diagnóstico del sistema.',
        )
      } finally {
        setDiagnosticsLoading(
          false,
        )
      }
    }

  const loadStorage = async () => {
    setStorageLoading(true)
    try {
      setStorage(await systemApi.storage())
    } catch {
      setStorage(null)
      setMessage('No se pudo medir el almacenamiento persistente.')
    } finally {
      setStorageLoading(false)
    }
  }

  const loadBackupStatus =
    async () => {
      setBackupStatusLoading(
        true,
      )

      try {
        setBackupStatus(
          await backupApi.status(),
        )
      } catch {
        setBackupStatus(null)
        setMessage(
          'No se pudo obtener el estado de las copias.',
        )
      } finally {
        setBackupStatusLoading(
          false,
        )
      }
    }

  const requestManualBackup =
    async () => {
      const confirmed =
        window.confirm(
          'La copia completa puede detener temporalmente la aplicación. ¿Crear una copia ahora?',
        )

      if (!confirmed) {
        return
      }

      setBackupRequestPending(
        true,
      )

      try {
        await backupRequestApi
          .create()

        setMessage(
          'Copia solicitada. La aplicación puede quedar temporalmente no disponible mientras se genera.',
        )
      } catch {
        setMessage(
          'No se pudo solicitar la copia de seguridad.',
        )
      } finally {
        setBackupRequestPending(
          false,
        )
      }
    }

  const refresh = () => {
    void loadUsers()
    void loadDiagnostics()
    void loadStorage()
    void loadBackupStatus()
  }

  useEffect(() => {
    refresh()
  }, [])

  const create = async (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const form =
      new FormData(
        event.currentTarget,
      )

    const selected =
      roles.filter(
        (role) =>
          form.get(role) ===
          'on',
      )

    try {
      await userApi.create({
        username:
          String(
            form.get(
              'username',
            ),
          ),
        displayName:
          String(
            form.get(
              'displayName',
            ),
          ),
        password:
          String(
            form.get(
              'password',
            ),
          ),
        roles: selected,
      })

      event.currentTarget
        .reset()

      setShowCreateAccount(
        false,
      )
      setMessage(
        'Cuenta creada.',
      )

      await loadUsers()
    } catch {
      setMessage(
        'No se pudo crear la cuenta.',
      )
    }
  }

  const status = async (
    user: AdministrationUser,
  ) => {
    const next =
      user.status === 'active'
        ? 'disabled'
        : 'active'

    if (
      !window.confirm(
        `Confirmar cambio de estado para ${user.username}?`,
      )
    ) {
      return
    }

    try {
      await userApi
        .changeStatus(
          user.id,
          next,
        )

      await loadUsers()
    } catch {
      setMessage(
        'No se pudo cambiar el estado.',
      )
    }
  }

  const reset = async (
    user: AdministrationUser,
  ) => {
    const password =
      window.prompt(
        `Nueva contraseña para ${user.username}`,
      )

    if (!password) {
      return
    }

    try {
      await userApi
        .resetPassword(
          user.id,
          password,
        )

      setMessage(
        'Contraseña restablecida.',
      )
    } catch {
      setMessage(
        'No se pudo restablecer la contraseña.',
      )
    }
  }

  const toggleRole = async (
    user: AdministrationUser,
    role:
      AdministrationRole,
  ) => {
    const next =
      user.roles.includes(role)
        ? user.roles.filter(
            (current) =>
              current !== role,
          )
        : [
            ...user.roles,
            role,
          ]

    if (!next.length) {
      setMessage(
        'Una cuenta debe conservar al menos un rol.',
      )
      return
    }

    try {
      await userApi
        .changeRoles(
          user.id,
          next,
        )

      await loadUsers()
    } catch {
      setMessage(
        'No se pudieron actualizar los roles.',
      )
    }
  }

  const normalizedUserQuery = userQuery.trim().toLocaleLowerCase()
  const visibleAdministrationUsers = users.filter((user) => {
    if (userStatusFilter !== "all" && user.status !== userStatusFilter) return false
    if (userRoleFilter !== "all" && !user.roles.includes(userRoleFilter)) return false
    if (normalizedUserQuery.length === 0) return true
    return [user.username, user.displayName, user.roles.join(" ")]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedUserQuery)
  })
  const activeAdministrationUsers = users.filter((user) => user.status === "active").length
  const disabledAdministrationUsers = users.length - activeAdministrationUsers
  const narratorAdministrationUsers = users.filter((user) => user.roles.includes("narrator")).length
  const administratorAdministrationUsers = users.filter((user) => user.roles.includes("admin")).length

  return (
    <section className="administration-hub">
      <header className="administration-hub__header">
        <div>
          <p className="eyebrow">
            ADMINISTRACIÓN
          </p>

          <h1>
            Centro administrativo
          </h1>

          <p>
            Gestiona cuentas, accesos
            y operaciones del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
        >
          Actualizar
        </button>
      </header>

      {message ? (
        <p
          className="administration-hub__notice"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <nav
        className="administration-hub__tabs"
        aria-label="Centro administrativo"
      >
        <button
          type="button"
          className={
            activeTab === 'users'
              ? 'administration-hub__tab administration-hub__tab--active'
              : 'administration-hub__tab'
          }
          aria-pressed={
            activeTab === 'users'
          }
          onClick={() =>
            setActiveTab(
              'users',
            )
          }
        >
          Usuarios
        </button>

        <button
          type="button"
          className={
            activeTab === 'trash'
              ? 'administration-hub__tab administration-hub__tab--active'
              : 'administration-hub__tab'
          }
          aria-pressed={activeTab === 'trash'}
          onClick={() => setActiveTab('trash')}
        >
          Archivo y papelera
        </button>

        <button
          type="button"
          className={
            activeTab === 'system'
              ? 'administration-hub__tab administration-hub__tab--active'
              : 'administration-hub__tab'
          }
          aria-pressed={
            activeTab === 'system'
          }
          onClick={() =>
            setActiveTab(
              'system',
            )
          }
        >
          Sistema
        </button>

        <button
          type="button"
          className={
            activeTab === 'storage'
              ? 'administration-hub__tab administration-hub__tab--active'
              : 'administration-hub__tab'
          }
          aria-pressed={activeTab === 'storage'}
          onClick={() => setActiveTab('storage')}
        >
          Almacenamiento
        </button>

        <button
          type="button"
          className={
            activeTab === 'backups'
              ? 'administration-hub__tab administration-hub__tab--active'
              : 'administration-hub__tab'
          }
          aria-pressed={
            activeTab === 'backups'
          }
          onClick={() =>
            setActiveTab(
              'backups',
            )
          }
        >
          Copias de seguridad
        </button>
      </nav>

      {activeTab === 'users' ? (
        <div className="administration-hub__workspace">


          {showCreateAccount ? (
            <article
              id="administration-create-account"
              className="administration-hub__card administration-hub__create-card"
            >
              <div className="administration-hub__card-heading">
                <h2>
                  Crear cuenta
                </h2>

                <button
                  type="button"
                  className="administration-hub__compact-action"
                  onClick={() =>
                    setShowCreateAccount(
                      false,
                    )
                  }
                >
                  Cancelar
                </button>
              </div>

              <form
                className="administration-hub__create-form"
                onSubmit={create}
              >
                <label>
                  Usuario

                  <input
                    required
                    name="username"
                    autoComplete="username"
                  />
                </label>

                <label>
                  Nombre visible

                  <input
                    required
                    name="displayName"
                  />
                </label>

                <label>
                  Contraseña inicial

                  <input
                    required
                    minLength={8}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                  />
                </label>

                <fieldset className="administration-hub__role-fieldset">
                  <legend>
                    Roles iniciales
                  </legend>

                  <div className="administration-hub__roles">
                    {roles.map(
                      (role) => (
                        <label
                          key={
                            role
                          }
                          className="administration-hub__role-toggle"
                        >
                          <input
                            name={
                              role
                            }
                            type="checkbox"
                            defaultChecked={
                              role ===
                              'player'
                            }
                          />

                          <span>
                            {role}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  className="administration-hub__create-submit"
                >
                  Crear cuenta
                </button>
              </form>
            </article>
          ) : null}

          <article className="administration-hub__card administration-hub__users-card">
            <div className="administration-hub__card-heading">
              <div>
                <p className="eyebrow">
                  ADMINISTRACIÓN
                </p>

                <h2 aria-label="Usuarios y cuentas">
                  Usuarios
                </h2>
              </div>

            <button
              type="button"
              className="administration-hub__create-user-button"
              aria-expanded={showCreateAccount}
              aria-controls="administration-create-account"
              onClick={() => setShowCreateAccount((current) => !current)}
            >
              <span aria-hidden="true">+</span>
              Crear usuario
            </button>

            </div>

            <div className="administration-hub__user-metrics" aria-label="Resumen de cuentas">
              <div><span>Total</span><strong>{users.length}</strong></div>
              <div><span>Activos</span><strong>{activeAdministrationUsers}</strong></div>
              <div><span>Desactivados</span><strong>{disabledAdministrationUsers}</strong></div>
              <div><span>Narradores</span><strong>{narratorAdministrationUsers}</strong></div>
              <div><span>Administradores</span><strong>{administratorAdministrationUsers}</strong></div>
            </div>

            <form className="administration-hub__user-filters" onSubmit={(event) => event.preventDefault()}>
              <label>
                Buscar usuario
                <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Buscar usuario..." />
              </label>
              <label>
                Estado
                <select id="user-status-filter" value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="disabled">Desactivados</option>
                </select>
              </label>
              <label>
                Rol
                <select id="user-role-filter" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value as "all" | AdministrationRole)}>
                  <option value="all">Todos</option>
                  <option value="admin">Administradores</option>
                  <option value="narrator">Narradores</option>
                  <option value="player">Jugadores</option>
                </select>
              </label>
              <button type="button" className="administration-hub__compact-action administration-hub__compact-action--secondary" onClick={() => { setUserQuery(""); setUserStatusFilter("all"); setUserRoleFilter("all") }} disabled={userQuery.length === 0 && userStatusFilter === "all" && userRoleFilter === "all"}>Limpiar</button>
            </form>

            {loading ? (
              <p>
                Cargando cuentas…
              </p>
            ) : users.length === 0 ? (
              <p className="administration-hub__empty">
                No hay cuentas disponibles.
              </p>
            ) : (
              <div className="administration-hub__user-list">
                <div className="administration-hub__user-list-head" aria-hidden="true"><span>Usuario</span><span>Estado</span><span>Roles</span><span>Último acceso</span><span>Acciones</span></div>
                {visibleAdministrationUsers.map(
                  (user) => {
                    const username = readableUsername(user.username)
                    const initials = user.displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
                    const updatedAt = new Date(user.updatedAt).toLocaleString("es-ES")

                    return (
                      <div className="administration-hub__user" key={user.id}>
                        <div className="administration-hub__identity">
                          <span className="administration-hub__avatar" aria-hidden="true">{initials || "?"}</span>
                          <div>
                            <strong>{user.displayName}</strong>
                            {username !== null ? <span>{username}</span> : null}
                          </div>
                        </div>

                        <span className={user.status === "active" ? "administration-hub__status administration-hub__status--active" : "administration-hub__status"}>
                          {statusLabel(user.status)}
                        </span>

                        <div className="administration-hub__roles administration-hub__roles--user administration-hub__role-badges" aria-label={"Roles de " + user.displayName}>
                          {user.roles.map((role) => <span className="administration-hub__role-badge" key={role}>{role}</span>)}
                        </div>

                        <span className="administration-hub__last-access" title={user.updatedAt}>{updatedAt}</span>

                        <details className="administration-hub__user-menu">
                          <summary aria-label={"Acciones de " + user.displayName}>⋯</summary>
                          <div className="administration-hub__actions administration-hub__user-menu-actions">
                            <strong>Roles</strong>
                            {roles.map((role) => <label className="administration-hub__role-toggle administration-hub__role-toggle--menu" key={role}><input checked={user.roles.includes(role)} onChange={() => void toggleRole(user, role)} type="checkbox" /><span>{role}</span></label>)}
                            <button type="button" className={user.status === "active" ? "administration-hub__compact-action administration-hub__compact-action--danger" : "administration-hub__compact-action administration-hub__compact-action--success"} onClick={() => void status(user)}>
                              {user.status === "active" ? "Desactivar" : "Activar"}
                            </button>
                            <button type="button" className="administration-hub__compact-action administration-hub__compact-action--secondary" onClick={() => void reset(user)}>
                              Restablecer contraseña
                            </button>
                          </div>
                        </details>
                      </div>
                    )
                  },
                )}
              </div>
            )}

            {!loading &&
            usersNextOffset !==
              null ? (
              <button
                type="button"
                className="administration-hub__load-more"
                disabled={
                  usersLoadingMore
                }
                onClick={() =>
                  void loadMoreUsers()
                }
              >
                {usersLoadingMore
                  ? 'Cargando más…'
                  : 'Cargar más usuarios'}
              </button>
            ) : null}
          </article>
        </div>
      ) : null}

      {activeTab === 'trash' ? (
        <LifecycleTrashPanel />
      ) : null}

      {activeTab === "system" ? (
        <article aria-label="Operaciones del sistema" className="administration-hub__card administration-hub__system-card">
          <div className="administration-hub__card-heading">
            <div>
              <p className="eyebrow">SISTEMA</p>
              <h2>Estado del sistema</h2>
              <p>Comprueba el estado operativo de los servicios gestionados por BloodKeeper.</p>
            </div>
            <button type="button" onClick={() => void loadDiagnostics()} disabled={diagnosticsLoading}>{diagnosticsLoading ? "Comprobando…" : "Comprobar sistema"}</button>
          </div>
          {diagnosticsLoading ? <p className="administration-hub__system-loading">Comprobando estado…</p> : diagnostics === null ? <p className="administration-hub__notice">El diagnóstico no está disponible.</p> : (
            <>
              <div className="administration-hub__system-status-grid" aria-label="Estado de los servicios">
                <article className="administration-hub__system-status administration-hub__system-status--ok"><span className="administration-hub__system-status-icon" aria-hidden="true">&lt;&gt;</span><div><small>API</small><strong>{diagnosticLabel(diagnostics.services.api)}</strong><span>Servicio de aplicación</span></div></article>
                <article className={diagnostics.services.database === "ok" ? "administration-hub__system-status administration-hub__system-status--ok" : "administration-hub__system-status administration-hub__system-status--warning"}><span className="administration-hub__system-status-icon" aria-hidden="true">◉</span><div><small>Base de datos</small><strong>{diagnosticLabel(diagnostics.services.database)}</strong><span>Persistencia PostgreSQL</span></div></article>
                <article className={storage === null ? "administration-hub__system-status administration-hub__system-status--warning" : "administration-hub__system-status administration-hub__system-status--ok"}><span className="administration-hub__system-status-icon" aria-hidden="true">▱</span><div><small>Almacenamiento</small><strong>{storage === null ? "No disponible" : "Operativo"}</strong><span>{storage === null ? "Medición pendiente" : sizeLabel(storage.totalBytes)}</span></div></article>
                <article className={backupStatus?.status === "ok" ? "administration-hub__system-status administration-hub__system-status--ok" : "administration-hub__system-status administration-hub__system-status--warning"}><span className="administration-hub__system-status-icon" aria-hidden="true">◷</span><div><small>Copias de seguridad</small><strong>{backupStatus === null ? "No disponible" : backupStatusLabel(backupStatus.status)}</strong><span>{backupStatus === null ? "Estado pendiente" : dateLabel(backupStatus.lastRunAt)}</span></div></article>
              </div>
              <div className="administration-hub__system-columns">
                <section className="administration-hub__system-panel"><div className="administration-hub__system-panel-heading"><div><p className="eyebrow">OPERACIÓN</p><h3>Configuración general</h3></div><span className="administration-hub__system-badge">Solo lectura</span></div><dl className="administration-hub__system-rows"><div><dt>Aplicación</dt><dd>{diagnostics.application}</dd></div><div><dt>Versión</dt><dd>{diagnostics.version}</dd></div><div><dt>Zona horaria</dt><dd>Europe/Madrid</dd></div><div><dt>Mantenimiento</dt><dd>Gestionado por SSH</dd></div></dl></section>
                <section className="administration-hub__system-panel"><div className="administration-hub__system-panel-heading"><div><p className="eyebrow">ACCESO</p><h3>Seguridad y sesiones</h3></div><span className="administration-hub__system-badge administration-hub__system-badge--success">Protegido</span></div><dl className="administration-hub__system-rows"><div><dt>Autenticación</dt><dd>Sesión autenticada</dd></div><div><dt>Operaciones de host</dt><dd>{diagnostics.hostMaintenance}</dd></div><div><dt>Base de datos</dt><dd>{diagnosticLabel(diagnostics.services.database)}</dd></div><div><dt>Última comprobación</dt><dd>{dateLabel(diagnostics.timestamp)}</dd></div></dl></section>
              </div>
              <section className="administration-hub__system-log"><div className="administration-hub__system-panel-heading"><div><p className="eyebrow">ACTIVIDAD</p><h3>Registro de estado</h3></div><span>{dateLabel(diagnostics.timestamp)}</span></div><div className="administration-hub__system-log-row"><span className="administration-hub__system-log-icon" aria-hidden="true">✓</span><span><strong>Comprobación del sistema</strong><small>{diagnostics.application} · versión {diagnostics.version}</small></span><strong className="administration-hub__system-result">{diagnostics.status === "ok" ? "Éxito" : "Estado degradado"}</strong></div></section>
              <p className="administration-hub__system-note">Los contenedores, recursos del host, logs Docker y reinicios continúan gestionándose mediante los scripts SSH existentes.</p>
            </>
          )}
        </article>
      ) : null}
      {activeTab === "storage" ? (
        <article className="administration-hub__card administration-hub__storage-card">
          <div className="administration-hub__card-heading">
            <div>
              <p className="eyebrow">ALMACENAMIENTO</p>
              <h2>Almacenamiento</h2>
              <p>Espacio persistente usado por los datos gestionados por BloodKeeper.</p>
            </div>
          </div>
          {storageLoading ? <p className="administration-hub__system-loading">Calculando espacio…</p> : storage === null ? <p className="administration-hub__notice">La medición no está disponible.</p> : (
            <>
              <div className="administration-hub__storage-total">
                <div><span>Espacio usado</span><strong>{(storage.totalBytes / 1024 / 1024).toFixed(1) + " MB"}</strong><small>Datos persistentes gestionados</small></div>
                <div className="administration-hub__storage-state"><strong>Medición actualizada</strong><span>{dateLabel(storage.measuredAt)}</span></div>
              </div>
              <div className="administration-hub__storage-breakdown" aria-label="Desglose del almacenamiento">
                <article><span className="administration-hub__storage-icon">▤</span><div><small>Base de datos</small><strong>{(storage.databaseBytes / 1024 / 1024).toFixed(1) + " MB"}</strong><span>{storage.totalBytes > 0 ? Math.round(storage.databaseBytes / storage.totalBytes * 100) : 0}% del total</span><i><b style={{ width: `${storage.totalBytes > 0 ? Math.min(100, storage.databaseBytes / storage.totalBytes * 100) : 0}%` }} /></i></div></article>
                <article><span className="administration-hub__storage-icon">▧</span><div><small>Retratos de personajes</small><strong>{(storage.portraitBytes / 1024 / 1024).toFixed(1) + " MB"}</strong><span>{storage.portraitCount} archivos · {storage.totalBytes > 0 ? Math.round(storage.portraitBytes / storage.totalBytes * 100) : 0}% del total</span><i><b style={{ width: `${storage.totalBytes > 0 ? Math.min(100, storage.portraitBytes / storage.totalBytes * 100) : 0}%` }} /></i></div></article>
                <article><span className="administration-hub__storage-icon">▱</span><div><small>Copias de seguridad</small><strong>{(storage.backupBytes / 1024 / 1024).toFixed(1) + " MB"}</strong><span>{storage.backupFiles} archivos · {storage.totalBytes > 0 ? Math.round(storage.backupBytes / storage.totalBytes * 100) : 0}% del total</span><i><b style={{ width: `${storage.totalBytes > 0 ? Math.min(100, storage.backupBytes / storage.totalBytes * 100) : 0}%` }} /></i></div></article>
              </div>
              <div className="administration-hub__storage-columns">
                <section className="administration-hub__storage-panel"><div className="administration-hub__system-panel-heading"><div><p className="eyebrow">MEDICIÓN</p><h3>Resumen del espacio</h3></div><span className="administration-hub__system-badge administration-hub__system-badge--success">Actualizado</span></div><dl className="administration-hub__system-rows"><div><dt>Alcance</dt><dd>{storage.scope}</dd></div><div><dt>Retratos almacenados</dt><dd>{storage.portraitCount}</dd></div><div><dt>Copias contabilizadas</dt><dd>{storage.backupFiles}</dd></div><div><dt>Última medición</dt><dd>{dateLabel(storage.measuredAt)}</dd></div></dl></section>
                <section className="administration-hub__storage-panel"><div className="administration-hub__system-panel-heading"><div><p className="eyebrow">ALCANCE</p><h3>Política de almacenamiento</h3></div></div><div className="administration-hub__storage-policy"><p>La medición incluye PostgreSQL y las copias persistentes.</p><p>Los retratos ya están incluidos en la base de datos y no se cuentan dos veces.</p><p>No incluye imágenes Docker, código ni logs del host.</p></div></section>
              </div>
              <p className="administration-hub__system-note">El almacenamiento y las copias permanecen contenidos dentro del entorno Docker. La administración del host continúa realizándose mediante los scripts SSH existentes.</p>
            </>
          )}
        </article>
      ) : null}
      {activeTab === "backups" ? (
        <article className="administration-hub__card administration-hub__backup-card administration-hub__backup-card--polished">
          <div className="administration-hub__card-heading">
            <div>
              <p className="eyebrow">SEGURIDAD</p>
              <h2>Copias de seguridad</h2>
              <p>Consulta el último estado disponible y solicita una copia manual cuando lo necesites.</p>
            </div>
          </div>
          {backupStatusLoading ? (
            <p className="administration-hub__system-loading">Comprobando copias…</p>
          ) : backupStatus === null ? (
            <p className="administration-hub__notice">El estado de las copias no está disponible.</p>
          ) : (
            <>
              <section className="administration-hub__backup-summary" aria-label="Última copia">
                <div className="administration-hub__backup-result">
                  <span className="administration-hub__backup-result-icon" aria-hidden="true">✓</span>
                  <div><span>Última copia</span><strong>{backupStatusLabel(backupStatus.status)}</strong><small>{dateLabel(backupStatus.lastRunAt)}</small></div>
                </div>
                <div className="administration-hub__backup-summary-metric"><span>Tamaño</span><strong>{sizeLabel(backupStatus.sizeBytes)}</strong></div>
                <div className="administration-hub__backup-summary-metric"><span>Integridad</span><strong>{integrityLabel(backupStatus.integrity)}</strong></div>
                <div className="administration-hub__backup-action administration-hub__backup-action--summary"><button type="button" onClick={() => { void requestManualBackup() }} disabled={backupRequestPending}>{backupRequestPending ? "Solicitando copia…" : "Crear copia ahora"}</button></div>
              </section>
              {backupStatus.error !== null ? <p className="administration-hub__notice administration-hub__backup-error" role="status">{backupStatus.error}</p> : null}
              <div className="administration-hub__backup-columns">
                <section className="administration-hub__backup-panel">
                  <div className="administration-hub__system-panel-heading"><div><p className="eyebrow">ESTADO</p><h3>Estado de la copia</h3></div><span className="administration-hub__system-badge administration-hub__system-badge--success">Disponible</span></div>
                  <dl className="administration-hub__system-rows"><div><dt>Última ejecución</dt><dd>{dateLabel(backupStatus.lastRunAt)}</dd></div><div><dt>Última copia correcta</dt><dd>{dateLabel(backupStatus.lastSuccessfulBackupAt)}</dd></div><div><dt>Integridad</dt><dd>{integrityLabel(backupStatus.integrity)}</dd></div></dl>
                </section>
                <section className="administration-hub__backup-panel">
                  <div className="administration-hub__system-panel-heading"><div><p className="eyebrow">ARCHIVO GENERADO</p><h3>Detalles de la copia</h3></div></div>
                  <dl className="administration-hub__system-rows"><div><dt>Archivo</dt><dd>{backupStatus.archiveName ?? "No disponible"}</dd></div><div><dt>Tamaño</dt><dd>{sizeLabel(backupStatus.sizeBytes)}</dd></div></dl>
                </section>
              </div>
              <div className="administration-hub__backup-warning" role="note"><strong>Restauración protegida</strong><span>La restauración reemplaza los datos actuales y continúa realizándose exclusivamente por SSH.</span></div>
            </>
          )}
          <p className="administration-hub__system-note">Las copias permanecen contenidas dentro del entorno Docker. La restauración continúa realizándose exclusivamente por SSH.</p>
        </article>
      ) : null}
    </section>
  )
}

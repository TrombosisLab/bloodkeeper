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
} from '../types/system-operations.types'

import type {
  AdministrationRole,
  AdministrationUser,
} from '../types/user-administration.types'

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
  | 'system'
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
          <button
            type="button"
            className="administration-hub__create-launcher"
            aria-expanded={
              showCreateAccount
            }
            aria-controls="administration-create-account"
            onClick={() =>
              setShowCreateAccount(
                (current) =>
                  !current,
              )
            }
          >
            <span>
              <strong>
                Crear cuenta
              </strong>

              <small>
                Alta manual de un usuario con sus roles iniciales.
              </small>
            </span>

            <span aria-hidden="true">
              {showCreateAccount
                ? '−'
                : '+'}
            </span>
          </button>

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

                <h2>
                  Usuarios y cuentas
                </h2>
              </div>

              <span className="administration-hub__count">
                {users.length}
              </span>
            </div>

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
                {users.map(
                  (user) => {
                    const username =
                      readableUsername(
                        user.username,
                      )

                    return (
                      <div
                        className="administration-hub__user"
                        key={
                          user.id
                        }
                      >
                        <div className="administration-hub__identity">
                          <strong>
                            {
                              user.displayName
                            }
                          </strong>

                          {username !==
                          null ? (
                            <span>
                              {
                                username
                              }
                            </span>
                          ) : null}
                        </div>

                        <span
                          className={
                            user.status ===
                            'active'
                              ? 'administration-hub__status administration-hub__status--active'
                              : 'administration-hub__status'
                          }
                        >
                          {statusLabel(
                            user.status,
                          )}
                        </span>

                        <div
                          className="administration-hub__roles administration-hub__roles--user"
                          aria-label={`Roles de ${user.displayName}`}
                        >
                          {roles.map(
                            (
                              role,
                            ) => (
                              <label
                                key={
                                  role
                                }
                                className={
                                  user.roles.includes(
                                    role,
                                  )
                                    ? 'administration-hub__role-toggle administration-hub__role-toggle--active'
                                    : 'administration-hub__role-toggle'
                                }
                              >
                                <input
                                  checked={
                                    user.roles.includes(
                                      role,
                                    )
                                  }
                                  onChange={() =>
                                    void toggleRole(
                                      user,
                                      role,
                                    )
                                  }
                                  type="checkbox"
                                />

                                <span>
                                  {
                                    role
                                  }
                                </span>
                              </label>
                            ),
                          )}
                        </div>

                        <div className="administration-hub__actions">
                          <button
                            type="button"
                            className={
                              user.status ===
                              'active'
                                ? 'administration-hub__compact-action administration-hub__compact-action--danger'
                                : 'administration-hub__compact-action administration-hub__compact-action--success'
                            }
                            onClick={() =>
                              void status(
                                user,
                              )
                            }
                          >
                            {user.status ===
                            'active'
                              ? 'Desactivar'
                              : 'Activar'}
                          </button>

                          <button
                            type="button"
                            className="administration-hub__compact-action administration-hub__compact-action--secondary"
                            onClick={() =>
                              void reset(
                                user,
                              )
                            }
                          >
                            Restablecer contraseña
                          </button>
                        </div>
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

      {activeTab === 'system' ? (
        <article className="administration-hub__card administration-hub__operations-card">
          <div className="administration-hub__card-heading">
            <div>
              <p className="eyebrow">
                SISTEMA
              </p>

              <h2>
                Operaciones del sistema
              </h2>
            </div>
          </div>

          {diagnosticsLoading ? (
            <p>
              Comprobando estado…
            </p>
          ) : diagnostics ===
            null ? (
            <p>
              El diagnóstico no está disponible.
            </p>
          ) : (
            <dl className="administration-hub__diagnostics administration-hub__diagnostics--cards">
              <div>
                <dt>
                  Aplicación
                </dt>
                <dd>
                  {diagnostics.status ===
                  'ok'
                    ? 'Operativa'
                    : 'Estado degradado'}
                </dd>
              </div>

              <div>
                <dt>API</dt>
                <dd>
                  {diagnosticLabel(
                    diagnostics
                      .services.api,
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  PostgreSQL
                </dt>
                <dd>
                  {diagnosticLabel(
                    diagnostics
                      .services
                      .database,
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Versión
                </dt>
                <dd>
                  {
                    diagnostics.version
                  }
                </dd>
              </div>
            </dl>
          )}

          <p className="administration-hub__system-note">
            Contenedores, recursos del host, logs Docker y
            reinicios continúan gestionándose mediante los
            scripts SSH existentes.
          </p>
        </article>
      ) : null}

      {activeTab === 'backups' ? (
        <article className="administration-hub__card administration-hub__backup-card">
          <div className="administration-hub__card-heading">
            <div>
              <p className="eyebrow">
                SEGURIDAD
              </p>

              <h2>
                Copias de seguridad
              </h2>
            </div>
          </div>

          {backupStatusLoading ? (
            <p>
              Comprobando copias…
            </p>
          ) : backupStatus ===
            null ? (
            <p>
              El estado de las copias no está disponible.
            </p>
          ) : (
            <>
              <dl className="administration-hub__diagnostics administration-hub__diagnostics--cards">
                <div>
                  <dt>
                    Última ejecución
                  </dt>
                  <dd>
                    {backupStatusLabel(
                      backupStatus.status,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Fecha de ejecución
                  </dt>
                  <dd>
                    {dateLabel(
                      backupStatus.lastRunAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Última copia correcta
                  </dt>
                  <dd>
                    {dateLabel(
                      backupStatus.lastSuccessfulBackupAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Integridad
                  </dt>
                  <dd>
                    {integrityLabel(
                      backupStatus.integrity,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Archivo
                  </dt>
                  <dd>
                    {backupStatus.archiveName ??
                      'No disponible'}
                  </dd>
                </div>

                <div>
                  <dt>
                    Tamaño
                  </dt>
                  <dd>
                    {sizeLabel(
                      backupStatus.sizeBytes,
                    )}
                  </dd>
                </div>
              </dl>

              {backupStatus.error !==
              null ? (
                <p
                  className="administration-hub__notice"
                  role="status"
                >
                  {
                    backupStatus.error
                  }
                </p>
              ) : null}
            </>
          )}

          <div className="administration-hub__backup-action">
            <button
              type="button"
              onClick={() => {
                void requestManualBackup()
              }}
              disabled={
                backupRequestPending
              }
            >
              {backupRequestPending
                ? 'Solicitando copia…'
                : 'Crear copia ahora'}
            </button>
          </div>

          <p className="administration-hub__system-note">
            La copia manual usa el mismo procedimiento
            controlado del servidor. La restauración
            continúa realizándose exclusivamente por SSH.
          </p>
        </article>
      ) : null}
    </section>
  )
}

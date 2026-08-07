# SPEC-016 – USERS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-016 |
| Documento | USERS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.1 |
| Estado | Aprobado — ampliación 016-C activa |

## Propósito
Definir la gestión de usuarios de Vampiro V5 Revolution.

## Funciones
- Crear usuarios.
- Consultar usuarios.
- Editar datos permitidos.
- Activar o desactivar cuentas.
- Gestionar credenciales mediante mecanismos seguros.
- Asignar roles y permisos según las reglas del sistema.

## Datos mínimos
- Identificador interno.
- Nombre de usuario.
- Nombre visible.
- Estado de la cuenta.
- Rol o roles aplicables.
- Fechas técnicas necesarias para auditoría y mantenimiento.

## Reglas
- Los nombres de usuario deberán ser únicos.
- La eliminación física se evitará cuando pueda romper trazabilidad o relaciones históricas.
- Las cuentas desactivadas no podrán iniciar sesión.
- Los datos técnicos no deberán exponerse innecesariamente en la interfaz.

## Administración
La gestión completa de usuarios estará reservada a perfiles autorizados.

## Criterios de aceptación
- Gestión segura y sencilla.
- Validaciones claras.
- Desactivación funcional.
- Integración con autenticación y permisos.
<!-- SPEC-016-C:START -->

## 016-C — Autorregistro limitado de jugadores

### Propósito

Permitir que una persona sin sesión pueda crear su propia cuenta de jugador desde la pantalla de acceso, sin concederse privilegios administrativos ni elegir roles.

### Contrato funcional

- La pantalla de login ofrecerá una acción explícita **Crear cuenta**.
- El formulario de registro solicitará únicamente:
  - nombre de usuario;
  - nombre visible;
  - contraseña.
- El registro será una operación pública estrictamente limitada a la creación de cuentas de jugador.
- La cuenta se creará siempre con:
  - estado `active`;
  - rol único `player`.
- El cliente no podrá seleccionar ni enviar roles, estado, permisos ni datos técnicos.
- El backend será la autoridad y no confiará en restricciones de interfaz.
- Tras registrarse correctamente, el usuario volverá al flujo de login normal.
- El registro no iniciará sesión automáticamente.
- Un administrador podrá modificar posteriormente los roles mediante la gestión administrativa ya existente.

### Backend

Se añadirá una ruta pública separada de la administración:

`POST /users/register`

Body permitido:

```json
{
  "username": "jugador",
  "displayName": "Jugador",
  "password": "contraseña segura"
}
```

Reglas:

- El body aceptará exactamente `username`, `displayName` y `password`.
- Cualquier campo adicional, incluidos `roles`, `status` o permisos, será rechazado.
- Se reutilizarán las reglas canónicas existentes de usuario y contraseña.
- Se reutilizará el mecanismo Scrypt existente.
- Se reutilizará la persistencia de usuarios existente.
- El nombre de usuario seguirá siendo único.
- Un nombre de usuario ya existente devolverá conflicto HTTP `409`.
- Un payload malformado devolverá HTTP `400`.
- Una violación de reglas de usuario o contraseña devolverá HTTP `422`.
- La respuesta no expondrá hash, contraseña ni datos técnicos innecesarios.

### Seguridad y autorización

- El endpoint de autorregistro será público únicamente por necesidad funcional.
- No permitirá crear cuentas `admin` ni `narrator`.
- No permitirá crear cuentas desactivadas.
- No permitirá asignar permisos individuales.
- `POST /users` y el resto de la administración de usuarios continuarán siendo exclusivamente administrativos.
- La UI no sustituirá las restricciones del backend.

### Interfaz

- El login existente conservará su función actual.
- Desde el estado anónimo se podrá alternar entre **Iniciar sesión** y **Crear cuenta**.
- El registro mostrará validaciones y errores comprensibles.
- No se crearán pantallas administrativas nuevas en este bloque.

### Fuera de alcance

- Autoasignación de roles distintos de `player`.
- Autoasignación de permisos.
- Aprobación manual previa de cuentas.
- Verificación por correo electrónico.
- Servicios externos.
- Recuperación de contraseña desde la interfaz.
- Gestión administrativa adicional.
- Cambios de esquema Prisma no requeridos por el contrato actual.
- Auto-login tras el registro.

### Criterios de aceptación

- Una persona anónima puede crear una cuenta válida desde el login.
- La nueva cuenta queda activa y exclusivamente con rol `player`.
- Manipular la petición no permite elevar privilegios.
- Las reglas existentes de username y contraseña se mantienen.
- Un username duplicado se rechaza correctamente.
- La nueva cuenta puede iniciar sesión mediante el flujo existente.
- La administración de usuarios actual no cambia su autorización.
- No se exponen credenciales ni hashes.

<!-- SPEC-016-C:END -->

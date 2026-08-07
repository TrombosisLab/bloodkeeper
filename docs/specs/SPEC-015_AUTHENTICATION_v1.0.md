# SPEC-015 – AUTHENTICATION

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-015 |
| Documento | AUTHENTICATION.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Cerrada (2026-08-07) |

## Propósito
Definir el sistema de autenticación para identificar de forma segura a los usuarios de la plataforma.

## Requisitos
- Inicio y cierre de sesión.
- Contraseñas almacenadas mediante mecanismos seguros del framework.
- Sesiones seguras.
- Protección frente a intentos de acceso no autorizados.
- Mensajes de error comprensibles sin revelar información sensible.
- No depender de servicios externos ni de Internet.

## Acceso
Las áreas privadas exigirán autenticación. Las rutas públicas deberán limitarse a las estrictamente necesarias.

## Recuperación
Al funcionar en una red local sin dependencia de correo externo, la recuperación de acceso deberá poder gestionarse de forma administrativa y segura.

## Seguridad
- No almacenar contraseñas en texto plano.
- Protección CSRF cuando corresponda.
- Cookies y sesiones configuradas de forma segura.
- Registro de eventos relevantes de autenticación cuando aporte valor.

## Criterios de aceptación
- Login y logout funcionales.
- Acceso privado protegido.
- Credenciales tratadas de forma segura.
- Funcionamiento completo sin Internet.

<!-- SPEC-015-CLOSURE:START -->

## Acta de cierre — 2026-08-07

SPEC-015 queda cerrada tras validar sus tres bloques funcionales.

### 015-A — Credenciales y administrador inicial

- Contraseñas almacenadas exclusivamente mediante hash Scrypt.
- Reglas de usuario y contraseña centralizadas.
- Administrador inicial gestionable localmente.
- Sin persistencia de contraseñas en texto plano.

### 015-B — Login, logout y sesiones

- Login y logout funcionales.
- Sesiones expirables y revocables.
- Token bruto de sesión no persistido.
- Cookie de sesión `HttpOnly` y `SameSite=Strict`.
- Flag `Secure` derivado del transporte.
- Error de credenciales genérico.
- Aplicación web protegida por autenticación.
- Áreas privadas backend protegidas.
- Login y health permanecen como rutas públicas necesarias.
- Sin almacenamiento de credenciales o tokens en `localStorage` o
  `sessionStorage`.
- Sin dependencia de proveedores externos de identidad ni de Internet.

### 015-C — Recuperación administrativa

- Restablecimiento local de contraseña para una cuenta existente.
- La nueva contraseña reutiliza las reglas vigentes y se almacena como hash
  Scrypt.
- Persistencia limitada a `passwordHash`.
- Todas las sesiones anteriores de la cuenta quedan revocadas.
- Herramienta administrativa disponible por SSH.
- Sin endpoint HTTP ni interfaz de Administración.
- Sin edición de nombre visible, estado, roles o permisos.
- Sin creación, listado o gestión general de usuarios.
- SPEC-016 no se adelanta.

### Seguridad y validación

- Mitigación CSRF adecuada al alcance actual mediante `SameSite=Strict`.
- No se demuestra necesidad adicional de token CSRF con la arquitectura
  vigente.
- Tests focalizados de autenticación correctos.
- Suite API completa correcta.
- Integración API completa correcta.
- Suite web completa correcta.
- Typecheck y build API/web correctos.
- `check-development-workflow.sh` correcto.
- `check.sh` correcto.
- Web, API y PostgreSQL healthy.
- Runtime API sincronizado con el host.

### Continuidad

- SPEC-016.A continúa suspendida en su stash existente.
- Este cierre no aplica ni modifica dicho stash.
- Este cierre no inicia automáticamente SPEC-016.
- No se realiza push automático.

<!-- SPEC-015-CLOSURE:END -->

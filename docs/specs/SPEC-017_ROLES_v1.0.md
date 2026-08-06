# SPEC-017 – ROLES

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-017 |
| Documento | ROLES.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir los perfiles funcionales principales de la plataforma.

## Roles iniciales

### Administrador
Responsable de la administración técnica y funcional autorizada del sistema.

### Narrador
Gestiona crónicas, contenido narrativo y los recursos sobre los que tenga autorización.

### Jugador
Accede y gestiona sus personajes y la información que tenga autorizada dentro de sus crónicas.

## Principios
- Mínimo privilegio.
- Los roles describen responsabilidades, no deben usarse para introducir excepciones arbitrarias.
- El sistema deberá permitir evolucionar sin reescribir la arquitectura de autorización.

## Reglas
Los permisos efectivos podrán depender del rol y del contexto, por ejemplo la pertenencia a una crónica o la propiedad de un personaje.

## Criterios de aceptación
- Roles claramente diferenciados.
- Sin privilegios implícitos no documentados.
- Integración con el sistema de permisos.

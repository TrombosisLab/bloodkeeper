# SPEC-018 – PERMISSIONS

## Información
| Campo | Valor |
|---|---|
| Código | SPEC-018 |
| Documento | PERMISSIONS.md |
| Proyecto | Vampiro V5 Revolution |
| Versión | 1.0 |
| Estado | Aprobado |

## Propósito
Definir los principios de autorización y control de acceso de la plataforma.

## Principios
- Denegar por defecto.
- Mínimo privilegio.
- Validación en servidor.
- No confiar únicamente en ocultar controles de interfaz.
- Permisos comprensibles y mantenibles.

## Ámbitos
Los permisos podrán aplicarse a:
- Funciones administrativas.
- Usuarios.
- Personajes.
- Crónicas.
- Información narrativa.
- Configuración.
- Operaciones sensibles.

## Reglas
- Un jugador no accederá a información privada no autorizada.
- Un narrador solo gestionará los recursos permitidos por su contexto.
- Los administradores tendrán acceso técnico según las funciones definidas, evitando accesos innecesarios a información privada cuando no sean requeridos.
- Toda operación sensible deberá comprobar permisos en backend.

## Interfaz
La interfaz ocultará o deshabilitará acciones no disponibles, pero esto nunca sustituirá la validación del servidor.

## Criterios de aceptación
- Accesos no autorizados bloqueados.
- Permisos aplicados consistentemente.
- Pruebas específicas de autorización.
- Arquitectura preparada para permisos contextuales.

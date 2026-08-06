# DOC-001 -- PROJECT_CHARTER

## Información del documento

  Campo             Valor
  ----------------- ------------------------
  Código            DOC-001
  Documento         PROJECT_CHARTER.md
  Proyecto          Vampiro V5 Revolution
  Versión           1.0
  Estado            Aprobado
  Autor             Equipo de Arquitectura
  Aprobado por      Dirección del Proyecto
  Documento padre   Ninguno

------------------------------------------------------------------------

# 1. Propósito del proyecto

**Vampiro V5 Revolution** nace con el objetivo de crear una plataforma
web modular para la gestión integral de partidas de Vampiro: La
Mascarada V5.

El proyecto no pretende ser únicamente una ficha digital de personajes,
sino una plataforma organizada, mantenible y extensible que permita
centralizar toda la información relacionada con una crónica en un único
sistema.

Desde su concepción, el proyecto prioriza la calidad del software, la
estabilidad de la arquitectura y la facilidad de mantenimiento por
encima de la rapidez en el desarrollo.

# 2. Problema que pretende resolver

Actualmente la información de una partida suele encontrarse dispersa
entre documentos, hojas de personaje, aplicaciones diferentes, notas
personales y archivos independientes.

Vampiro V5 Revolution pretende unificar toda esta información dentro de
una única plataforma.

# 3. Objetivos

## Estratégicos

-   Centralizar la información de una crónica.
-   Facilitar el trabajo del Narrador.
-   Mejorar la experiencia de los jugadores.
-   Garantizar la continuidad del proyecto.
-   Diseñar una arquitectura modular.

## Técnicos

-   Arquitectura modular.
-   Código limpio y mantenible.
-   Documentación completa.
-   Automatización.
-   Instalación reproducible.
-   Desarrollo incremental.
-   Tecnologías estables.

# 4. Alcance inicial

El MVP incluirá:

-   Gestión de usuarios.
-   Sistema de autenticación.
-   Gestión de personajes.
-   Visualización y edición de fichas.
-   Persistencia de datos.
-   Arquitectura modular operativa.

# 5. Fuera del alcance inicial

-   Acceso desde Internet.
-   Aplicaciones móviles.
-   Juego online.
-   Chat integrado.
-   Automatización completa del reglamento.
-   Integraciones externas.
-   Sincronización en la nube.

# 6. Usuarios previstos

-   **Administrador:** configuración y mantenimiento.
-   **Narrador:** gestión de crónicas y contenido.
-   **Jugador:** gestión de sus personajes.

# 7. Principios fundamentales

-   Simplicidad.
-   Modularidad.
-   Mantenibilidad.
-   Estabilidad.
-   Automatización.
-   Reproducibilidad.
-   Documentación.
-   Seguridad.
-   Desarrollo incremental.
-   Compatibilidad.
-   Prioridad a versiones estables.

# 8. Restricciones

-   Red local.
-   Sin acceso a Internet.
-   Ubuntu Server 24.04 LTS.
-   VirtualBox.
-   Administración por SSH desde Windows.
-   Docker.
-   Instalación automatizada mediante scripts.

# 9. Criterios de éxito

-   Instalación completa mediante documentación oficial.
-   Arquitectura preparada para crecer sin modificar el núcleo.
-   Documentación sincronizada con el desarrollo.
-   Mantenimiento sostenible a largo plazo.
-   Decisiones trazables.

# 10. Filosofía de desarrollo

El desarrollo será incremental. Cada funcionalidad será diseñada,
documentada, implementada, probada y validada antes de comenzar la
siguiente.

# 11. Relación con el resto de la documentación

Este documento define el nacimiento del proyecto. No define
arquitectura, stack, base de datos, diseño visual ni modelo de dominio.

# 12. Declaración final

Vampiro V5 Revolution se concibe como un proyecto de ingeniería de
software a largo plazo. El éxito se medirá por su capacidad de
evolucionar de forma ordenada, documentada y sostenible.

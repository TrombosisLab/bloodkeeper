# SPEC-001 -- PROJECT_BOOTSTRAP.md

# Información

  Campo       Valor
  ----------- -----------------------
  Código      SPEC-001
  Documento   PROJECT_BOOTSTRAP.md
  Proyecto    Vampiro V5 Revolution
  Versión     1.0
  Estado      Aprobado

# Objetivo

Definir la implementación del primer entorno funcional del proyecto.

# Alcance

Construir una aplicación mínima ejecutándose sobre Ubuntu Server 24.04
LTS mediante Docker.

## Debe incluir

-   Instalación automática mediante scripts `.sh`.
-   Docker y Docker Compose.
-   Repositorio Git inicializado.
-   Estructura del proyecto.
-   Contenedores funcionando.
-   Backend accesible.
-   Frontend accesible.
-   Página principal.
-   Layout base.
-   Pantalla de ficha vacía.
-   Registro de logs.
-   Documentación de instalación.

## No debe incluir

-   Login.
-   Base de datos funcional.
-   Gestión de usuarios.
-   Reglas de Vampiro.
-   Persistencia.
-   Dados.
-   API pública.

# Entregables

-   Scripts de instalación.
-   Proyecto Docker funcional.
-   Aplicación accesible desde navegador.
-   Manual de despliegue.
-   Manual de validación.

# Criterios de aceptación

-   Instalación desde servidor limpio.
-   Sin errores durante el despliegue.
-   Contenedores activos.
-   Acceso web operativo.
-   Ficha vacía visible.

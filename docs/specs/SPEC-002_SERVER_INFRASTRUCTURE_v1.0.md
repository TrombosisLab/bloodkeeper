# SPEC-002 -- SERVER_INFRASTRUCTURE

## Información

  Campo       Valor
  ----------- --------------------------
  Código      SPEC-002
  Documento   SERVER_INFRASTRUCTURE.md
  Proyecto    Vampiro V5 Revolution
  Versión     1.0
  Estado      Aprobado

## 1. Propósito

Definir la infraestructura oficial sobre la que se desarrollará y
ejecutará el proyecto.

## 2. Objetivos

-   Entorno estable.
-   Reproducible.
-   Mantenible.
-   Automatizable.
-   Recuperable.

## 3. Plataforma

-   Ubuntu Server 24.04 LTS (instalación mínima).
-   VirtualBox durante el desarrollo.
-   Acceso exclusivamente mediante SSH.
-   Sin entorno gráfico.

## 4. Recursos mínimos

-   4 vCPU
-   4 GB RAM
-   34 GB de disco
-   Red local

## 5. Instalación

Toda la preparación del servidor deberá realizarse mediante scripts
`.sh` idempotentes. No se permitirán procedimientos manuales complejos.

## 6. Organización

Todo el proyecto residirá bajo un único directorio (por ejemplo
`/opt/vampiro-v5-revolution`) con estructura organizada para aplicación,
documentación, scripts, Docker, copias de seguridad y registros.

## 7. Contenedores

Toda la aplicación se ejecutará mediante Docker. El sistema operativo
solo contendrá las dependencias necesarias para ejecutar Docker.

## 8. Seguridad

-   Principio de mínimo privilegio.
-   Configuración documentada.
-   Copias de seguridad.
-   Registros.
-   Actualizaciones controladas.

## 9. Monitorización

Se proporcionarán scripts para comprobar:

-   Estado de los contenedores.
-   Consumo de recursos.
-   Espacio disponible.
-   Estado general del sistema.

## 10. Recuperación

El entorno deberá poder reconstruirse utilizando únicamente:

-   Repositorio Git.
-   Scripts del proyecto.
-   Documentación oficial.
-   Copias de seguridad.

## 11. Criterios de aceptación

-   Instalación desde un servidor limpio.
-   Despliegue sin errores.
-   Contenedores operativos.
-   Aplicación accesible desde la red local.
-   Infraestructura completamente documentada.

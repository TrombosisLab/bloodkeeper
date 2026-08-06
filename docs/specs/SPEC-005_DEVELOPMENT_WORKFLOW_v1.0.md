# SPEC-005 -- DEVELOPMENT_WORKFLOW

## Información

  Campo       Valor
  ----------- -------------------------
  Código      SPEC-005
  Documento   DEVELOPMENT_WORKFLOW.md
  Proyecto    Vampiro V5 Revolution
  Versión     1.0
  Estado      Aprobado

## Propósito

Definir el flujo de trabajo oficial para el desarrollo del proyecto.

## Principios

-   Desarrollo incremental.
-   Cambios pequeños y verificables.
-   Calidad antes que velocidad.
-   Código limpio y documentado.
-   Automatización siempre que aporte valor.

## Flujo de trabajo

1.  Especificación aprobada.
2.  Planificación del sprint.
3.  Implementación.
4.  Revisión técnica.
5.  Validación funcional.
6.  Actualización de documentación.
7.  Integración en la rama principal.

## Control de versiones

-   Git como sistema oficial.
-   Desarrollo en ramas para cambios relevantes.
-   Integración en `main` únicamente tras validación.

## Automatización

Toda instalación, despliegue y mantenimiento repetitivo deberá
realizarse mediante scripts `.sh`.

## Validación

Cada entrega deberá incluir: - Pasos de verificación. - Resultado
esperado. - Evidencias cuando proceda.

## Criterios de aceptación

-   Flujo reproducible.
-   Sin cambios no documentados.
-   Documentación sincronizada con el código.
-   Proyecto siempre en estado funcional.

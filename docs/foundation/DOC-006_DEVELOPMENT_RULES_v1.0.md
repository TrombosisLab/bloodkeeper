# DOC-006 -- DEVELOPMENT_RULES.md

------------------------------------------------------------------------

# Información del documento

  Campo             Valor
  ----------------- --------------------------------
  Código            DOC-006
  Documento         DEVELOPMENT_RULES.md
  Proyecto          Vampiro V5 Revolution
  Versión           1.0
  Estado            Aprobado
  Autor             Equipo de Arquitectura
  Aprobado por      Dirección del Proyecto
  Documento padre   DOC-005 -- TECHNOLOGY_STACK.md

------------------------------------------------------------------------

# 1. Propósito

Este documento define las normas de desarrollo que deberán seguir todas
las personas y herramientas de IA que participen en el proyecto.

# 2. Filosofía de desarrollo

-   Desarrollo incremental.
-   Un objetivo por iteración.
-   Nunca romper funcionalidad existente.
-   Avanzar antes que perfeccionar.

# 3. Organización del código

-   Código limpio.
-   Responsabilidad única.
-   Modularidad.
-   Evitar duplicación.
-   Nombres descriptivos.
-   Comentarios solo cuando aporten valor.

# 4. Gestión de cambios

Antes de modificar código existente deberán evaluarse impacto,
compatibilidad y riesgos.

Los cambios importantes se desarrollarán en ramas independientes y se
validarán antes de integrarse.

# 5. Documentación

Una funcionalidad no se considerará finalizada hasta que su
documentación esté actualizada.

# 6. Automatización

Toda tarea repetitiva deberá automatizarse cuando sea razonable.

La instalación del servidor deberá poder realizarse mediante scripts.

# 7. Pruebas

Toda funcionalidad deberá validarse antes de darse por terminada.

Cuando no existan pruebas automatizadas se documentará un procedimiento
manual.

# 8. Uso de Inteligencia Artificial

La IA actuará como asistente de desarrollo.

Las decisiones arquitectónicas y funcionales siempre estarán gobernadas
por la documentación oficial.

# 9. Control de versiones

Todo cambio importante utilizará Git.

Las modificaciones relevantes de infraestructura podrán apoyarse en
snapshots de VirtualBox.

# 10. Resolución de problemas

Proceso obligatorio:

1.  Comprender.
2.  Analizar.
3.  Diseñar.
4.  Implementar.
5.  Validar.
6.  Documentar.

# 11. Declaración final

La prioridad del proyecto será siempre la calidad, la claridad y la
mantenibilidad por encima de la velocidad.

> Una solución sencilla y bien comprendida siempre será preferible a una
> solución compleja que solo funcione aparentemente.

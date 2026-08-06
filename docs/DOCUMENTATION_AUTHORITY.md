# Autoridad documental del proyecto

## Propósito

Este documento define cómo deben interpretarse las fuentes incorporadas al
repositorio de BloodKeeper / Vampiro V5 Revolution.

## Jerarquía operativa

Ante una contradicción se aplicará este orden:

1. Instrucciones expresas del usuario.
2. Código y tests validados del repositorio.
3. `01_CONTINUIDAD_ACTUAL.md`, cuando exista.
4. `99_DECISIONES_ARQUITECTURALES.md`, cuando exista.
5. SPEC activas de `docs/specs/`, usando siempre la versión vigente.
6. Documentación fundacional de `docs/foundation/`.
7. Documentación histórica de `docs/historical/`.

El código y los tests describen el estado real implementado. Las SPEC
autorizan y limitan el siguiente trabajo, pero no permiten ignorar una
implementación ya validada ni iniciar funciones futuras por deducción.

## Versiones

- La versión vigente de cada SPEC se encuentra directamente en `docs/specs/`.
- Las versiones sustituidas se conservan en `docs/specs/archive/`.
- Una revisión futura debe crear un archivo con nueva versión y archivar la
  anterior; no debe sobrescribirse silenciosamente una versión ya importada.
- Para SPEC-026, la versión activa es la **v1.1** y la **v1.0** es histórica.

## Estado original y estado operativo

El campo `Estado` incluido dentro de las SPEC procede del pack original y
expresa su aprobación documental. No demuestra que una SPEC esté actualmente
pendiente, activa, suspendida o cerrada.

El estado operativo vigente se mantiene en `docs/specs/README.md` y debe
actualizarse únicamente después de una auditoría o decisión explícita del
usuario.

## Terminología heredada

Algunas SPEC originales mencionan **Gemini** como actor de desarrollo. Esas
menciones son terminología heredada del documento de origen y no designan al
desarrollador actual.

En la operativa vigente:

- ChatGPT dirige y desarrolla el proyecto junto al usuario.
- No se preparan instrucciones para Gemini salvo petición expresa.
- Las obligaciones técnicas asociadas a aquellas frases se interpretan como
  obligaciones del asistente de desarrollo actual, sin repetir el nombre
  heredado como actor vigente.

Los textos originales se conservan sin reescritura para mantener su
trazabilidad.

## Fronteras

- `docs/historical/` nunca tiene autoridad sobre una SPEC activa.
- El prompt histórico de Gemini no forma parte del flujo operativo.
- No se añaden pantallas, rutas, módulos o mejoras que una SPEC vigente no
  autorice.
- No se inicia una SPEC posterior para completar artificialmente una SPEC
  anterior.
- Los manuales comerciales de Vampiro V5 no se incorporan a Git.

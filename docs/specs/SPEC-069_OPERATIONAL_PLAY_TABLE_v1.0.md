# SPEC-069 — Mesa operativa de juego

## Objetivo

Convertir `Crónica > Jugar` en la pantalla principal durante una partida de Vampiro V5, manteniendo intacta la navegación global y reuniendo en una sola vista el estado público de la sesión.

## Contrato visual

- Columna izquierda: sesión activa y selector compacto de sesiones.
- Centro: situación narrativa, escena actual, tiradas, contexto inmediato, recursos de Sangre y notas.
- Columna derecha: retrato, reservas y resumen del personaje.
- El diseño debe conservar el lenguaje visual común de Crónicas y adaptarse sin desbordamientos.

## Contrato funcional

- Tiradas rápidas mediante `Atributo + Habilidad`, además del modo manual cuando no existe personaje asociado.
- Historial de tiradas visible conforme a SPEC-068.
- Control de Enardecimiento y Alimentación operativos. No se duplica Control de Enardecimiento como «Rubor de la Vida».
- Notas privadas y compartidas persistidas por sesión.
- La escena visible se obtiene del workspace canónico, pero la lista de preparación continúa siendo privada del Narrador.
- Historia, eventos, PNJ, localizaciones, documentos, artefactos y organizaciones proceden de relaciones canónicas.

## Privacidad

- El Narrador conserva acceso completo.
- Los participantes sólo reciben la escena operativa y los recursos marcados como compartidos.
- Los recursos genéricos incorporan visibilidad `narrator_only` o `chronicle_participants` y pueden vincularse a sesiones.
- Los datos privados de preparación y las notas del Narrador no se proyectan en `Jugar`.

## Persistencia

- `ChronicleResource.visibility` controla la proyección en mesa.
- `ChronicleSessionResource` enlaza documentos, artefactos y organizaciones con una sesión.
- La proyección compartida de historias expone los identificadores de sesión necesarios para localizar la historia activa.

## Validación

- Migración Prisma y generación de cliente.
- Build y tests completos de API y Web dentro de Docker.
- Comprobación visual con Narrador y jugador sobre la misma crónica y sesión.

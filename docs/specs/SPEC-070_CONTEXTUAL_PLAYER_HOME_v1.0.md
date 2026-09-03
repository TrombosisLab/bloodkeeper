# SPEC-070 — Inicio contextual del jugador

| Campo | Valor |
| --- | --- |
| Código | SPEC-070 |
| Versión | 1.0 |
| Estado | Aprobada para implementación |
| Dependencias | SPEC-063, SPEC-067, SPEC-068 y SPEC-069 |

## Propósito

Transformar Inicio en un tablero contextual del jugador. No duplica la mesa de juego: permite recuperar rápidamente la crónica, personaje y sesión con los que continuar.

## Alcance

- Tarjetas para todas las crónicas activas del usuario.
- Selector de crónica y, cuando proceda, selector de personajes propios asociados a la crónica.
- Bloque persistente «Continuar donde lo dejaste».
- Estado del personaje: retrato, clan, Hambre, Salud, Fuerza de voluntad, Humanidad, Potencia de Sangre, Ambición y Deseo.
- Crónica y sesión activa o próxima; escena actual cuando sea pública.
- Recapitulación de sesión anterior basada inicialmente en el resumen público existente.
- Contexto de sesión visible para participantes: localización, PNJ, organización/recurso y amenaza/evento conocido.
- Pendientes: PX disponible, notas públicas nuevas y recordatorios visibles.
- Eliminación de la tirada manual y su historial de Inicio. Permanecen en Jugar y en la ficha.

## Contrato y privacidad

Se añade una proyección de lectura específica para Inicio. Nunca compone su respuesta desde DTOs de edición ni devuelve campos del Narrador por accidente.

- Un jugador sólo recibe personajes de su propiedad.
- Un participante sólo recibe recursos con visibilidad para participantes y la escena pública aplicable.
- Las notas privadas del Narrador, preparación y datos de otros personajes no forman parte de la proyección.
- El Narrador conserva acceso a su contexto autorizado, sin convertir Inicio en una pantalla de administración.

## Persistencia de continuidad

Se incorpora una preferencia de contexto por usuario con crónica, personaje y sesión opcional, y fecha de último acceso. Se valida en cada escritura que la membresía siga activa, que el personaje pertenezca al usuario y que la sesión pertenezca a la crónica.

## Recapitulación y pendientes

La primera versión usa el `summary` de la última sesión completada/archivada como «Anteriormente…». Si no existe, el bloque comunica que el Narrador aún no ha publicado recapitulación. Un campo editorial independiente queda como extensión posterior, no como requisito de esta entrega.

Las notas públicas y recordatorios se muestran sólo cuando la política actual ya permite verlos. Los avisos dirigidos y no leídos quedan fuera de v1.0: requerirán su propia especificación y modelo.

## Diseño

Mantiene la estética BloodKeeper y la composición aprobada:

1. Bienvenida y Continuar.
2. Tarjetas de crónicas activas.
3. Franja de contexto y selector de personaje.
4. Dos paneles principales: personaje y crónica/sesión.
5. «Anteriormente…», Ambición/Deseo y «Ahora mismo».
6. Banda de pendientes.

Debe responder correctamente en escritorio y móvil, sin introducir una barra de navegación nueva ni alterar la barra lateral existente.

## Criterios de aceptación

1. Inicio no renderiza `DiceRollPanel` ni `DiceHistoryPanel`.
2. Un jugador con varias crónicas puede cambiar de crónica sin recargar.
3. Con varios personajes propios en una crónica, el selector actualiza todo el contexto del tablero.
4. Continuar recupera la última combinación persistida incluso desde otro navegador.
5. Un jugador nunca ve personajes ajenos ni notas/preparación privadas.
6. Sin crónicas, personaje, sesión o recapitulación, los estados vacíos son claros y no rompen la pantalla.
7. API y web se verifican dentro de Docker; no se añade dependencia al host.
